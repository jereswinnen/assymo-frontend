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

    // Get solution with its filters
    const rows = await sql`
      SELECT s.*,
        COALESCE(
          json_agg(
            json_build_object('id', f.id, 'name', f.name, 'slug', f.slug, 'category_id', f.category_id)
          ) FILTER (WHERE f.id IS NOT NULL),
          '[]'
        ) as filters
      FROM solutions s
      LEFT JOIN solution_filters sf ON s.id = sf.solution_id
      LEFT JOIN filters f ON sf.filter_id = f.id
      WHERE s.id = ${id}
      GROUP BY s.id
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to fetch solution:", error);
    return NextResponse.json(
      { error: "Failed to fetch solution" },
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
    const { name, subtitle, slug, header_image, sections, filter_ids } =
      await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists for another solution
    const existing = await sql`
      SELECT id FROM solutions WHERE slug = ${slug} AND id != ${id}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A solution with this slug already exists" },
        { status: 409 }
      );
    }

    // Update solution
    const rows = await sql`
      UPDATE solutions
      SET
        name = ${name},
        subtitle = ${subtitle || null},
        slug = ${slug},
        header_image = ${header_image ? JSON.stringify(header_image) : null}::jsonb,
        sections = ${JSON.stringify(sections || [])}::jsonb,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    // Update filters if provided
    if (Array.isArray(filter_ids)) {
      // Remove existing filter associations
      await sql`DELETE FROM solution_filters WHERE solution_id = ${id}`;

      // Add new filter associations
      for (const filterId of filter_ids) {
        await sql`
          INSERT INTO solution_filters (solution_id, filter_id)
          VALUES (${id}, ${filterId})
          ON CONFLICT DO NOTHING
        `;
      }
    }

    // Fetch updated solution with filters
    const updated = await sql`
      SELECT s.*,
        COALESCE(
          json_agg(
            json_build_object('id', f.id, 'name', f.name, 'slug', f.slug, 'category_id', f.category_id)
          ) FILTER (WHERE f.id IS NOT NULL),
          '[]'
        ) as filters
      FROM solutions s
      LEFT JOIN solution_filters sf ON s.id = sf.solution_id
      LEFT JOIN filters f ON sf.filter_id = f.id
      WHERE s.id = ${id}
      GROUP BY s.id
    `;

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Failed to update solution:", error);
    return NextResponse.json(
      { error: "Failed to update solution" },
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

    // solution_filters will be deleted automatically due to CASCADE
    await sql`DELETE FROM solutions WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete solution:", error);
    return NextResponse.json(
      { error: "Failed to delete solution" },
      { status: 500 }
    );
  }
}
