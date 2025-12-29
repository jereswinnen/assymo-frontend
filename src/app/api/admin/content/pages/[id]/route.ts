import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { updateTag } from "next/cache";
import { isAuthenticated } from "@/lib/auth-utils";
import { CACHE_TAGS } from "@/lib/content";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const rows = await sql`
      SELECT * FROM pages WHERE id = ${id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to fetch page:", error);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, slug, is_homepage, header_image, sections } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Homepage doesn't need a slug
    if (!is_homepage && !slug) {
      return NextResponse.json(
        { error: "Slug is required for non-homepage pages" },
        { status: 400 }
      );
    }

    // Check if slug already exists for another page (only if slug is provided)
    if (slug) {
      const existing = await sql`
        SELECT id FROM pages WHERE slug = ${slug} AND id != ${id}
      `;

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "A page with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // If setting as homepage, unset any existing homepage
    if (is_homepage) {
      await sql`UPDATE pages SET is_homepage = false WHERE is_homepage = true AND id != ${id}`;
    }

    const rows = await sql`
      UPDATE pages
      SET
        title = ${title},
        slug = ${slug || null},
        is_homepage = ${is_homepage || false},
        header_image = ${header_image ? JSON.stringify(header_image) : null}::jsonb,
        sections = ${JSON.stringify(sections || [])}::jsonb,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Invalidate pages cache
    updateTag(CACHE_TAGS.pages);

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to update page:", error);
    return NextResponse.json(
      { error: "Failed to update page" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await sql`DELETE FROM pages WHERE id = ${id}`;

    // Invalidate pages cache
    updateTag(CACHE_TAGS.pages);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete page:", error);
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 }
    );
  }
}
