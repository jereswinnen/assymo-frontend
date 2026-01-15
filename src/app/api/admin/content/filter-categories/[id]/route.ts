import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/content";
import { revalidateExternalSite } from "@/lib/revalidate-external";

const sql = neon(process.env.DATABASE_URL!);

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "filters" });
    if (!authorized) return response;

    const { id } = await params;

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
      WHERE fc.id = ${id}
      GROUP BY fc.id
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Filter category not found" }, { status: 404 });
    }

    const category = rows[0];

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(category.site_id)) {
      return NextResponse.json({ error: "Geen toegang tot deze filtercategorie" }, { status: 403 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to fetch filter category:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter category" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "filters" });
    if (!authorized) return response;

    const { id } = await params;
    const { name, slug, order_rank } = await request.json();

    // Fetch existing category to check site access
    const existing = await sql`SELECT site_id FROM filter_categories WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Filter category not found" }, { status: 404 });
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(existing[0].site_id)) {
      return NextResponse.json({ error: "Geen toegang tot deze filtercategorie" }, { status: 403 });
    }

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

    // Invalidate filters cache
    revalidateTag(CACHE_TAGS.filters, "max");
    await revalidateExternalSite(existing[0].site_id, CACHE_TAGS.filters);

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to update filter category:", error);
    return NextResponse.json(
      { error: "Failed to update filter category" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "filters" });
    if (!authorized) return response;

    const { id } = await params;

    // Fetch existing category to check site access
    const existing = await sql`SELECT site_id FROM filter_categories WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Filter category not found" }, { status: 404 });
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(existing[0].site_id)) {
      return NextResponse.json({ error: "Geen toegang tot deze filtercategorie" }, { status: 403 });
    }

    await sql`DELETE FROM filter_categories WHERE id = ${id}`;

    // Invalidate filters cache
    revalidateTag(CACHE_TAGS.filters, "max");
    await revalidateExternalSite(existing[0].site_id, CACHE_TAGS.filters);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete filter category:", error);
    return NextResponse.json(
      { error: "Failed to delete filter category" },
      { status: 500 }
    );
  }
}
