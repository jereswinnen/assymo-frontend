import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { protectRoute } from "@/lib/permissions";

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/admin/sites
 * List all sites
 * Requires: sites feature (super_admin only)
 */
export async function GET() {
  try {
    const { authorized, response } = await protectRoute({ feature: "sites" });
    if (!authorized) return response;

    const sites = await sql`
      SELECT id, name, slug, domain, is_active, created_at
      FROM sites
      ORDER BY name
    `;

    return NextResponse.json({ sites });
  } catch (error) {
    console.error("Error fetching sites:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sites
 * Create a new site
 * Requires: sites feature (super_admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, response } = await protectRoute({ feature: "sites" });
    if (!authorized) return response;

    const body = await request.json();
    const { name, slug, domain } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Naam en slug zijn verplicht" },
        { status: 400 }
      );
    }

    // Validate slug format (lowercase, alphanumeric, hyphens)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug mag alleen kleine letters, cijfers en koppeltekens bevatten" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await sql`SELECT id FROM sites WHERE slug = ${slug}`;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Deze slug is al in gebruik" },
        { status: 409 }
      );
    }

    const result = await sql`
      INSERT INTO sites (name, slug, domain, is_active)
      VALUES (${name}, ${slug}, ${domain || null}, true)
      RETURNING id, name, slug, domain, is_active, created_at
    `;

    return NextResponse.json({ site: result[0] });
  } catch (error) {
    console.error("Error creating site:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}
