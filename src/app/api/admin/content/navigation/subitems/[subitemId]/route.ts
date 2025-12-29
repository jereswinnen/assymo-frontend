import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/content";

const sql = neon(process.env.DATABASE_URL!);

interface RouteParams {
  params: Promise<{ subitemId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "navigation" });
    if (!authorized) return response;

    const { subitemId } = await params;

    // Fetch the subitem and its parent link to check site access
    const existing = await sql`
      SELECT nl.site_id
      FROM navigation_subitems ns
      JOIN navigation_links nl ON ns.link_id = nl.id
      WHERE ns.id = ${subitemId}
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: "Navigation subitem not found" }, { status: 404 });
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(existing[0].site_id)) {
      return NextResponse.json({ error: "Geen toegang tot dit navigatie-item" }, { status: 403 });
    }

    await sql`DELETE FROM navigation_subitems WHERE id = ${subitemId}`;

    // Invalidate navigation cache
    revalidateTag(CACHE_TAGS.navigation, "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete navigation subitem:", error);
    return NextResponse.json(
      { error: "Failed to delete navigation subitem" },
      { status: 500 }
    );
  }
}
