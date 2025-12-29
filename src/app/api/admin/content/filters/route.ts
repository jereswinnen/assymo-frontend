import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { updateTag } from "next/cache";
import { isAuthenticated } from "@/lib/auth-utils";
import { CACHE_TAGS } from "@/lib/content";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, slug, category_id } = await request.json();

    if (!name || !slug || !category_id) {
      return NextResponse.json(
        { error: "Name, slug, and category_id are required" },
        { status: 400 }
      );
    }

    const rows = await sql`
      INSERT INTO filters (name, slug, category_id)
      VALUES (${name}, ${slug}, ${category_id})
      RETURNING *
    `;

    // Invalidate filters cache
    updateTag(CACHE_TAGS.filters);

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to create filter:", error);
    return NextResponse.json(
      { error: "Failed to create filter" },
      { status: 500 }
    );
  }
}
