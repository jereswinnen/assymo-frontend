import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/content";

export async function GET(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "navigation" });
    if (!authorized) return response;

    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location") || "header";
    const siteId = searchParams.get("siteId");

    const accessibleSites = ctx!.userSites;
    const isSuperAdmin = ctx!.user.role === "super_admin";

    let rows;
    if (siteId) {
      if (!isSuperAdmin && !accessibleSites.includes(siteId)) {
        return NextResponse.json({ error: "Geen toegang tot deze site" }, { status: 403 });
      }
      rows = await sql`
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
        WHERE nl.location = ${location} AND nl.site_id = ${siteId}
        GROUP BY nl.id
        ORDER BY nl.order_rank
      `;
    } else if (isSuperAdmin) {
      rows = await sql`
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
    } else {
      rows = await sql`
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
        WHERE nl.location = ${location} AND nl.site_id = ANY(${accessibleSites})
        GROUP BY nl.id
        ORDER BY nl.order_rank
      `;
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch navigation:", error);
    return NextResponse.json(
      { error: "Failed to fetch navigation" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "navigation" });
    if (!authorized) return response;

    const { location, title, slug, submenu_heading, siteId } = await request.json();

    if (!location || !title || !slug) {
      return NextResponse.json(
        { error: "Location, title, and slug are required" },
        { status: 400 }
      );
    }

    if (!siteId) {
      return NextResponse.json(
        { error: "Site is required" },
        { status: 400 }
      );
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(siteId)) {
      return NextResponse.json({ error: "Geen toegang tot deze site" }, { status: 403 });
    }

    // Get max order_rank for this location and site
    const maxRank = await sql`
      SELECT COALESCE(MAX(order_rank), -1) + 1 as next_rank
      FROM navigation_links
      WHERE location = ${location} AND site_id = ${siteId}
    `;

    const rows = await sql`
      INSERT INTO navigation_links (location, title, slug, submenu_heading, order_rank, site_id)
      VALUES (${location}, ${title}, ${slug}, ${submenu_heading || null}, ${maxRank[0].next_rank}, ${siteId})
      RETURNING *
    `;

    // Invalidate navigation cache
    revalidateTag(CACHE_TAGS.navigation, "max");

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to create navigation link:", error);
    return NextResponse.json(
      { error: "Failed to create navigation link" },
      { status: 500 }
    );
  }
}
