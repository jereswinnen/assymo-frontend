import { NextRequest, NextResponse } from "next/server";
import { getFilterCategories } from "@/lib/content";

/**
 * GET /api/content/filters
 * Public API to get filter categories with their filters
 * Query params:
 * - site: Site slug (defaults to "assymo")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteSlug = searchParams.get("site") || "assymo";

    const categories = await getFilterCategories(siteSlug);
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching filter categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
