import { NextRequest, NextResponse } from "next/server";
import {
  calculatePrice,
  formatPrice,
  formatPriceRange,
  type PriceCalculationInput,
} from "@/lib/configurator";

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

    const input: PriceCalculationInput = {
      product_slug,
      answers,
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
