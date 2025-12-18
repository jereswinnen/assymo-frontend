import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAuthenticated } from "@/lib/auth-utils";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql`
      SELECT id, title, slug, updated_at
      FROM pages
      ORDER BY title
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

    const { title, slug } = await request.json();

    if (!title || !slug) {
      return NextResponse.json(
        { error: "Title and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await sql`
      SELECT id FROM pages WHERE slug = ${slug}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A page with this slug already exists" },
        { status: 409 }
      );
    }

    const rows = await sql`
      INSERT INTO pages (title, slug, sections)
      VALUES (${title}, ${slug}, '[]'::jsonb)
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to create page:", error);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 }
    );
  }
}
