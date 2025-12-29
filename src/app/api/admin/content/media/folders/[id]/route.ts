import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { protectRoute } from "@/lib/permissions";

const sql = neon(process.env.DATABASE_URL!);

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/admin/content/media/folders/[id] - Rename a folder
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "media" });
    if (!authorized) return response;

    const { id } = await params;
    const { name } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    // Check site access
    const existing = await sql`SELECT site_id FROM media_folders WHERE id = ${id}::uuid`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && existing[0].site_id && !ctx!.userSites.includes(existing[0].site_id)) {
      return NextResponse.json({ error: "Geen toegang tot deze map" }, { status: 403 });
    }

    const trimmedName = name.trim();

    // Check for duplicate name within the same site (excluding current folder)
    const duplicate = await sql`
      SELECT id FROM media_folders
      WHERE LOWER(name) = LOWER(${trimmedName}) AND id != ${id}::uuid AND site_id = ${existing[0].site_id}
    `;

    if (duplicate.length > 0) {
      return NextResponse.json(
        { error: "Een map met deze naam bestaat al" },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE media_folders
      SET name = ${trimmedName}
      WHERE id = ${id}::uuid
      RETURNING id, name, created_at, site_id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: result[0].id,
      name: result[0].name,
      createdAt: result[0].created_at,
      siteId: result[0].site_id,
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
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "media" });
    if (!authorized) return response;

    const { id } = await params;

    // Check site access
    const existing = await sql`SELECT site_id FROM media_folders WHERE id = ${id}::uuid`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && existing[0].site_id && !ctx!.userSites.includes(existing[0].site_id)) {
      return NextResponse.json({ error: "Geen toegang tot deze map" }, { status: 403 });
    }

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
