import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import { CACHE_TAGS } from "@/lib/content";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({ feature: "filters" });
    if (!authorized) return response;

    const { name, slug, category_id } = await request.json();

    if (!name || !slug || !category_id) {
      return NextResponse.json(
        { error: "Name, slug, and category_id are required" },
        { status: 400 }
      );
    }

    // Fetch the category to check site access
    const category = await sql`SELECT site_id FROM filter_categories WHERE id = ${category_id}`;
    if (category.length === 0) {
      return NextResponse.json({ error: "Filter category not found" }, { status: 404 });
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(category[0].site_id)) {
      return NextResponse.json({ error: "Geen toegang tot deze filtercategorie" }, { status: 403 });
    }

    const rows = await sql`
      INSERT INTO filters (name, slug, category_id)
      VALUES (${name}, ${slug}, ${category_id})
      RETURNING *
    `;

    // Invalidate filters cache
    revalidateTag(CACHE_TAGS.filters, "max");

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Failed to create filter:", error);
    return NextResponse.json(
      { error: "Failed to create filter" },
      { status: 500 }
    );
  }
}
