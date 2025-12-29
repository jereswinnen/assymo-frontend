import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/content";

const sql = neon(process.env.DATABASE_URL!);

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "solutions" });
    if (!authorized) return response;

    const { id } = await params;

    const rows = await sql`
      SELECT s.*,
        COALESCE(
          json_agg(
            json_build_object('id', f.id, 'name', f.name, 'slug', f.slug, 'category_id', f.category_id)
          ) FILTER (WHERE f.id IS NOT NULL),
          '[]'
        ) as filters
      FROM solutions s
      LEFT JOIN solution_filters sf ON s.id = sf.solution_id
      LEFT JOIN filters f ON sf.filter_id = f.id
      WHERE s.id = ${id}
      GROUP BY s.id
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    const solution = rows[0];

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(solution.site_id)) {
      return NextResponse.json({ error: "Geen toegang tot deze realisatie" }, { status: 403 });
    }

    return NextResponse.json(solution);
  } catch (error) {
    console.error("Failed to fetch solution:", error);
    return NextResponse.json(
      { error: "Failed to fetch solution" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "solutions" });
    if (!authorized) return response;

    const { id } = await params;
    const { name, subtitle, slug, header_image, sections, filter_ids } =
      await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Fetch existing solution to check site access
    const existing = await sql`SELECT site_id FROM solutions WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    const siteId = existing[0].site_id;

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(siteId)) {
      return NextResponse.json({ error: "Geen toegang tot deze realisatie" }, { status: 403 });
    }

    // Check if slug already exists for another solution in the same site
    const slugExists = await sql`
      SELECT id FROM solutions WHERE slug = ${slug} AND id != ${id} AND site_id = ${siteId}
    `;

    if (slugExists.length > 0) {
      return NextResponse.json(
        { error: "A solution with this slug already exists" },
        { status: 409 }
      );
    }

    const rows = await sql`
      UPDATE solutions
      SET
        name = ${name},
        subtitle = ${subtitle || null},
        slug = ${slug},
        header_image = ${header_image ? JSON.stringify(header_image) : null}::jsonb,
        sections = ${JSON.stringify(sections || [])}::jsonb,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    // Update filters if provided
    if (Array.isArray(filter_ids)) {
      await sql`DELETE FROM solution_filters WHERE solution_id = ${id}`;

      for (const filterId of filter_ids) {
        await sql`
          INSERT INTO solution_filters (solution_id, filter_id)
          VALUES (${id}, ${filterId})
          ON CONFLICT DO NOTHING
        `;
      }
    }

    // Fetch updated solution with filters
    const updated = await sql`
      SELECT s.*,
        COALESCE(
          json_agg(
            json_build_object('id', f.id, 'name', f.name, 'slug', f.slug, 'category_id', f.category_id)
          ) FILTER (WHERE f.id IS NOT NULL),
          '[]'
        ) as filters
      FROM solutions s
      LEFT JOIN solution_filters sf ON s.id = sf.solution_id
      LEFT JOIN filters f ON sf.filter_id = f.id
      WHERE s.id = ${id}
      GROUP BY s.id
    `;

    revalidateTag(CACHE_TAGS.solutions, "max");
    revalidateTag(CACHE_TAGS.navigation, "max");

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Failed to update solution:", error);
    return NextResponse.json(
      { error: "Failed to update solution" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "solutions" });
    if (!authorized) return response;

    const { id } = await params;

    const existing = await sql`SELECT site_id FROM solutions WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(existing[0].site_id)) {
      return NextResponse.json({ error: "Geen toegang tot deze realisatie" }, { status: 403 });
    }

    await sql`DELETE FROM solutions WHERE id = ${id}`;

    revalidateTag(CACHE_TAGS.solutions, "max");
    revalidateTag(CACHE_TAGS.navigation, "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete solution:", error);
    return NextResponse.json(
      { error: "Failed to delete solution" },
      { status: 500 }
    );
  }
}
