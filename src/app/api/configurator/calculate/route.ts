import { NextRequest, NextResponse } from "next/server";
import {
  calculatePrice,
  formatPrice,
  formatPriceRange,
  getQuestionsForCategory,
  type PriceCalculationInput,
} from "@/lib/configurator";
import { isQuestionVisible } from "@/lib/configurator/visibility";

/**
 * POST /api/configurator/calculate
 * Public API to calculate price estimate based on configuration
 * Body:
 * - product_slug: Product slug (required)
 * - answers: Record of question_key -> answer value (required)
 * - site: Site slug (defaults to "assymo")
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_slug, answers, site = "assymo" } = body;

    if (!product_slug) {
      return NextResponse.json(
        { error: "product_slug is required" },
        { status: 400 }
      );
    }

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "answers object is required" },
        { status: 400 }
      );
    }

    // Filter out answers for hidden questions and hidden options (server-side guard)
    const questions = await getQuestionsForCategory(product_slug, site);
    const filteredAnswers = { ...answers };
    for (const q of questions) {
      if (!isQuestionVisible(q.visibility_rules, answers)) {
        delete filteredAnswers[q.question_key];
        continue;
      }

      // Filter hidden option values
      if (!q.options) continue;
      const answer = filteredAnswers[q.question_key];
      if (!answer) continue;
      const visibleValues = new Set(
        q.options
          .filter((opt) => isQuestionVisible(opt.visibility_rules, answers))
          .map((opt) => opt.value),
      );
      if (typeof answer === "string" && !visibleValues.has(answer)) {
        delete filteredAnswers[q.question_key];
      }
      if (Array.isArray(answer)) {
        filteredAnswers[q.question_key] = answer.filter((v: string) =>
          visibleValues.has(v),
        );
      }
    }

    const input: PriceCalculationInput = {
      product_slug,
      answers: filteredAnswers,
    };

    const result = await calculatePrice(input, site);

    return NextResponse.json({
      price: {
        min: result.min,
        min_formatted: formatPrice(result.min),
        range_formatted: formatPriceRange(result.min),
      },
    });
  } catch (error) {
    console.error("Error calculating configurator price:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
