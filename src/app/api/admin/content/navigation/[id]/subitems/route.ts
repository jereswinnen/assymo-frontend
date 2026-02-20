import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/content";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "navigation" });
    if (!authorized) return response;

    const { id: linkId } = await params;
    const { solution_id } = await request.json();

    if (!solution_id) {
      return NextResponse.json(
        { error: "solution_id is required" },
        { status: 400 }
      );
    }

    // Fetch existing link to check site access
    const existing = await sql`SELECT site_id FROM navigation_links WHERE id = ${linkId}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Navigation link not found" }, { status: 404 });
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(existing[0].site_id)) {
      return NextResponse.json({ error: "Geen toegang tot dit navigatie-item" }, { status: 403 });
    }

    // Get max order_rank for this link
    const maxRank = await sql`
      SELECT COALESCE(MAX(order_rank), -1) + 1 as next_rank
      FROM navigation_subitems
      WHERE link_id = ${linkId}
    `;

    const rows = await sql`
      INSERT INTO navigation_subitems (link_id, solution_id, order_rank)
      VALUES (${linkId}, ${solution_id}, ${maxRank[0].next_rank})
      RETURNING *
    `;

    // Invalidate navigation cache
    revalidateTag(CACHE_TAGS.navigation, "max");

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to create navigation subitem:", error);
    return NextResponse.json(
      { error: "Failed to create navigation subitem" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "navigation" });
    if (!authorized) return response;

    const { id: linkId } = await params;
    const { orderedIds } = await request.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds must be an array" },
        { status: 400 }
      );
    }

    // Fetch existing link to check site access
    const existing = await sql`SELECT site_id FROM navigation_links WHERE id = ${linkId}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Navigation link not found" }, { status: 404 });
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(existing[0].site_id)) {
      return NextResponse.json({ error: "Geen toegang tot dit navigatie-item" }, { status: 403 });
    }

    // Update order_rank for each subitem
    for (let i = 0; i < orderedIds.length; i++) {
      await sql`
        UPDATE navigation_subitems
        SET order_rank = ${i}
        WHERE id = ${orderedIds[i]} AND link_id = ${linkId}
      `;
    }

    // Invalidate navigation cache
    revalidateTag(CACHE_TAGS.navigation, "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder navigation subitems:", error);
    return NextResponse.json(
      { error: "Failed to reorder navigation subitems" },
      { status: 500 }
    );
  }
}
