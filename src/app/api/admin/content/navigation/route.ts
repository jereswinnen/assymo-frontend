import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { updateTag } from "next/cache";
import { isAuthenticated } from "@/lib/auth-utils";
import { CACHE_TAGS } from "@/lib/content";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location") || "header";

    const rows = await sql`
      SELECT nl.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ns.id,
              'solution_id', ns.solution_id,
              'order_rank', ns.order_rank,
              'solution', CASE
                WHEN s.id IS NOT NULL THEN json_build_object(
                  'id', s.id,
                  'name', s.name,
                  'slug', s.slug
                )
                ELSE NULL
              END
            ) ORDER BY ns.order_rank
          ) FILTER (WHERE ns.id IS NOT NULL),
          '[]'
        ) as sub_items
      FROM navigation_links nl
      LEFT JOIN navigation_subitems ns ON nl.id = ns.link_id
      LEFT JOIN solutions s ON ns.solution_id = s.id
      WHERE nl.location = ${location}
      GROUP BY nl.id
      ORDER BY nl.order_rank
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch navigation:", error);
    return NextResponse.json(
      { error: "Failed to fetch navigation" },
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

    const { location, title, slug, submenu_heading } = await request.json();

    if (!location || !title || !slug) {
      return NextResponse.json(
        { error: "Location, title, and slug are required" },
        { status: 400 }
      );
    }

    // Get max order_rank for this location
    const maxRank = await sql`
      SELECT COALESCE(MAX(order_rank), -1) + 1 as next_rank
      FROM navigation_links
      WHERE location = ${location}
    `;

    const rows = await sql`
      INSERT INTO navigation_links (location, title, slug, submenu_heading, order_rank)
      VALUES (${location}, ${title}, ${slug}, ${submenu_heading || null}, ${maxRank[0].next_rank})
      RETURNING *
    `;

    // Invalidate navigation cache
    updateTag(CACHE_TAGS.navigation);

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to create navigation link:", error);
    return NextResponse.json(
      { error: "Failed to create navigation link" },
      { status: 500 }
    );
  }
}
