import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAuthenticated } from "@/lib/auth-utils";

const sql = neon(process.env.DATABASE_URL!);

// PUT /api/admin/content/media/folders/[id] - Rename a folder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { name } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check for duplicate name (excluding current folder)
    const existing = await sql`
      SELECT id FROM media_folders
      WHERE LOWER(name) = LOWER(${trimmedName}) AND id != ${id}::uuid
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Een map met deze naam bestaat al" },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE media_folders
      SET name = ${trimmedName}
      WHERE id = ${id}::uuid
      RETURNING id, name, created_at
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: result[0].id,
      name: result[0].name,
      createdAt: result[0].created_at,
    });
  } catch (error) {
    console.error("Failed to update folder:", error);
    return NextResponse.json(
      { error: "Failed to update folder" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/content/media/folders/[id] - Delete a folder (images become root-level)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Images will automatically have folder_id set to NULL due to ON DELETE SET NULL
    const result = await sql`
      DELETE FROM media_folders
      WHERE id = ${id}::uuid
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete folder:", error);
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 }
    );
  }
}
