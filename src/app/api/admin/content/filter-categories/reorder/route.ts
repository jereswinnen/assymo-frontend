import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/content";

export async function PUT(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "filters" });
    if (!authorized) return response;

    const { orderedIds, siteId } = await request.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds must be an array" },
        { status: 400 }
      );
    }

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this site
    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(siteId)) {
      return NextResponse.json({ error: "Geen toegang tot deze site" }, { status: 403 });
    }

    // Verify all categories belong to the specified site
    const categoryCheck = await sql`
      SELECT id FROM filter_categories WHERE id = ANY(${orderedIds}) AND site_id != ${siteId}
    `;
    if (categoryCheck.length > 0) {
      return NextResponse.json(
        { error: "Some filter categories do not belong to the specified site" },
        { status: 400 }
      );
    }

    // Update order_rank for each category
    for (let i = 0; i < orderedIds.length; i++) {
      await sql`
        UPDATE filter_categories
        SET order_rank = ${i}
        WHERE id = ${orderedIds[i]} AND site_id = ${siteId}
      `;
    }

    // Invalidate filters cache
    revalidateTag(CACHE_TAGS.filters, "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder filter categories:", error);
    return NextResponse.json(
      { error: "Failed to reorder filter categories" },
      { status: 500 }
    );
  }
}
