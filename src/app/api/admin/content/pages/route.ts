import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { revalidateTag } from "next/cache";
import { isAuthenticated } from "@/lib/auth-utils";
import { CACHE_TAGS } from "@/lib/content";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql`
      SELECT id, title, slug, is_homepage, updated_at
      FROM pages
      ORDER BY is_homepage DESC, title
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, slug, is_homepage } = await request.json();

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

    // Check if slug already exists (only if slug is provided)
    if (slug) {
      const existing = await sql`
        SELECT id FROM pages WHERE slug = ${slug}
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
      await sql`UPDATE pages SET is_homepage = false WHERE is_homepage = true`;
    }

    const rows = await sql`
      INSERT INTO pages (title, slug, is_homepage, sections)
      VALUES (${title}, ${slug || null}, ${is_homepage || false}, '[]'::jsonb)
      RETURNING *
    `;

    // Invalidate pages cache
    revalidateTag(CACHE_TAGS.pages, "max");

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to create page:", error);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 }
    );
  }
}
