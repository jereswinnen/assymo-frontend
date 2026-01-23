import { NextRequest, NextResponse } from "next/server";
import { getPricingForProduct, formatPrice, formatPriceRange } from "@/lib/configurator";
import { getDefaultPricing } from "@/config/configurator";

/**
 * GET /api/configurator/pricing
 * Public API to get configurator pricing for a product
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

    // Get pricing from database
    const dbPricing = await getPricingForProduct(productSlug, siteSlug);

    // If no pricing in database, use defaults
    if (!dbPricing) {
      const defaultPricing = getDefaultPricing(productSlug);

      if (!defaultPricing) {
        return NextResponse.json(
          { error: "No pricing configured for this product" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        pricing: {
          ...defaultPricing,
          base_price_min_formatted: formatPrice(defaultPricing.base_price_min),
          base_price_max_formatted: formatPrice(defaultPricing.base_price_max),
          base_price_range_formatted: formatPriceRange(
            defaultPricing.base_price_min,
            defaultPricing.base_price_max
          ),
        },
        source: "default",
      });
    }

    return NextResponse.json({
      pricing: {
        ...dbPricing,
        base_price_min_formatted: formatPrice(dbPricing.base_price_min),
        base_price_max_formatted: formatPrice(dbPricing.base_price_max),
        base_price_range_formatted: formatPriceRange(
          dbPricing.base_price_min,
          dbPricing.base_price_max
        ),
      },
      source: "database",
    });
  } catch (error) {
    console.error("Error fetching configurator pricing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
