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

    const { id: linkId } = await params;
    const { solution_id } = await request.json();

    if (!solution_id) {
      return NextResponse.json(
        { error: "solution_id is required" },
        { status: 400 }
      );
    }

    // Get max order_rank for this link
    const maxRank = await sql`
      SELECT COALESCE(MAX(order_rank), -1) + 1 as next_rank
      FROM navigation_subitems
      WHERE link_id = ${linkId}
    `;

    const rows = await sql`
      INSERT INTO navigation_subitems (link_id, solution_id, order_rank)
      VALUES (${linkId}, ${solution_id}, ${maxRank[0].next_rank})
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to create navigation subitem:", error);
    return NextResponse.json(
      { error: "Failed to create navigation subitem" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: linkId } = await params;
    const { orderedIds } = await request.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds must be an array" },
        { status: 400 }
      );
    }

    // Update order_rank for each subitem
    for (let i = 0; i < orderedIds.length; i++) {
      await sql`
        UPDATE navigation_subitems
        SET order_rank = ${i}
        WHERE id = ${orderedIds[i]} AND link_id = ${linkId}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder navigation subitems:", error);
    return NextResponse.json(
      { error: "Failed to reorder navigation subitems" },
      { status: 500 }
    );
  }
}
