import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import {
  reorderCategories,
  CATEGORIES_CACHE_TAG,
} from "@/lib/configurator/categories";

export async function PUT(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({
      feature: "configurator",
    });
    if (!authorized) return response;

    const body = await request.json();
    const { orderedIds, siteId } = body as {
      orderedIds: string[];
      siteId: string;
    };

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId is required" },
        { status: 400 }
      );
    }

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds array is required" },
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

    await reorderCategories(siteId, orderedIds);

    // Invalidate cache
    revalidateTag(CATEGORIES_CACHE_TAG, "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder categories:", error);
    return NextResponse.json(
      { error: "Failed to reorder categories" },
      { status: 500 }
    );
  }
}
