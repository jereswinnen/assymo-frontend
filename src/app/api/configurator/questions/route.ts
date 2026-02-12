import { NextRequest, NextResponse } from "next/server";
import { getQuestionsForProduct, getQuestionsForCategory, type ConfiguratorQuestion } from "@/lib/configurator";
import { getStepsForCategory } from "@/lib/configurator/steps";
import { getCatalogueItemsForSite } from "@/lib/configurator/catalogue";
import { getDefaultQuestions } from "@/config/configurator";

/**
 * Resolve catalogue item images into question options.
 * Options store a `catalogueItemId` reference but not the image URL itself,
 * so we batch-fetch catalogue items and inject images at query time.
 */
async function resolveOptionImages(questions: ConfiguratorQuestion[], siteSlug: string) {
  // Collect all catalogueItemIds across all options
  const catalogueIds = new Set<string>();
  for (const q of questions) {
    if (!q.options) continue;
    for (const opt of q.options) {
      if (opt.catalogueItemId) catalogueIds.add(opt.catalogueItemId);
    }
  }

  if (catalogueIds.size === 0) return questions;

  // Batch-fetch catalogue items
  const catalogueItems = await getCatalogueItemsForSite(siteSlug);
  const catalogueMap = new Map(catalogueItems.map((item) => [item.id, item]));

  // Inject images into options
  return questions.map((q) => ({
    ...q,
    options: q.options?.map((opt) => {
      if (opt.catalogueItemId) {
        const item = catalogueMap.get(opt.catalogueItemId);
        if (item?.image) return { ...opt, image: item.image };
      }
      return opt;
    }) ?? null,
  }));
}

/**
 * Maps database question to frontend format
 * - Maps `subtitle` to `description` for frontend compatibility
 */
function mapQuestionForFrontend(question: ConfiguratorQuestion) {
  return {
    question_key: question.question_key,
    label: question.label,
    type: question.type,
    display_type: question.display_type || "select",
    options: question.options,
    required: question.required,
    description: question.subtitle, // Map subtitle -> description for frontend
  };
}

/**
 * GET /api/configurator/questions
 * Public API to get configurator questions for a product/category
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
    let dbQuestions = await getQuestionsForCategory(productSlug, siteSlug);

    // Fall back to product_slug-based lookup for backward compatibility
    if (dbQuestions.length === 0) {
      dbQuestions = await getQuestionsForProduct(productSlug, siteSlug);
    }

    const cacheHeaders = {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    };

    // If no questions in database, use defaults
    if (dbQuestions.length === 0) {
      const defaultQuestions = getDefaultQuestions(productSlug);
      return NextResponse.json(
        {
          questions: defaultQuestions,
          source: "default",
        },
        { headers: cacheHeaders }
      );
    }

    // Resolve catalogue item images into options
    const questionsWithImages = await resolveOptionImages(dbQuestions, siteSlug);

    // Map database questions to frontend format
    const questions = questionsWithImages.map(mapQuestionForFrontend);

    // Fetch steps for this category
    const steps = await getStepsForCategory(productSlug, siteSlug);

    // If steps exist, group questions by step
    if (steps.length > 0) {
      const questionsByStepId = new Map<string | null, ReturnType<typeof mapQuestionForFrontend>[]>();

      // Map original DB questions to get step_id, then use mapped questions for output
      for (let i = 0; i < questionsWithImages.length; i++) {
        const dbQ = questionsWithImages[i];
        const mappedQ = questions[i];
        const stepId = dbQ.step_id;

        if (!questionsByStepId.has(stepId)) {
          questionsByStepId.set(stepId, []);
        }
        questionsByStepId.get(stepId)!.push(mappedQ);
      }

      // Questions without a step go into the first step
      const unassigned = questionsByStepId.get(null) || [];

      const stepsResponse = steps.map((step, index) => ({
        id: step.id,
        name: step.name,
        description: step.description,
        questions: [
          ...(index === 0 ? unassigned : []),
          ...(questionsByStepId.get(step.id) || []),
        ],
      }));

      return NextResponse.json(
        {
          questions, // flat list for backward compat
          steps: stepsResponse,
          source: "database",
        },
        { headers: cacheHeaders }
      );
    }

    return NextResponse.json(
      {
        questions,
        source: "database",
      },
      { headers: cacheHeaders }
    );
  } catch (error) {
    console.error("Error fetching configurator questions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
