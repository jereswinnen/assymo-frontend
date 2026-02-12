import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import {
  getStepById,
  updateStep,
  deleteStep,
  STEPS_CACHE_TAG,
} from "@/lib/configurator/steps";
import { CONFIGURATOR_CACHE_TAGS } from "@/lib/configurator/queries";
import type { UpdateStepInput } from "@/lib/configurator/steps";

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

    const step = await getStepById(siteId, id);

    if (!step) {
      return NextResponse.json(
        { error: "Step not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(step);
  } catch (error) {
    console.error("Failed to fetch step:", error);
    return NextResponse.json(
      { error: "Failed to fetch step" },
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
    const { siteId, ...stepData } = body as UpdateStepInput & {
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

    const step = await updateStep(siteId, id, stepData);

    if (!step) {
      return NextResponse.json(
        { error: "Step not found" },
        { status: 404 }
      );
    }

    // Invalidate cache
    revalidateTag(STEPS_CACHE_TAG, "max");

    return NextResponse.json(step);
  } catch (error) {
    console.error("Failed to update step:", error);
    return NextResponse.json(
      { error: "Failed to update step" },
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

    const deleted = await deleteStep(siteId, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Step not found" },
        { status: 404 }
      );
    }

    // Invalidate both steps and questions cache (questions may have lost their step_id)
    revalidateTag(STEPS_CACHE_TAG, "max");
    revalidateTag(CONFIGURATOR_CACHE_TAGS.questions, "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete step:", error);
    return NextResponse.json(
      { error: "Failed to delete step" },
      { status: 500 }
    );
  }
}
