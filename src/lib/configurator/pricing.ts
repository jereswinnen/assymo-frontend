import type {
  PriceCalculationInput,
  PriceCalculationResult,
  ConfiguratorPricing,
  ConfiguratorQuestion,
  QuestionOption,
  PriceCatalogueItem,
} from "./types";
import { getPricingForProduct, getQuestionsForProduct } from "./queries";
import { getCatalogueItemsForSite } from "./catalogue";
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

  // Fetch catalogue items for pricing lookups
  const catalogueItems = await getCatalogueItemsForSite(siteSlug);

  // Fall back to default pricing if not in database
  if (!pricing) {
    const defaultPricing = getDefaultPricing(input.product_slug);
    if (defaultPricing) {
      pricing = {
        id: "default",
        product_slug: defaultPricing.product_slug,
        category_id: null,
        base_price_min: defaultPricing.base_price_min,
        base_price_max: defaultPricing.base_price_max,
        price_per_m2_min: null,
        price_per_m2_max: null,
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
      category_id: null,
      question_key: q.question_key,
      label: q.label,
      heading_level: "h2" as const,
      subtitle: null,
      type: q.type,
      options: q.options || null,
      required: q.required,
      order_rank: q.order_rank,
      catalogue_item_id: null,
      price_per_unit_min: null,
      price_per_unit_max: null,
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

  return calculatePriceFromConfig(pricing, questions, input.answers, catalogueItems);
}

/**
 * Get option price from catalogue or manual price fields
 */
function getOptionPrice(
  option: QuestionOption,
  catalogueMap: Map<string, PriceCatalogueItem>
): { min: number; max: number } | null {
  // First check for catalogue reference
  if (option.catalogueItemId) {
    const catalogueItem = catalogueMap.get(option.catalogueItemId);
    if (catalogueItem) {
      return { min: catalogueItem.price_min, max: catalogueItem.price_max };
    }
    // Catalogue item was deleted - no price contribution
    return null;
  }

  // Then check for manual price
  if (option.priceModifierMin !== undefined || option.priceModifierMax !== undefined) {
    return {
      min: option.priceModifierMin || 0,
      max: option.priceModifierMax || option.priceModifierMin || 0,
    };
  }

  // Legacy support: old priceModifier field (flat amount for both min and max)
  if (option.priceModifier !== undefined) {
    return { min: option.priceModifier, max: option.priceModifier };
  }

  // No price set for this option
  return null;
}

/**
 * Calculate price from pricing config and answers (pure function for testing)
 *
 * New calculation logic:
 * 1. Start with base price (min/max) from category pricing
 * 2. For each answered question:
 *    - single-select: add selected option's price (from catalogue or manual)
 *    - multi-select: sum all selected options' prices
 *    - number: multiply value × pricePerUnit (min/max)
 *    - dimensions: calculate area (length × width) × pricePerM2 (min/max)
 * 3. Return total min/max
 */
export function calculatePriceFromConfig(
  pricing: ConfiguratorPricing,
  questions: ConfiguratorQuestion[],
  answers: PriceCalculationInput["answers"],
  catalogueItems?: PriceCatalogueItem[]
): PriceCalculationResult {
  let totalModifierMin = 0;
  let totalModifierMax = 0;
  const modifierBreakdown: { label: string; amount: number }[] = [];

  // Build catalogue lookup map
  const catalogueMap = new Map<string, PriceCatalogueItem>();
  if (catalogueItems) {
    for (const item of catalogueItems) {
      catalogueMap.set(item.id, item);
    }
  }

  // Build a map of question keys to their questions
  const questionMap = new Map<string, ConfiguratorQuestion>();
  for (const q of questions) {
    questionMap.set(q.question_key, q);
  }

  // Process each answered question
  for (const [questionKey, answer] of Object.entries(answers)) {
    if (answer === undefined || answer === null) continue;

    const question = questionMap.get(questionKey);
    if (!question) continue;

    // Handle different question/answer types
    if (question.type === "single-select" && typeof answer === "string") {
      // Single-select: add selected option's price
      const selectedOption = question.options?.find((o) => o.value === answer);
      if (selectedOption) {
        const price = getOptionPrice(selectedOption, catalogueMap);
        if (price) {
          totalModifierMin += price.min;
          totalModifierMax += price.max;
          modifierBreakdown.push({
            label: selectedOption.label,
            amount: price.min, // Use min for breakdown display
          });
        }
      }
    } else if (question.type === "multi-select" && Array.isArray(answer)) {
      // Multi-select: sum all selected options' prices
      for (const selectedValue of answer) {
        const selectedOption = question.options?.find((o) => o.value === selectedValue);
        if (selectedOption) {
          const price = getOptionPrice(selectedOption, catalogueMap);
          if (price) {
            totalModifierMin += price.min;
            totalModifierMax += price.max;
            modifierBreakdown.push({
              label: selectedOption.label,
              amount: price.min, // Use min for breakdown display
            });
          }
        }
      }
    } else if (question.type === "number" && typeof answer === "number") {
      // Number: multiply value × pricePerUnit
      if (question.price_per_unit_min || question.price_per_unit_max) {
        const perUnitMin = question.price_per_unit_min || 0;
        const perUnitMax = question.price_per_unit_max || perUnitMin;
        totalModifierMin += perUnitMin * answer;
        totalModifierMax += perUnitMax * answer;
        modifierBreakdown.push({
          label: `${question.label}: ${answer}`,
          amount: perUnitMin * answer,
        });
      }
    } else if (
      question.type === "dimensions" &&
      typeof answer === "object" &&
      "length" in answer &&
      "width" in answer
    ) {
      // Dimensions: calculate area × pricePerM2 (from category pricing)
      // Note: dimensions are stored in meters
      const area = answer.length * answer.width;
      if (area > 0 && (pricing.price_per_m2_min || pricing.price_per_m2_max)) {
        const perM2Min = pricing.price_per_m2_min || 0;
        const perM2Max = pricing.price_per_m2_max || perM2Min;
        totalModifierMin += perM2Min * area;
        totalModifierMax += perM2Max * area;
        modifierBreakdown.push({
          label: `${question.label}: ${area.toFixed(1)} m²`,
          amount: perM2Min * area,
        });
      }
    }
  }

  // Legacy support: apply old-style price modifiers if present
  // This ensures backward compatibility with existing configurations
  if (pricing.price_modifiers && Array.isArray(pricing.price_modifiers)) {
    for (const modifier of pricing.price_modifiers) {
      const answer = answers[modifier.questionKey];
      if (answer === undefined || answer === null) continue;

      if (typeof answer === "string" && answer === modifier.optionValue) {
        totalModifierMin += modifier.modifier;
        totalModifierMax += modifier.modifier;
        const question = questionMap.get(modifier.questionKey);
        const option = question?.options?.find((o) => o.value === modifier.optionValue);
        modifierBreakdown.push({
          label: option?.label || modifier.optionValue,
          amount: modifier.modifier,
        });
      } else if (Array.isArray(answer) && answer.includes(modifier.optionValue)) {
        totalModifierMin += modifier.modifier;
        totalModifierMax += modifier.modifier;
        const question = questionMap.get(modifier.questionKey);
        const option = question?.options?.find((o) => o.value === modifier.optionValue);
        modifierBreakdown.push({
          label: option?.label || modifier.optionValue,
          amount: modifier.modifier,
        });
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
