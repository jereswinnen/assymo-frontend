import { NextRequest, NextResponse } from "next/server";
import { getPageBySlug } from "@/lib/content";

/**
 * GET /api/content/page
 * Public API to get a page by slug
 * Query params:
 * - slug: Page slug (required)
 * - site: Site slug (defaults to "assymo")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const siteSlug = searchParams.get("site") || "assymo";

    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter is required" },
        { status: 400 }
      );
    }

    const page = await getPageBySlug(slug, siteSlug);

    if (!page) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error("Error fetching page:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
