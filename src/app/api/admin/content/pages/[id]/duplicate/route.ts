import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/content";

const sql = neon(process.env.DATABASE_URL!);

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "pages" });
    if (!authorized) return response;

    const { id } = await params;

    // Fetch the original page
    const rows = await sql`
      SELECT * FROM pages WHERE id = ${id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const original = rows[0];

    // Verify user has access to this page's site
    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(original.site_id)) {
      return NextResponse.json({ error: "Geen toegang tot deze pagina" }, { status: 403 });
    }

    // Generate unique slug within the same site - single query for efficiency
    const baseSlug = original.slug ? `${original.slug}-kopie` : "kopie";

    // Find all existing slugs matching the pattern in one query
    const existingSlugs = await sql`
      SELECT slug FROM pages
      WHERE site_id = ${original.site_id}
      AND (slug = ${baseSlug} OR slug LIKE ${baseSlug + '-%'})
    `;

    let newSlug = baseSlug;
    if (existingSlugs.length > 0) {
      const slugSet = new Set(existingSlugs.map(r => r.slug as string));
      // If base slug is taken, find the next available number
      if (slugSet.has(baseSlug)) {
        let counter = 2;
        while (slugSet.has(`${baseSlug}-${counter}`)) {
          counter++;
        }
        newSlug = `${baseSlug}-${counter}`;
      }
    }

    // Create duplicate with same site_id
    const duplicated = await sql`
      INSERT INTO pages (title, slug, is_homepage, header_image, sections, site_id)
      VALUES (
        ${original.title + " (kopie)"},
        ${newSlug},
        false,
        ${original.header_image ? JSON.stringify(original.header_image) : null}::jsonb,
        ${JSON.stringify(original.sections || [])}::jsonb,
        ${original.site_id}
      )
      RETURNING *
    `;

    // Invalidate pages cache
    revalidateTag(CACHE_TAGS.pages, "max");

    return NextResponse.json(duplicated[0]);
  } catch (error) {
    console.error("Failed to duplicate page:", error);
    return NextResponse.json(
      { error: "Failed to duplicate page" },
      { status: 500 }
    );
  }
}
