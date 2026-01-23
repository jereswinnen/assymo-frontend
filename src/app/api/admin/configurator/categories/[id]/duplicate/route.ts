import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CATEGORIES_CACHE_TAG } from "@/lib/configurator/categories";

const sql = neon(process.env.DATABASE_URL!);

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({
      feature: "configurator",
    });
    if (!authorized) return response;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(siteId)) {
      return NextResponse.json(
        { error: "Geen toegang tot deze site" },
        { status: 403 }
      );
    }

    // Fetch the original category
    const rows = await sql`
      SELECT *
      FROM configurator_categories
      WHERE id = ${id}
        AND site_id = ${siteId}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const original = rows[0];

    // Generate unique slug
    const baseSlug = `${original.slug}-kopie`;
    let newSlug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await sql`
        SELECT id FROM configurator_categories
        WHERE slug = ${newSlug} AND site_id = ${siteId}
      `;
      if (existing.length === 0) break;
      counter++;
      newSlug = `${baseSlug}-${counter}`;
    }

    // Get the highest order_rank
    const maxRank = await sql`
      SELECT COALESCE(MAX(order_rank), 0) as max_rank
      FROM configurator_categories
      WHERE site_id = ${siteId}
    `;
    const newOrderRank = (maxRank[0].max_rank as number) + 1;

    // Create duplicate
    const duplicated = await sql`
      INSERT INTO configurator_categories (name, slug, order_rank, site_id)
      VALUES (
        ${original.name + " (kopie)"},
        ${newSlug},
        ${newOrderRank},
        ${siteId}
      )
      RETURNING *
    `;

    // Invalidate cache
    revalidateTag(CATEGORIES_CACHE_TAG, "max");

    return NextResponse.json(duplicated[0]);
  } catch (error) {
    console.error("Failed to duplicate category:", error);
    return NextResponse.json(
      { error: "Failed to duplicate category" },
      { status: 500 }
    );
  }
}
