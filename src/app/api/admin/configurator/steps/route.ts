import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import {
  getSteps,
  createStep,
  STEPS_CACHE_TAG,
} from "@/lib/configurator/steps";
import type { CreateStepInput } from "@/lib/configurator/steps";

export async function GET(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({
      feature: "configurator",
    });
    if (!authorized) return response;

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const categoryId = searchParams.get("categoryId");

    if (!siteId || !categoryId) {
      return NextResponse.json(
        { error: "siteId and categoryId are required" },
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

    const steps = await getSteps(siteId, categoryId);
    return NextResponse.json(steps);
  } catch (error) {
    console.error("Failed to fetch steps:", error);
    return NextResponse.json(
      { error: "Failed to fetch steps" },
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
    const { siteId, categoryId, ...stepData } = body as CreateStepInput & {
      siteId: string;
      categoryId: string;
    };

    if (!siteId || !categoryId) {
      return NextResponse.json(
        { error: "siteId and categoryId are required" },
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

    if (!stepData.name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const step = await createStep(siteId, categoryId, stepData);

    // Invalidate cache
    revalidateTag(STEPS_CACHE_TAG, "max");

    return NextResponse.json(step);
  } catch (error) {
    console.error("Failed to create step:", error);
    return NextResponse.json(
      { error: "Failed to create step" },
      { status: 500 }
    );
  }
}
