import { NextRequest, NextResponse } from "next/server";
import { getSiteParameters } from "@/lib/content";

/**
 * GET /api/content/parameters
 * Public API to get site parameters
 * Query params:
 * - site: Site slug (defaults to "assymo")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteSlug = searchParams.get("site") || "assymo";

    const parameters = await getSiteParameters(siteSlug);

    if (!parameters) {
      return NextResponse.json(
        { error: "Site parameters not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { parameters },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching site parameters:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
