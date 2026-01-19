import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { protectRoute } from "@/lib/permissions";

const sql = neon(process.env.DATABASE_URL!);

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/sites/[id]
 * Get a single site
 * Requires: sites feature (super_admin only)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response } = await protectRoute({ feature: "sites" });
    if (!authorized) return response;

    const { id } = await params;

    const sites = await sql`
      SELECT id, name, slug, domain, is_active, capabilities, created_at
      FROM sites
      WHERE id = ${id}
    `;

    if (sites.length === 0) {
      return NextResponse.json(
        { error: "Site niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ site: sites[0] });
  } catch (error) {
    console.error("Error fetching site:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/sites/[id]
 * Update a site
 * Requires: sites feature (super_admin only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response } = await protectRoute({ feature: "sites" });
    if (!authorized) return response;

    const { id } = await params;
    const body = await request.json();
    const { name, slug, domain, is_active, capabilities } = body;

    // Check if site exists
    const existing = await sql`SELECT id FROM sites WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Site niet gevonden" },
        { status: 404 }
      );
    }

    // If changing slug, validate it
    if (slug) {
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json(
          { error: "Slug mag alleen kleine letters, cijfers en koppeltekens bevatten" },
          { status: 400 }
        );
      }

      // Check if new slug conflicts with another site
      const slugConflict = await sql`
        SELECT id FROM sites WHERE slug = ${slug} AND id != ${id}
      `;
      if (slugConflict.length > 0) {
        return NextResponse.json(
          { error: "Deze slug is al in gebruik" },
          { status: 409 }
        );
      }
    }

    // Update each field individually
    if (name !== undefined) {
      await sql`UPDATE sites SET name = ${name} WHERE id = ${id}`;
    }
    if (slug !== undefined) {
      await sql`UPDATE sites SET slug = ${slug} WHERE id = ${id}`;
    }
    if (domain !== undefined) {
      await sql`UPDATE sites SET domain = ${domain || null} WHERE id = ${id}`;
    }
    if (is_active !== undefined) {
      await sql`UPDATE sites SET is_active = ${is_active} WHERE id = ${id}`;
    }
    if (capabilities !== undefined) {
      await sql`UPDATE sites SET capabilities = ${JSON.stringify(capabilities)}::jsonb WHERE id = ${id}`;
    }

    // Fetch updated site
    const result = await sql`
      SELECT id, name, slug, domain, is_active, capabilities, created_at
      FROM sites
      WHERE id = ${id}
    `;

    return NextResponse.json({ site: result[0] });
  } catch (error) {
    console.error("Error updating site:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sites/[id]
 * Delete a site (only if no content is assigned)
 * Requires: sites feature (super_admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response } = await protectRoute({ feature: "sites" });
    if (!authorized) return response;

    const { id } = await params;

    // Check if site exists
    const existing = await sql`SELECT slug FROM sites WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Site niet gevonden" },
        { status: 404 }
      );
    }

    // Don't allow deleting the main site (assymo)
    if (existing[0].slug === "assymo") {
      return NextResponse.json(
        { error: "De hoofdsite kan niet worden verwijderd" },
        { status: 400 }
      );
    }

    // Check if any content is assigned to this site
    const contentCount = await sql`
      SELECT
        (SELECT COUNT(*) FROM pages WHERE site_id = ${id}) +
        (SELECT COUNT(*) FROM solutions WHERE site_id = ${id}) +
        (SELECT COUNT(*) FROM navigation_links WHERE site_id = ${id}) +
        (SELECT COUNT(*) FROM filters WHERE site_id = ${id}) +
        (SELECT COUNT(*) FROM filter_categories WHERE site_id = ${id}) +
        (SELECT COUNT(*) FROM image_metadata WHERE site_id = ${id}) +
        (SELECT COUNT(*) FROM media_folders WHERE site_id = ${id}) +
        (SELECT COUNT(*) FROM site_parameters WHERE site_id = ${id})
        as total
    `;

    if (contentCount[0].total > 0) {
      return NextResponse.json(
        { error: "Site heeft nog content. Verplaats of verwijder eerst alle content." },
        { status: 400 }
      );
    }

    // Check if any users are assigned to this site
    const userCount = await sql`
      SELECT COUNT(*) as total FROM user_sites WHERE site_id = ${id}
    `;

    if (userCount[0].total > 0) {
      return NextResponse.json(
        { error: "Er zijn nog gebruikers toegewezen aan deze site." },
        { status: 400 }
      );
    }

    // Delete the site
    await sql`DELETE FROM sites WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting site:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
