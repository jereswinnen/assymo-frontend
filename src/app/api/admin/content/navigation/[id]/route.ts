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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "navigation" });
    if (!authorized) return response;

    const { id } = await params;
    const { title, slug, submenu_heading } = await request.json();

    // Fetch existing link to check site access
    const existing = await sql`SELECT site_id FROM navigation_links WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Navigation link not found" }, { status: 404 });
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(existing[0].site_id)) {
      return NextResponse.json({ error: "Geen toegang tot dit navigatie-item" }, { status: 403 });
    }

    const rows = await sql`
      UPDATE navigation_links
      SET title = ${title}, slug = ${slug}, submenu_heading = ${submenu_heading || null}
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Navigation link not found" },
        { status: 404 }
      );
    }

    // Invalidate navigation cache
    revalidateTag(CACHE_TAGS.navigation, "max");
    await revalidateExternalSite(existing[0].site_id, CACHE_TAGS.navigation);

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to update navigation link:", error);
    return NextResponse.json(
      { error: "Failed to update navigation link" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "navigation" });
    if (!authorized) return response;

    const { id } = await params;

    // Fetch existing link to check site access
    const existing = await sql`SELECT site_id FROM navigation_links WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Navigation link not found" }, { status: 404 });
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(existing[0].site_id)) {
      return NextResponse.json({ error: "Geen toegang tot dit navigatie-item" }, { status: 403 });
    }

    await sql`DELETE FROM navigation_links WHERE id = ${id}`;

    // Invalidate navigation cache
    revalidateTag(CACHE_TAGS.navigation, "max");
    await revalidateExternalSite(existing[0].site_id, CACHE_TAGS.navigation);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete navigation link:", error);
    return NextResponse.json(
      { error: "Failed to delete navigation link" },
      { status: 500 }
    );
  }
}
