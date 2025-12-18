import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAuthenticated } from "@/lib/auth-utils";

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
    const { title, slug, header_image, sections } = await request.json();

    if (!title || !slug) {
      return NextResponse.json(
        { error: "Title and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists for another page
    const existing = await sql`
      SELECT id FROM pages WHERE slug = ${slug} AND id != ${id}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A page with this slug already exists" },
        { status: 409 }
      );
    }

    const rows = await sql`
      UPDATE pages
      SET
        title = ${title},
        slug = ${slug},
        header_image = ${header_image ? JSON.stringify(header_image) : null}::jsonb,
        sections = ${JSON.stringify(sections || [])}::jsonb,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete page:", error);
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 }
    );
  }
}
