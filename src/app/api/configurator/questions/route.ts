import { NextRequest, NextResponse } from "next/server";
import { getQuestionsForProduct, getQuestionsForCategory } from "@/lib/configurator";
import { getDefaultQuestions } from "@/config/configurator";

/**
 * GET /api/configurator/questions
 * Public API to get configurator questions for a product/category
 * Query params:
 * - product: Product/category slug (required)
 * - site: Site slug (defaults to "assymo")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productSlug = searchParams.get("product");
    const siteSlug = searchParams.get("site") || "assymo";

    if (!productSlug) {
      return NextResponse.json(
        { error: "Product parameter is required" },
        { status: 400 }
      );
    }

    // Try category-based lookup first (new system)
    let dbQuestions = await getQuestionsForCategory(productSlug, siteSlug);

    // Fall back to product_slug-based lookup for backward compatibility
    if (dbQuestions.length === 0) {
      dbQuestions = await getQuestionsForProduct(productSlug, siteSlug);
    }

    // If no questions in database, use defaults
    if (dbQuestions.length === 0) {
      const defaultQuestions = getDefaultQuestions(productSlug);
      return NextResponse.json({
        questions: defaultQuestions,
        source: "default",
      });
    }

    return NextResponse.json({
      questions: dbQuestions,
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching configurator questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
