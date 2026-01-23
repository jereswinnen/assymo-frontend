import { NextRequest, NextResponse } from "next/server";
import { getQuestionsForProduct } from "@/lib/configurator";
import { getDefaultQuestions } from "@/config/configurator";

/**
 * GET /api/configurator/questions
 * Public API to get configurator questions for a product
 * Query params:
 * - product: Product slug (required)
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

    // Get questions from database
    const dbQuestions = await getQuestionsForProduct(productSlug, siteSlug);

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
