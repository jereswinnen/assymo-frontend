import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAuthenticated } from "@/lib/auth-utils";

const sql = neon(process.env.DATABASE_URL!);

export interface MediaFolder {
  id: string;
  name: string;
  createdAt: string;
  itemCount: number;
  previewImages: string[];
}

interface FolderRow {
  id: string;
  name: string;
  created_at: string;
  item_count: string;
  preview_images: string[] | null;
}

// GET /api/admin/content/media/folders - List all folders with counts and previews
export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folders = (await sql`
      SELECT
        f.id,
        f.name,
        f.created_at,
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

    const result: MediaFolder[] = folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      createdAt: folder.created_at,
      itemCount: parseInt(folder.item_count, 10),
      previewImages: folder.preview_images || [],
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
export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check for duplicate name
    const existing = await sql`
      SELECT id FROM media_folders WHERE LOWER(name) = LOWER(${trimmedName})
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Een map met deze naam bestaat al" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO media_folders (name)
      VALUES (${trimmedName})
      RETURNING id, name, created_at
    `;

    const folder = result[0];

    return NextResponse.json({
      id: folder.id,
      name: folder.name,
      createdAt: folder.created_at,
      itemCount: 0,
      previewImages: [],
    });
  } catch (error) {
    console.error("Failed to create folder:", error);
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    );
  }
}
