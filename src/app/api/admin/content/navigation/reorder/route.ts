import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { updateTag } from "next/cache";
import { isAuthenticated } from "@/lib/auth-utils";
import { CACHE_TAGS } from "@/lib/content";

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

    // Update order_rank for each link
    for (let i = 0; i < orderedIds.length; i++) {
      await sql`
        UPDATE navigation_links
        SET order_rank = ${i}
        WHERE id = ${orderedIds[i]}
      `;
    }

    // Invalidate navigation cache
    updateTag(CACHE_TAGS.navigation);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder navigation links:", error);
    return NextResponse.json(
      { error: "Failed to reorder navigation links" },
      { status: 500 }
    );
  }
}
