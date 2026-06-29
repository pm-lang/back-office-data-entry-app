import { NextRequest, NextResponse } from "next/server";
import { processImages as processImagesGemini } from "@/lib/ocr";
import { processImages as processImagesTesseract } from "@/lib/ocr-tesseract";
import { processImagesOcrSpace } from "@/lib/ocr-space";
import { generateDocument } from "@/lib/docgen";
import { supabase } from "@/lib/supabase";

// POST /api/projects/[id]/generate - Generate Word document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    let ocrEngine = "tesseract"; // default to tesseract
    let ocrSpaceApiKey = "";
    try {
      const body = await request.json();
      if (body.ocrEngine) {
        ocrEngine = body.ocrEngine;
      }
      if (body.ocrSpaceApiKey) {
        ocrSpaceApiKey = body.ocrSpaceApiKey;
      }
    } catch (e) {
      // Ignore empty body errors
    }

    // Verify API key is configured if using Gemini
    if (ocrEngine === "gemini") {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
        return NextResponse.json(
          {
            error:
              "Gemini API key is not configured. Please set GEMINI_API_KEY in your .env.local file. Visit Settings for setup instructions.",
          },
          { status: 400 }
        );
      }
    }

    // Fetch project with images
    const { data: project, error: fetchError } = await supabase
      .from("Project")
      .select(`
        *,
        images:ProjectImage(*)
      `)
      .eq("id", projectId)
      .order("orderIndex", { referencedTable: "ProjectImage", ascending: true })
      .single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.images.length === 0) {
      return NextResponse.json(
        { error: "No images to process" },
        { status: 400 }
      );
    }

    // Update project status to processing
    await supabase
      .from("Project")
      .update({ status: "PROCESSING", updatedAt: new Date().toISOString() })
      .eq("id", projectId);

    try {
      // Prepare image paths for Supabase Storage
      const imagesToProcess = project.images.map((img: any) => ({
        id: img.id,
        path: `${projectId}/${img.filename}`,
      }));

      // Process all images with appropriate OCR engine
      let ocrResults;
      if (ocrEngine === "gemini") {
        ocrResults = await processImagesGemini(imagesToProcess, project.subject);
      } else if (ocrEngine === "ocrspace") {
        ocrResults = await processImagesOcrSpace(imagesToProcess, project.subject, ocrSpaceApiKey);
      } else {
        ocrResults = await processImagesTesseract(imagesToProcess, project.subject);
      }

      // Check for failures
      const failures = ocrResults.filter((r) => !r.success);
      if (failures.length === ocrResults.length) {
        throw new Error(
          `All OCR processing failed. First error: ${failures[0]?.error || "Unknown error"}`
        );
      }

      // Save OCR text to database - run all in parallel
      await Promise.all(
        ocrResults
          .filter((r) => r.success)
          .map((result) =>
            supabase
              .from("ProjectImage")
              .update({ ocrText: result.text })
              .eq("id", result.imageId)
          )
      );

      // Collect successful OCR texts and image paths in order
      // Also pre-download images now (before they are deleted) so docgen doesn't re-fetch
      const imageDataMap = new Map<string, Buffer>();
      await Promise.all(
        project.images.map(async (img: any) => {
          const imgPath = `${projectId}/${img.filename}`;
          const { data, error } = await supabase.storage.from("worksheets").download(imgPath);
          if (!error && data) {
            const ab = await data.arrayBuffer();
            imageDataMap.set(imgPath, Buffer.from(ab));
          }
        })
      );

      const orderedContent = project.images
        .map((img: any) => {
          const result = ocrResults.find((r) => r.imageId === img.id);
          if (result?.success) {
            const imgPath = `${projectId}/${img.filename}`;
            return {
              text: result.text,
              imagePath: imgPath,
              imageBuffer: imageDataMap.get(imgPath) ?? null,
            };
          }
          return null;
        })
        .filter((item: any): item is { text: string; imagePath: string; imageBuffer: Buffer | null } => item !== null);

      // Generate Word document
      const docBuffer = await generateDocument(
        orderedContent,
        project.name,
        project.subject
      );

      // Update project status
      await supabase
        .from("Project")
        .update({ status: "COMPLETED", updatedAt: new Date().toISOString() })
        .eq("id", projectId);

      // Cleanup images in background (after doc is ready)
      const imagePaths = project.images.map((img: any) => `${projectId}/${img.filename}`);
      Promise.all([
        imagePaths.length > 0
          ? supabase.storage.from("worksheets").remove(imagePaths)
          : Promise.resolve(),
        supabase.from("ProjectImage").delete().eq("projectId", projectId),
      ]).catch((err) => console.error("Cleanup error (non-fatal):", err));

      // Return document as downloadable file
      const filename = `${project.name.replace(/[^a-zA-Z0-9\u0900-\u097F ]/g, "_")}.docx`;
      
      return new NextResponse(new Uint8Array(docBuffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
          "Content-Length": docBuffer.length.toString(),
        },
      });
    } catch (processError) {
      // Update project status to error
      await supabase
        .from("Project")
        .update({ status: "ERROR", updatedAt: new Date().toISOString() })
        .eq("id", projectId);
      throw processError;
    }
  } catch (error) {
    console.error("Generation failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

