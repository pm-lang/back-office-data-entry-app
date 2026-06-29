import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// PUT /api/projects/[id]/reorder - Update image order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { images } = body as {
      images: { id: string; orderIndex: number }[];
    };

    if (!images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: "Images array is required" },
        { status: 400 }
      );
    }

    // Update each image's order index
    await Promise.all(
      images.map((img) =>
        supabase
          .from("ProjectImage")
          .update({ orderIndex: img.orderIndex })
          .eq("id", img.id)
          .eq("projectId", projectId)
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder images:", error);
    return NextResponse.json(
      { error: "Failed to reorder images" },
      { status: 500 }
    );
  }
}

