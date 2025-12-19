import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAuthenticated } from "@/lib/auth-utils";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the original solution with its filters
    const rows = await sql`
      SELECT s.*,
        COALESCE(
          array_agg(sf.filter_id) FILTER (WHERE sf.filter_id IS NOT NULL),
          '{}'
        ) as filter_ids
      FROM solutions s
      LEFT JOIN solution_filters sf ON s.id = sf.solution_id
      WHERE s.id = ${id}
      GROUP BY s.id
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    const original = rows[0];

    // Generate unique slug
    const baseSlug = `${original.slug}-kopie`;
    let newSlug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await sql`
        SELECT id FROM solutions WHERE slug = ${newSlug}
      `;
      if (existing.length === 0) break;
      counter++;
      newSlug = `${baseSlug}-${counter}`;
    }

    // Get the highest order_rank
    const maxRank = await sql`
      SELECT COALESCE(MAX(order_rank), 0) as max_rank FROM solutions
    `;
    const newOrderRank = (maxRank[0].max_rank as number) + 1;

    // Create duplicate
    const duplicated = await sql`
      INSERT INTO solutions (name, subtitle, slug, header_image, sections, order_rank)
      VALUES (
        ${original.name + " (kopie)"},
        ${original.subtitle},
        ${newSlug},
        ${original.header_image ? JSON.stringify(original.header_image) : null}::jsonb,
        ${JSON.stringify(original.sections || [])}::jsonb,
        ${newOrderRank}
      )
      RETURNING *
    `;

    const newSolution = duplicated[0];

    // Copy filter associations
    const filterIds = original.filter_ids as string[];
    if (filterIds && filterIds.length > 0) {
      for (const filterId of filterIds) {
        await sql`
          INSERT INTO solution_filters (solution_id, filter_id)
          VALUES (${newSolution.id}, ${filterId})
          ON CONFLICT DO NOTHING
        `;
      }
    }

    return NextResponse.json(newSolution);
  } catch (error) {
    console.error("Failed to duplicate solution:", error);
    return NextResponse.json(
      { error: "Failed to duplicate solution" },
      { status: 500 }
    );
  }
}
