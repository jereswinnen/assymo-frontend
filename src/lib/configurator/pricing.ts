import type {
  PriceCalculationInput,
  PriceCalculationResult,
  ConfiguratorPricing,
  ConfiguratorQuestion,
} from "./types";
import { getPricingForProduct, getQuestionsForProduct } from "./queries";
import { getDefaultPricing, getDefaultQuestions } from "@/config/configurator";

/**
 * Calculate price estimate based on configuration answers
 */
export async function calculatePrice(
  input: PriceCalculationInput,
  siteSlug: string = "assymo"
): Promise<PriceCalculationResult> {
  // Try database first, fall back to defaults
  let pricing = await getPricingForProduct(input.product_slug, siteSlug);
  let questions = await getQuestionsForProduct(input.product_slug, siteSlug);

  // Fall back to default pricing if not in database
  if (!pricing) {
    const defaultPricing = getDefaultPricing(input.product_slug);
    if (defaultPricing) {
      pricing = {
        id: "default",
        product_slug: defaultPricing.product_slug,
        base_price_min: defaultPricing.base_price_min,
        base_price_max: defaultPricing.base_price_max,
        price_modifiers: defaultPricing.price_modifiers,
        site_id: "default",
        created_at: new Date(),
        updated_at: new Date(),
      };
    }
  }

  // Fall back to default questions if not in database
  if (questions.length === 0) {
    const defaultQuestions = getDefaultQuestions(input.product_slug);
    questions = defaultQuestions.map((q, i) => ({
      id: `default-${i}`,
      product_slug: q.product_slug,
      question_key: q.question_key,
      label: q.label,
      type: q.type,
      options: q.options || null,
      required: q.required,
      order_rank: q.order_rank,
      site_id: "default",
      created_at: new Date(),
      updated_at: new Date(),
    }));
  }

  // If still no pricing, return zeros
  if (!pricing) {
    return {
      min: 0,
      max: 0,
      breakdown: {
        base_min: 0,
        base_max: 0,
        modifiers: [],
      },
    };
  }

  return calculatePriceFromConfig(pricing, questions, input.answers);
}

/**
 * Calculate price from pricing config and answers (pure function for testing)
 */
export function calculatePriceFromConfig(
  pricing: ConfiguratorPricing,
  questions: ConfiguratorQuestion[],
  answers: PriceCalculationInput["answers"]
): PriceCalculationResult {
  let totalModifierMin = 0;
  let totalModifierMax = 0;
  const modifierBreakdown: { label: string; amount: number }[] = [];

  // Build a map of question keys to their options for label lookup
  const questionMap = new Map<string, ConfiguratorQuestion>();
  for (const q of questions) {
    questionMap.set(q.question_key, q);
  }

  // Apply price modifiers based on answers
  if (pricing.price_modifiers && Array.isArray(pricing.price_modifiers)) {
    for (const modifier of pricing.price_modifiers) {
      const answer = answers[modifier.questionKey];

      if (answer === undefined || answer === null) continue;

      // Handle different answer types
      if (typeof answer === "string") {
        // Single-select: exact match
        if (answer === modifier.optionValue) {
          totalModifierMin += modifier.modifier;
          totalModifierMax += modifier.modifier;

          // Get label from question options
          const question = questionMap.get(modifier.questionKey);
          const option = question?.options?.find((o) => o.value === modifier.optionValue);
          modifierBreakdown.push({
            label: option?.label || modifier.optionValue,
            amount: modifier.modifier,
          });
        }
      } else if (Array.isArray(answer)) {
        // Multi-select: check if value is in array
        if (answer.includes(modifier.optionValue)) {
          totalModifierMin += modifier.modifier;
          totalModifierMax += modifier.modifier;

          const question = questionMap.get(modifier.questionKey);
          const option = question?.options?.find((o) => o.value === modifier.optionValue);
          modifierBreakdown.push({
            label: option?.label || modifier.optionValue,
            amount: modifier.modifier,
          });
        }
      } else if (typeof answer === "number") {
        // Number input: modifier could be per-unit
        // For now, apply modifier if any value is set
        // Future: support per-unit pricing (modifier * answer)
        if (modifier.optionValue === "*" || modifier.optionValue === "any") {
          const scaledModifier = modifier.modifier * answer;
          totalModifierMin += scaledModifier;
          totalModifierMax += scaledModifier;

          const question = questionMap.get(modifier.questionKey);
          modifierBreakdown.push({
            label: `${question?.label || modifier.questionKey}: ${answer}`,
            amount: scaledModifier,
          });
        }
      } else if (typeof answer === "object" && "length" in answer && "width" in answer) {
        // Dimensions: calculate area and apply per-m² pricing
        const area = (answer.length * answer.width) / 10000; // Convert cm² to m²
        if (modifier.optionValue === "area" || modifier.optionValue === "m2") {
          const scaledModifier = modifier.modifier * area;
          totalModifierMin += scaledModifier;
          totalModifierMax += scaledModifier;

          const question = questionMap.get(modifier.questionKey);
          modifierBreakdown.push({
            label: `${question?.label || "Oppervlakte"}: ${area.toFixed(1)} m²`,
            amount: scaledModifier,
          });
        }
      }
    }
  }

  return {
    min: pricing.base_price_min + totalModifierMin,
    max: pricing.base_price_max + totalModifierMax,
    breakdown: {
      base_min: pricing.base_price_min,
      base_max: pricing.base_price_max,
      modifiers: modifierBreakdown,
    },
  };
}

/**
 * Format price in euros (from cents)
 */
export function formatPrice(cents: number): string {
  const euros = cents / 100;
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(euros);
}

/**
 * Format price range
 */
export function formatPriceRange(minCents: number, maxCents: number): string {
  if (minCents === maxCents) {
    return formatPrice(minCents);
  }
  return `${formatPrice(minCents)} - ${formatPrice(maxCents)}`;
}
