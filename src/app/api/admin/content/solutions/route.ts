import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAuthenticated } from "@/lib/auth-utils";

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql`
      SELECT id, name, subtitle, slug, header_image, order_rank, updated_at
      FROM solutions
      ORDER BY order_rank, name
    `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch solutions:", error);
    return NextResponse.json(
      { error: "Failed to fetch solutions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, slug } = await request.json();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await sql`
      SELECT id FROM solutions WHERE slug = ${slug}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A solution with this slug already exists" },
        { status: 409 }
      );
    }

    // Get max order_rank
    const maxRank = await sql`
      SELECT COALESCE(MAX(order_rank), -1) + 1 as next_rank FROM solutions
    `;

    const rows = await sql`
      INSERT INTO solutions (name, slug, order_rank, sections)
      VALUES (${name}, ${slug}, ${maxRank[0].next_rank}, '[]'::jsonb)
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to create solution:", error);
    return NextResponse.json(
      { error: "Failed to create solution" },
      { status: 500 }
    );
  }
}
