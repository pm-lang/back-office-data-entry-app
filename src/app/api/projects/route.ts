import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/projects - List all projects
export async function GET() {
  try {
    const { data: projects, error } = await supabase
      .from("Project")
      .select("*, _count:ProjectImage(count)")
      .order("createdAt", { ascending: false });

    if (error) throw error;

    const formattedProjects = projects?.map(p => ({
      ...p,
      _count: {
        images: Array.isArray(p._count) ? p._count[0]?.count || 0 : 0
      }
    })) || [];

    return NextResponse.json(formattedProjects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, subject, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const { data: project, error } = await supabase
      .from("Project")
      .insert({
        name: name.trim(),
        subject: subject || "OTHER",
        description: description || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
