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
      SELECT fc.*,
        COALESCE(
          json_agg(
            json_build_object('id', f.id, 'name', f.name, 'slug', f.slug)
            ORDER BY f.name
          ) FILTER (WHERE f.id IS NOT NULL),
          '[]'
        ) as filters
      FROM filter_categories fc
      LEFT JOIN filters f ON fc.id = f.category_id
      WHERE fc.id = ${id}
      GROUP BY fc.id
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Filter category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to fetch filter category:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter category" },
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
    const { name, slug, order_rank } = await request.json();

    const rows = await sql`
      UPDATE filter_categories
      SET name = ${name}, slug = ${slug}, order_rank = ${order_rank}
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Filter category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to update filter category:", error);
    return NextResponse.json(
      { error: "Failed to update filter category" },
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

    await sql`DELETE FROM filter_categories WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete filter category:", error);
    return NextResponse.json(
      { error: "Failed to delete filter category" },
      { status: 500 }
    );
  }
}
