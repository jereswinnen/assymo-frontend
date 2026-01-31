import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import {
  getAllPricing,
  upsertPricing,
  CONFIGURATOR_CACHE_TAGS,
} from "@/lib/configurator/queries";
import type { CreatePricingInput } from "@/lib/configurator/types";

export async function GET(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({
      feature: "configurator",
    });
    if (!authorized) return response;

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(siteId)) {
      return NextResponse.json(
        { error: "Geen toegang tot deze site" },
        { status: 403 }
      );
    }

    const pricing = await getAllPricing(siteId);

    return NextResponse.json(pricing);
  } catch (error) {
    console.error("Failed to fetch pricing:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({
      feature: "configurator",
    });
    if (!authorized) return response;

    const body = await request.json();
    const { siteId, ...pricingData } = body as CreatePricingInput & {
      siteId: string;
    };

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    const isSuperAdmin = ctx!.user.role === "super_admin";
    if (!isSuperAdmin && !ctx!.userSites.includes(siteId)) {
      return NextResponse.json(
        { error: "Geen toegang tot deze site" },
        { status: 403 }
      );
    }

    // Require either category_id or product_slug (category_id preferred)
    if (
      (!pricingData.category_id && !pricingData.product_slug) ||
      pricingData.base_price_min === undefined ||
      pricingData.base_price_max === undefined
    ) {
      return NextResponse.json(
        { error: "category_id (or product_slug), base_price_min and base_price_max are required" },
        { status: 400 }
      );
    }

    const pricing = await upsertPricing(siteId, pricingData);

    // Invalidate cache
    revalidateTag(CONFIGURATOR_CACHE_TAGS.pricing, "max");

    return NextResponse.json(pricing);
  } catch (error) {
    console.error("Failed to save pricing:", error);
    return NextResponse.json(
      { error: "Failed to save pricing" },
      { status: 500 }
    );
  }
}
