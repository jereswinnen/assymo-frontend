import { NextRequest, NextResponse } from "next/server";
import { getAllSolutions, getSolutionBySlug } from "@/lib/content";

/**
 * GET /api/content/solutions
 * Public API to get solutions
 * Query params:
 * - slug: Solution slug (optional - if provided, returns single solution)
 * - site: Site slug (defaults to "assymo")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const siteSlug = searchParams.get("site") || "assymo";

    // If slug is provided, return single solution
    if (slug) {
      const solution = await getSolutionBySlug(slug, siteSlug);

      if (!solution) {
        return NextResponse.json(
          { error: "Solution not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { solution },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
          },
        }
      );
    }

    // Otherwise return all solutions
    const solutions = await getAllSolutions(siteSlug);
    return NextResponse.json(
      { solutions },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching solutions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
