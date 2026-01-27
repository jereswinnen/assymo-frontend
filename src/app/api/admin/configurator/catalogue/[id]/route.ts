import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import {
  getCatalogueItemById,
  updateCatalogueItem,
  deleteCatalogueItem,
  CATALOGUE_CACHE_TAG,
} from "@/lib/configurator/catalogue";
import type { UpdatePriceCatalogueInput } from "@/lib/configurator/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({
      feature: "configurator",
    });
    if (!authorized) return response;

    const { id } = await params;
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

    const item = await getCatalogueItemById(siteId, id);

    if (!item) {
      return NextResponse.json(
        { error: "Catalogue item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to fetch catalogue item:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalogue item" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({
      feature: "configurator",
    });
    if (!authorized) return response;

    const { id } = await params;
    const body = await request.json();
    const { siteId, ...itemData } = body as UpdatePriceCatalogueInput & {
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

    const item = await updateCatalogueItem(siteId, id, itemData);

    if (!item) {
      return NextResponse.json(
        { error: "Catalogue item not found" },
        { status: 404 }
      );
    }

    // Invalidate cache
    revalidateTag(CATALOGUE_CACHE_TAG, "max");

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update catalogue item:", error);
    return NextResponse.json(
      { error: "Failed to update catalogue item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { authorized, response, ctx } = await protectRoute({
      feature: "configurator",
    });
    if (!authorized) return response;

    const { id } = await params;
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

    const deleted = await deleteCatalogueItem(siteId, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Catalogue item not found" },
        { status: 404 }
      );
    }

    // Invalidate cache
    revalidateTag(CATALOGUE_CACHE_TAG, "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete catalogue item:", error);
    return NextResponse.json(
      { error: "Failed to delete catalogue item" },
      { status: 500 }
    );
  }
}
