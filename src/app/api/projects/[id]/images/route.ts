import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
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
    const maxOrderResult = await prisma.projectImage.findFirst({
      where: { projectId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });
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
      const image = await prisma.projectImage.create({
        data: {
          projectId,
          filename,
          originalName: file.name,
          orderIndex: nextOrder++,
        },
      });

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
    const image = await prisma.projectImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.projectId !== projectId) {
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
    await prisma.projectImage.delete({ where: { id: imageId } });

    // Re-index remaining images
    const remaining = await prisma.projectImage.findMany({
      where: { projectId },
      orderBy: { orderIndex: "asc" },
    });

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].orderIndex !== i) {
        await prisma.projectImage.update({
          where: { id: remaining[i].id },
          data: { orderIndex: i },
        });
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
