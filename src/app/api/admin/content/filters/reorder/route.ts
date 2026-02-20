import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/content";

export async function PUT(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "filters" });
    if (!authorized) return response;

    const { categoryId, orderedIds } = await request.json();

    if (!categoryId || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "categoryId and orderedIds are required" },
        { status: 400 }
      );
    }

    // Fetch the category to check site access
    const category = await sql`SELECT site_id FROM filter_categories WHERE id = ${categoryId}`;
    if (category.length === 0) {
      return NextResponse.json({ error: "Filter category not found" }, { status: 404 });
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(category[0].site_id)) {
      return NextResponse.json({ error: "Geen toegang tot deze filtercategorie" }, { status: 403 });
    }

    // Update order_rank for each filter
    for (let i = 0; i < orderedIds.length; i++) {
      await sql`
        UPDATE filters
        SET order_rank = ${i}
        WHERE id = ${orderedIds[i]} AND category_id = ${categoryId}
      `;
    }

    // Invalidate filters cache
    revalidateTag(CACHE_TAGS.filters, "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder filters:", error);
    return NextResponse.json(
      { error: "Failed to reorder filters" },
      { status: 500 }
    );
  }
}
