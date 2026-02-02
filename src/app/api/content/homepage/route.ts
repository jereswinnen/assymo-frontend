import { NextRequest, NextResponse } from "next/server";
import { getHomepage } from "@/lib/content";

/**
 * GET /api/content/homepage
 * Public API to get the homepage for a site
 * Query params:
 * - site: Site slug (defaults to "assymo")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteSlug = searchParams.get("site") || "assymo";

    const homepage = await getHomepage(siteSlug);

    if (!homepage) {
      return NextResponse.json(
        { error: "Homepage not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { page: homepage },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching homepage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
