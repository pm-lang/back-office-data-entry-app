import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";

// POST /api/projects/[id]/images - Upload images
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from("Project")
      .select("id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    // Get current max order index
    const { data: maxOrderResult } = await supabase
      .from("ProjectImage")
      .select("orderIndex")
      .eq("projectId", projectId)
      .order("orderIndex", { ascending: false })
      .limit(1)
      .single();
    
    let nextOrder = (maxOrderResult?.orderIndex ?? -1) + 1;

    const createdImages = [];

    for (const file of files) {
      // Generate unique filename
      const ext = file.name.substring(file.name.lastIndexOf(".")) || ".jpg";
      const filename = `${uuidv4()}${ext}`;

      // Upload to Supabase Storage
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const { data, error } = await supabase.storage
        .from("worksheets")
        .upload(`${projectId}/${filename}`, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: true,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        throw error;
      }

      // Save to database
      const { data: image, error: insertError } = await supabase
        .from("ProjectImage")
        .insert({
          id: uuidv4(),
          projectId,
          filename,
          originalName: file.name,
          orderIndex: nextOrder++,
          createdAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      createdImages.push(image);
    }

    return NextResponse.json(createdImages, { status: 201 });
  } catch (error) {
    console.error("Failed to upload images:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/images?imageId=xxx - Delete an image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const imageId = request.nextUrl.searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json(
        { error: "imageId is required" },
        { status: 400 }
      );
    }

    // Get image record
    const { data: image, error: fetchError } = await supabase
      .from("ProjectImage")
      .select("*")
      .eq("id", imageId)
      .single();

    if (fetchError || !image || image.projectId !== projectId) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    // Delete file from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from("worksheets")
      .remove([`${projectId}/${image.filename}`]);
      
    if (storageError) {
      console.warn("Failed to delete from storage:", storageError);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("ProjectImage")
      .delete()
      .eq("id", imageId);

    if (deleteError) throw deleteError;

    // Re-index remaining images
    const { data: remaining } = await supabase
      .from("ProjectImage")
      .select("*")
      .eq("projectId", projectId)
      .order("orderIndex", { ascending: true });

    if (remaining) {
      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].orderIndex !== i) {
          await supabase
            .from("ProjectImage")
            .update({ orderIndex: i })
            .eq("id", remaining[i].id);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}

