import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/projects/[id] - Get project with images
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: project, error } = await supabase
      .from("Project")
      .select(`
        *,
        images:ProjectImage(*)
      `)
      .eq("id", id)
      .order("orderIndex", { referencedTable: "ProjectImage", ascending: true })
      .single();

    if (error || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, subject, description, status } = body;

    const { data: project, error } = await supabase
      .from("Project")
      .update({
        ...(name && { name }),
        ...(subject && { subject }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project and images
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete image files from Supabase Storage
    const { data: images } = await supabase
      .from("ProjectImage")
      .select("filename")
      .eq("projectId", id);
    
    if (images && images.length > 0) {
      const filePaths = images.map((img: any) => `${id}/${img.filename}`);
      const { error: storageError } = await supabase.storage
        .from("worksheets")
        .remove(filePaths);
      if (storageError) {
        console.warn("Failed to delete project folder from storage:", storageError);
      }
    }

    // Delete from database (cascade deletes images)
    const { error: deleteError } = await supabase
      .from("Project")
      .delete()
      .eq("id", id);
      
    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
