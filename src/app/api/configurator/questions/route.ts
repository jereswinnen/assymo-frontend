import { NextRequest, NextResponse } from "next/server";
import { getQuestionsForProduct, getQuestionsForCategory, type ConfiguratorQuestion } from "@/lib/configurator";
import { getDefaultQuestions } from "@/config/configurator";

/**
 * Maps database question to frontend format
 * - Maps `subtitle` to `description` for frontend compatibility
 */
function mapQuestionForFrontend(question: ConfiguratorQuestion) {
  return {
    question_key: question.question_key,
    label: question.label,
    type: question.type,
    display_type: question.display_type || "select",
    options: question.options,
    required: question.required,
    description: question.subtitle, // Map subtitle -> description for frontend
  };
}

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

    const cacheHeaders = {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    };

    // If no questions in database, use defaults
    if (dbQuestions.length === 0) {
      const defaultQuestions = getDefaultQuestions(productSlug);
      return NextResponse.json(
        {
          questions: defaultQuestions,
          source: "default",
        },
        { headers: cacheHeaders }
      );
    }

    // Map database questions to frontend format
    const questions = dbQuestions.map(mapQuestionForFrontend);

    return NextResponse.json(
      {
        questions,
        source: "database",
      },
      { headers: cacheHeaders }
    );
  } catch (error) {
    console.error("Error fetching configurator questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
