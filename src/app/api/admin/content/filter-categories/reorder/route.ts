import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isAuthenticated } from "@/lib/auth-utils";

const sql = neon(process.env.DATABASE_URL!);

export async function PUT(request: Request) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderedIds } = await request.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds must be an array" },
        { status: 400 }
      );
    }

    // Update order_rank for each category
    for (let i = 0; i < orderedIds.length; i++) {
      await sql`
        UPDATE filter_categories
        SET order_rank = ${i}
        WHERE id = ${orderedIds[i]}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder filter categories:", error);
    return NextResponse.json(
      { error: "Failed to reorder filter categories" },
      { status: 500 }
    );
  }
}
