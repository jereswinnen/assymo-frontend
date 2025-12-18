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

    const { categoryId, orderedIds } = await request.json();

    if (!categoryId || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "categoryId and orderedIds are required" },
        { status: 400 }
      );
    }

    // Update order_rank for each filter
    for (let i = 0; i < orderedIds.length; i++) {
      await sql`
        UPDATE filters
        SET order_rank = ${i}
        WHERE id = ${orderedIds[i]} AND category_id = ${categoryId}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder filters:", error);
    return NextResponse.json(
      { error: "Failed to reorder filters" },
      { status: 500 }
    );
  }
}
