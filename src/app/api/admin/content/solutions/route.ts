import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/content";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "solutions" });
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
        SELECT id, name, subtitle, slug, header_image, order_rank, site_id, updated_at
        FROM solutions
        WHERE site_id = ${siteId}
        ORDER BY order_rank, name
      `;
    } else if (isSuperAdmin) {
      rows = await sql`
        SELECT id, name, subtitle, slug, header_image, order_rank, site_id, updated_at
        FROM solutions
        ORDER BY order_rank, name
      `;
    } else {
      rows = await sql`
        SELECT id, name, subtitle, slug, header_image, order_rank, site_id, updated_at
        FROM solutions
        WHERE site_id = ANY(${accessibleSites})
        ORDER BY order_rank, name
      `;
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch solutions:", error);
    return NextResponse.json(
      { error: "Failed to fetch solutions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "solutions" });
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

    // Check if slug already exists within the same site
    const existing = await sql`
      SELECT id FROM solutions WHERE slug = ${slug} AND site_id = ${siteId}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A solution with this slug already exists" },
        { status: 409 }
      );
    }

    // Get max order_rank for this site
    const maxRank = await sql`
      SELECT COALESCE(MAX(order_rank), -1) + 1 as next_rank FROM solutions WHERE site_id = ${siteId}
    `;

    const rows = await sql`
      INSERT INTO solutions (name, slug, order_rank, site_id, sections)
      VALUES (${name}, ${slug}, ${maxRank[0].next_rank}, ${siteId}, '[]'::jsonb)
      RETURNING *
    `;

    revalidateTag(CACHE_TAGS.solutions, "max");

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to create solution:", error);
    return NextResponse.json(
      { error: "Failed to create solution" },
      { status: 500 }
    );
  }
}
