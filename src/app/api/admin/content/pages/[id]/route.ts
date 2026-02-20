import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/content";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "pages" });
    if (!authorized) return response;

    const { id } = await params;

    const rows = await sql`
      SELECT * FROM pages WHERE id = ${id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const page = rows[0];

    // Verify user has access to this page's site
    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(page.site_id)) {
      return NextResponse.json({ error: "Geen toegang tot deze pagina" }, { status: 403 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error("Failed to fetch page:", error);
    return NextResponse.json(
      { error: "Failed to fetch page" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "pages" });
    if (!authorized) return response;

    const { id } = await params;
    const { title, slug, is_homepage, header_image, sections, meta_title, meta_description } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Homepage doesn't need a slug
    if (!is_homepage && !slug) {
      return NextResponse.json(
        { error: "Slug is required for non-homepage pages" },
        { status: 400 }
      );
    }

    // Combined query: check existence, get site_id, and check slug uniqueness in one round-trip
    const validation = await sql`
      SELECT
        p.site_id,
        CASE
          WHEN ${slug}::text IS NULL THEN false
          ELSE EXISTS(
            SELECT 1 FROM pages
            WHERE slug = ${slug} AND id != ${id} AND site_id = p.site_id
          )
        END as slug_exists
      FROM pages p
      WHERE p.id = ${id}
    `;

    if (validation.length === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const { site_id: siteId, slug_exists: slugExists } = validation[0];

    // Verify user has access to this page's site
    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(siteId)) {
      return NextResponse.json({ error: "Geen toegang tot deze pagina" }, { status: 403 });
    }

    if (slugExists) {
      return NextResponse.json(
        { error: "A page with this slug already exists" },
        { status: 409 }
      );
    }

    // If setting as homepage, unset any existing homepage for this site
    if (is_homepage) {
      await sql`UPDATE pages SET is_homepage = false WHERE is_homepage = true AND id != ${id} AND site_id = ${siteId}`;
    }

    const rows = await sql`
      UPDATE pages
      SET
        title = ${title},
        slug = ${slug || null},
        is_homepage = ${is_homepage || false},
        header_image = ${header_image ? JSON.stringify(header_image) : null}::jsonb,
        sections = ${JSON.stringify(sections || [])}::jsonb,
        meta_title = ${meta_title || null},
        meta_description = ${meta_description || null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Invalidate pages cache
    revalidateTag(CACHE_TAGS.pages, "max");

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to update page:", error);
    return NextResponse.json(
      { error: "Failed to update page" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "pages" });
    if (!authorized) return response;

    const { id } = await params;

    // Fetch existing page to check site access
    const existing = await sql`SELECT site_id FROM pages WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Verify user has access to this page's site
    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(existing[0].site_id)) {
      return NextResponse.json({ error: "Geen toegang tot deze pagina" }, { status: 403 });
    }

    await sql`DELETE FROM pages WHERE id = ${id}`;

    // Invalidate pages cache
    revalidateTag(CACHE_TAGS.pages, "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete page:", error);
    return NextResponse.json(
      { error: "Failed to delete page" },
      { status: 500 }
    );
  }
}
