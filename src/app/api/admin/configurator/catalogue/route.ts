import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import {
  getCatalogueItems,
  getCatalogueItemCategories,
  createCatalogueItem,
  CATALOGUE_CACHE_TAG,
} from "@/lib/configurator/catalogue";
import type { CreatePriceCatalogueInput } from "@/lib/configurator/types";

export async function GET(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({
      feature: "configurator",
    });
    if (!authorized) return response;

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const categoriesOnly = searchParams.get("categories") === "true";

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

    // Return just categories if requested
    if (categoriesOnly) {
      const categories = await getCatalogueItemCategories(siteId);
      return NextResponse.json(categories);
    }

    const items = await getCatalogueItems(siteId);
    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch catalogue items:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalogue items" },
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
    const { siteId, ...itemData } = body as CreatePriceCatalogueInput & {
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

    if (!itemData.name || !itemData.category) {
      return NextResponse.json(
        { error: "name and category are required" },
        { status: 400 }
      );
    }

    if (itemData.price_min === undefined || itemData.price_max === undefined) {
      return NextResponse.json(
        { error: "price_min and price_max are required" },
        { status: 400 }
      );
    }

    const item = await createCatalogueItem(siteId, itemData);

    // Invalidate cache
    revalidateTag(CATALOGUE_CACHE_TAG, "max");

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to create catalogue item:", error);
    return NextResponse.json(
      { error: "Failed to create catalogue item" },
      { status: 500 }
    );
  }
}
