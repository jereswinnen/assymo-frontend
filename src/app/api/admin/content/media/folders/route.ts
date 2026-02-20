import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { protectRoute } from "@/lib/permissions";

export interface MediaFolder {
  id: string;
  name: string;
  createdAt: string;
  itemCount: number;
  previewImages: string[];
  siteId: string | null;
}

interface FolderRow {
  id: string;
  name: string;
  created_at: string;
  item_count: string;
  preview_images: string[] | null;
  site_id: string | null;
}

// GET /api/admin/content/media/folders - List all folders with counts and previews
export async function GET(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "media" });
    if (!authorized) return response;

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    const accessibleSites = ctx!.userSites;
    const isSuperAdmin = ctx!.user.role === "super_admin";

    let folders: FolderRow[];
    if (siteId) {
      if (!isSuperAdmin && !accessibleSites.includes(siteId)) {
        return NextResponse.json({ error: "Geen toegang tot deze site" }, { status: 403 });
      }
      folders = (await sql`
        SELECT
          f.id,
          f.name,
          f.created_at,
          f.site_id,
          COUNT(im.url)::text as item_count,
          ARRAY(
            SELECT im2.url
            FROM image_metadata im2
            WHERE im2.folder_id = f.id
            ORDER BY im2.updated_at DESC NULLS LAST
            LIMIT 4
          ) as preview_images
        FROM media_folders f
        LEFT JOIN image_metadata im ON im.folder_id = f.id
        WHERE f.site_id = ${siteId}
        GROUP BY f.id
        ORDER BY f.name ASC
      `) as FolderRow[];
    } else if (isSuperAdmin) {
      folders = (await sql`
        SELECT
          f.id,
          f.name,
          f.created_at,
          f.site_id,
          COUNT(im.url)::text as item_count,
          ARRAY(
            SELECT im2.url
            FROM image_metadata im2
            WHERE im2.folder_id = f.id
            ORDER BY im2.updated_at DESC NULLS LAST
            LIMIT 4
          ) as preview_images
        FROM media_folders f
        LEFT JOIN image_metadata im ON im.folder_id = f.id
        GROUP BY f.id
        ORDER BY f.name ASC
      `) as FolderRow[];
    } else {
      folders = (await sql`
        SELECT
          f.id,
          f.name,
          f.created_at,
          f.site_id,
          COUNT(im.url)::text as item_count,
          ARRAY(
            SELECT im2.url
            FROM image_metadata im2
            WHERE im2.folder_id = f.id
            ORDER BY im2.updated_at DESC NULLS LAST
            LIMIT 4
          ) as preview_images
        FROM media_folders f
        LEFT JOIN image_metadata im ON im.folder_id = f.id
        WHERE f.site_id = ANY(${accessibleSites})
        GROUP BY f.id
        ORDER BY f.name ASC
      `) as FolderRow[];
    }

    const result: MediaFolder[] = folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      createdAt: folder.created_at,
      itemCount: parseInt(folder.item_count, 10),
      previewImages: folder.preview_images || [],
      siteId: folder.site_id,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list folders:", error);
    return NextResponse.json(
      { error: "Failed to list folders" },
      { status: 500 }
    );
  }
}

// POST /api/admin/content/media/folders - Create a new folder
export async function POST(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "media" });
    if (!authorized) return response;

    const { name, siteId } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    if (!siteId) {
      return NextResponse.json(
        { error: "Site is required" },
        { status: 400 }
      );
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(siteId)) {
      return NextResponse.json({ error: "Geen toegang tot deze site" }, { status: 403 });
    }

    const trimmedName = name.trim();

    // Check for duplicate name within the same site
    const existing = await sql`
      SELECT id FROM media_folders WHERE LOWER(name) = LOWER(${trimmedName}) AND site_id = ${siteId}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Een map met deze naam bestaat al" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO media_folders (name, site_id)
      VALUES (${trimmedName}, ${siteId})
      RETURNING id, name, created_at, site_id
    `;

    const folder = result[0];

    return NextResponse.json({
      id: folder.id,
      name: folder.name,
      createdAt: folder.created_at,
      itemCount: 0,
      previewImages: [],
      siteId: folder.site_id,
    });
  } catch (error) {
    console.error("Failed to create folder:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}
