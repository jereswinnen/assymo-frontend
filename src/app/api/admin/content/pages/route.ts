import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/content";
import { revalidateExternalSite } from "@/lib/revalidate-external";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "pages" });
    if (!authorized) return response;

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    // Determine which sites to query
    // Super admins can see all sites, others only their assigned sites
    const accessibleSites = ctx!.userSites;
    const isSuperAdmin = ctx!.user.role === "super_admin";

    let rows;
    if (siteId) {
      // Specific site requested - verify access
      if (!isSuperAdmin && !accessibleSites.includes(siteId)) {
        return NextResponse.json({ error: "Geen toegang tot deze site" }, { status: 403 });
      }
      rows = await sql`
        SELECT id, title, slug, is_homepage, site_id, updated_at
        FROM pages
        WHERE site_id = ${siteId}
        ORDER BY is_homepage DESC, title
      `;
    } else if (isSuperAdmin) {
      // Super admin without site filter - show all
      rows = await sql`
        SELECT id, title, slug, is_homepage, site_id, updated_at
        FROM pages
        ORDER BY is_homepage DESC, title
      `;
    } else {
      // Regular user without site filter - show all accessible
      rows = await sql`
        SELECT id, title, slug, is_homepage, site_id, updated_at
        FROM pages
        WHERE site_id = ANY(${accessibleSites})
        ORDER BY is_homepage DESC, title
      `;
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch pages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "pages" });
    if (!authorized) return response;

    const { title, slug, is_homepage, siteId } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!siteId) {
      return NextResponse.json(
        { error: "Site is required" },
        { status: 400 }
      );
    }

    // Verify user has access to the target site
    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(siteId)) {
      return NextResponse.json({ error: "Geen toegang tot deze site" }, { status: 403 });
    }

    // Homepage doesn't need a slug
    if (!is_homepage && !slug) {
      return NextResponse.json(
        { error: "Slug is required for non-homepage pages" },
        { status: 400 }
      );
    }

    // Check if slug already exists within the same site (only if slug is provided)
    if (slug) {
      const existing = await sql`
        SELECT id FROM pages WHERE slug = ${slug} AND site_id = ${siteId}
      `;

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "A page with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // If setting as homepage, unset any existing homepage for this site
    if (is_homepage) {
      await sql`UPDATE pages SET is_homepage = false WHERE is_homepage = true AND site_id = ${siteId}`;
    }

    const rows = await sql`
      INSERT INTO pages (title, slug, is_homepage, site_id, sections)
      VALUES (${title}, ${slug || null}, ${is_homepage || false}, ${siteId}, '[]'::jsonb)
      RETURNING *
    `;

    // Invalidate pages cache
    revalidateTag(CACHE_TAGS.pages, "max");
    await revalidateExternalSite(siteId, CACHE_TAGS.pages);

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to create page:", error);
    return NextResponse.json(
      { error: "Failed to create page" },
      { status: 500 }
    );
  }
}
