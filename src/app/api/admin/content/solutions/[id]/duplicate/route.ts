import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/content";

const sql = neon(process.env.DATABASE_URL!);

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "solutions" });
    if (!authorized) return response;

    const { id } = await params;

    // Fetch the original solution with its filters
    const rows = await sql`
      SELECT s.*,
        COALESCE(
          array_agg(sf.filter_id) FILTER (WHERE sf.filter_id IS NOT NULL),
          '{}'
        ) as filter_ids
      FROM solutions s
      LEFT JOIN solution_filters sf ON s.id = sf.solution_id
      WHERE s.id = ${id}
      GROUP BY s.id
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    const original = rows[0];

    // Verify user has access to this solution's site
    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(original.site_id)) {
      return NextResponse.json({ error: "Geen toegang tot deze realisatie" }, { status: 403 });
    }

    // Generate unique slug within the same site
    const baseSlug = `${original.slug}-kopie`;
    let newSlug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await sql`
        SELECT id FROM solutions WHERE slug = ${newSlug} AND site_id = ${original.site_id}
      `;
      if (existing.length === 0) break;
      counter++;
      newSlug = `${baseSlug}-${counter}`;
    }

    // Get the highest order_rank for this site
    const maxRank = await sql`
      SELECT COALESCE(MAX(order_rank), 0) as max_rank FROM solutions WHERE site_id = ${original.site_id}
    `;
    const newOrderRank = (maxRank[0].max_rank as number) + 1;

    // Create duplicate with same site_id
    const duplicated = await sql`
      INSERT INTO solutions (name, subtitle, slug, header_image, sections, order_rank, site_id)
      VALUES (
        ${original.name + " (kopie)"},
        ${original.subtitle},
        ${newSlug},
        ${original.header_image ? JSON.stringify(original.header_image) : null}::jsonb,
        ${JSON.stringify(original.sections || [])}::jsonb,
        ${newOrderRank},
        ${original.site_id}
      )
      RETURNING *
    `;

    const newSolution = duplicated[0];

    // Copy filter associations
    const filterIds = original.filter_ids as string[];
    if (filterIds && filterIds.length > 0) {
      for (const filterId of filterIds) {
        await sql`
          INSERT INTO solution_filters (solution_id, filter_id)
          VALUES (${newSolution.id}, ${filterId})
          ON CONFLICT DO NOTHING
        `;
      }
    }

    // Invalidate solutions cache
    revalidateTag(CACHE_TAGS.solutions, "max");

    return NextResponse.json(newSolution);
  } catch (error) {
    console.error("Failed to duplicate solution:", error);
    return NextResponse.json(
      { error: "Failed to duplicate solution" },
      { status: 500 }
    );
  }
}
