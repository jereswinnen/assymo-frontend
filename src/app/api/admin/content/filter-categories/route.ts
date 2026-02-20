import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/content";

export async function GET(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "filters" });
    if (!authorized) return response;

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    const accessibleSites = ctx!.userSites;
    const isSuperAdmin = ctx!.user.role === "super_admin";

    let rows;
    if (siteId) {
      if (!isSuperAdmin && !accessibleSites.includes(siteId)) {
        return NextResponse.json({ error: "Geen toegang tot deze site" }, { status: 403 });
      }
      rows = await sql`
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
        WHERE fc.site_id = ${siteId}
        GROUP BY fc.id
        ORDER BY fc.order_rank
      `;
    } else if (isSuperAdmin) {
      rows = await sql`
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
    } else {
      rows = await sql`
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
        WHERE fc.site_id = ANY(${accessibleSites})
        GROUP BY fc.id
        ORDER BY fc.order_rank
      `;
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch filter categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "filters" });
    if (!authorized) return response;

    const { name, slug, siteId } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
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

    // Get max order_rank for this site
    const maxRank = await sql`
      SELECT COALESCE(MAX(order_rank), -1) + 1 as next_rank FROM filter_categories WHERE site_id = ${siteId}
    `;

    const rows = await sql`
      INSERT INTO filter_categories (name, slug, order_rank, site_id)
      VALUES (${name}, ${slug}, ${maxRank[0].next_rank}, ${siteId})
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
