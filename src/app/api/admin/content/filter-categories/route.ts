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
      SELECT fc.*,
        COALESCE(
          json_agg(
            json_build_object('id', f.id, 'name', f.name, 'slug', f.slug)
            ORDER BY f.order_rank
          ) FILTER (WHERE f.id IS NOT NULL),
          '[]'
        ) as filters
      FROM filter_categories fc
      LEFT JOIN filters f ON fc.id = f.category_id
      GROUP BY fc.id
      ORDER BY fc.order_rank
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch filter categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter categories" },
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

    const { name, slug } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Get max order_rank
    const maxRank = await sql`
      SELECT COALESCE(MAX(order_rank), -1) + 1 as next_rank FROM filter_categories
    `;

    const rows = await sql`
      INSERT INTO filter_categories (name, slug, order_rank)
      VALUES (${name}, ${slug}, ${maxRank[0].next_rank})
      RETURNING *
    `;

    // Invalidate filters cache
    revalidateTag(CACHE_TAGS.filters, "max");

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to create filter category:", error);
    return NextResponse.json(
      { error: "Failed to create filter category" },
      { status: 500 }
    );
  }
}
