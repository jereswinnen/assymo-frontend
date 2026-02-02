import { NextRequest, NextResponse } from "next/server";
import { getPricingForProduct, getPricingForCategory, formatPrice, formatPriceRange } from "@/lib/configurator";
import { getDefaultPricing } from "@/config/configurator";

/**
 * GET /api/configurator/pricing
 * Public API to get configurator pricing for a product/category
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
    let dbPricing = await getPricingForCategory(productSlug, siteSlug);

    // Fall back to product_slug-based lookup for backward compatibility
    if (!dbPricing) {
      dbPricing = await getPricingForProduct(productSlug, siteSlug);
    }

    const cacheHeaders = {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    };

    // If no pricing in database, use defaults
    if (!dbPricing) {
      const defaultPricing = getDefaultPricing(productSlug);

      if (!defaultPricing) {
        return NextResponse.json(
          { error: "No pricing configured for this product" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
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
        },
        { headers: cacheHeaders }
      );
    }

    return NextResponse.json(
      {
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
      },
      { headers: cacheHeaders }
    );
  } catch (error) {
    console.error("Error fetching configurator pricing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
