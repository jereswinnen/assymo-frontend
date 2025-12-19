import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAuthenticated } from "@/lib/auth-utils";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the original page
    const rows = await sql`
      SELECT * FROM pages WHERE id = ${id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const original = rows[0];

    // Generate unique slug
    const baseSlug = original.slug ? `${original.slug}-kopie` : "kopie";
    let newSlug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await sql`
        SELECT id FROM pages WHERE slug = ${newSlug}
      `;
      if (existing.length === 0) break;
      counter++;
      newSlug = `${baseSlug}-${counter}`;
    }

    // Create duplicate
    const duplicated = await sql`
      INSERT INTO pages (title, slug, is_homepage, header_image, sections)
      VALUES (
        ${original.title + " (kopie)"},
        ${newSlug},
        false,
        ${original.header_image ? JSON.stringify(original.header_image) : null}::jsonb,
        ${JSON.stringify(original.sections || [])}::jsonb
      )
      RETURNING *
    `;

    return NextResponse.json(duplicated[0]);
  } catch (error) {
    console.error("Failed to duplicate page:", error);
    return NextResponse.json(
      { error: "Failed to duplicate page" },
      { status: 500 }
    );
  }
}
