import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { protectRoute } from "@/lib/permissions";
import {
  getAllQuestions,
  getQuestionsByProduct,
  getQuestionsByCategory,
  createQuestion,
  CONFIGURATOR_CACHE_TAGS,
} from "@/lib/configurator/queries";
import type { CreateQuestionInput } from "@/lib/configurator/types";

export async function GET(request: NextRequest) {
  try {
    const { authorized, response, ctx } = await protectRoute({
      feature: "configurator",
    });
    if (!authorized) return response;

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    const productSlug = searchParams.get("productSlug");
    const categoryId = searchParams.get("categoryId");

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

    let questions;
    if (categoryId) {
      // Get questions for a specific category
      questions = await getQuestionsByCategory(siteId, categoryId);
    } else if (productSlug !== null && productSlug !== undefined) {
      // Get questions for a specific product (or global questions if productSlug is "global")
      // @deprecated - use categoryId instead
      const slug = productSlug === "global" ? null : productSlug;
      questions = await getQuestionsByProduct(siteId, slug);
    } else {
      // Get all questions for the site
      questions = await getAllQuestions(siteId);
    }

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
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
    const { siteId, ...questionData } = body as CreateQuestionInput & {
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

    if (!questionData.label || !questionData.question_key || !questionData.type) {
      return NextResponse.json(
        { error: "label, question_key and type are required" },
        { status: 400 }
      );
    }

    const question = await createQuestion(siteId, questionData);

    // Invalidate cache
    revalidateTag(CONFIGURATOR_CACHE_TAGS.questions, "max");

    return NextResponse.json(question);
  } catch (error) {
    console.error("Failed to create question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}
