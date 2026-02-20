import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/content";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "filters" });
    if (!authorized) return response;

    const { id } = await params;
    const { name, slug } = await request.json();

    // Fetch the filter with its category to check site access
    const existing = await sql`
      SELECT f.*, fc.site_id
      FROM filters f
      JOIN filter_categories fc ON f.category_id = fc.id
      WHERE f.id = ${id}
    `;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Filter not found" }, { status: 404 });
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(existing[0].site_id)) {
      return NextResponse.json({ error: "Geen toegang tot dit filter" }, { status: 403 });
    }

    const rows = await sql`
      UPDATE filters
      SET name = ${name}, slug = ${slug}
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Filter not found" },
        { status: 404 }
      );
    }

    // Invalidate filters cache
    revalidateTag(CACHE_TAGS.filters, "max");

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to update filter:", error);
    return NextResponse.json(
      { error: "Failed to update filter" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "filters" });
    if (!authorized) return response;

    const { id } = await params;

    // Fetch the filter with its category to check site access
    const existing = await sql`
      SELECT f.*, fc.site_id
      FROM filters f
      JOIN filter_categories fc ON f.category_id = fc.id
      WHERE f.id = ${id}
    `;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Filter not found" }, { status: 404 });
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(existing[0].site_id)) {
      return NextResponse.json({ error: "Geen toegang tot dit filter" }, { status: 403 });
    }

    await sql`DELETE FROM filters WHERE id = ${id}`;

    // Invalidate filters cache
    revalidateTag(CACHE_TAGS.filters, "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete filter:", error);
    return NextResponse.json(
      { error: "Failed to delete filter" },
      { status: 500 }
    );
  }
}
