import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processImages } from "@/lib/ocr";
import { generateDocument } from "@/lib/docgen";

// POST /api/projects/[id]/generate - Generate Word document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Verify API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
      return NextResponse.json(
        {
          error:
            "Gemini API key is not configured. Please set GEMINI_API_KEY in your .env.local file. Visit Settings for setup instructions.",
        },
        { status: 400 }
      );
    }

    // Fetch project with images
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        images: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!project) {
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
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "PROCESSING" },
    });

    try {
      // Prepare image paths for Supabase Storage
      const imagesToProcess = project.images.map((img) => ({
        id: img.id,
        path: `${projectId}/${img.filename}`,
      }));

      // Process all images with OCR
      const ocrResults = await processImages(imagesToProcess, project.subject);

      // Check for failures
      const failures = ocrResults.filter((r) => !r.success);
      if (failures.length === ocrResults.length) {
        throw new Error(
          `All OCR processing failed. First error: ${failures[0]?.error || "Unknown error"}`
        );
      }

      // Save OCR text to database
      for (const result of ocrResults) {
        if (result.success) {
          await prisma.projectImage.update({
            where: { id: result.imageId },
            data: { ocrText: result.text },
          });
        }
      }

      // Collect successful OCR texts and image paths in order
      const orderedContent = project.images
        .map((img) => {
          const result = ocrResults.find((r) => r.imageId === img.id);
          if (result?.success) {
            return {
              text: result.text,
              imagePath: `${projectId}/${img.filename}`
            };
          }
          return null;
        })
        .filter((item): item is { text: string; imagePath: string } => item !== null);

      // Generate Word document
      const docBuffer = await generateDocument(
        orderedContent,
        project.name,
        project.subject
      );

      // Update project status
      await prisma.project.update({
        where: { id: projectId },
        data: { status: "COMPLETED" },
      });

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
      await prisma.project.update({
        where: { id: projectId },
        data: { status: "ERROR" },
      });
      throw processError;
    }
  } catch (error) {
    console.error("Generation failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
