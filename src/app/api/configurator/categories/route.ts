import { NextRequest, NextResponse } from "next/server";
import { getCategoriesForSite } from "@/lib/configurator/categories";

/**
 * GET /api/configurator/categories
 * Public API to get configurator categories
 * Query params:
 * - site: Site slug (defaults to "assymo")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteSlug = searchParams.get("site") || "assymo";

    const categories = await getCategoriesForSite(siteSlug);

    return NextResponse.json(
      {
        categories: categories.map((c) => ({
          slug: c.slug,
          name: c.name,
        })),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching configurator categories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
