import { NextRequest, NextResponse } from "next/server";
import { getNavigation } from "@/lib/content";

/**
 * GET /api/content/navigation
 * Public API to get navigation links
 * Query params:
 * - location: "header" or "footer" (required)
 * - site: Site slug (defaults to "assymo")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const siteSlug = searchParams.get("site") || "assymo";

    if (!location || (location !== "header" && location !== "footer")) {
      return NextResponse.json(
        { error: "Location parameter must be 'header' or 'footer'" },
        { status: 400 }
      );
    }

    const navigation = await getNavigation(location, siteSlug);
    return NextResponse.json(
      { navigation },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching navigation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
