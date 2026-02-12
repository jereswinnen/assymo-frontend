import type {
  PriceCalculationInput,
  PriceCalculationResult,
  ConfiguratorPricing,
  ConfiguratorQuestion,
  QuestionOption,
  PriceCatalogueItem,
} from "./types";
import {
  getPricingForProduct,
  getPricingForCategory,
  getQuestionsForProduct,
  getQuestionsForCategory,
} from "./queries";
import { getCatalogueItemsForSite } from "./catalogue";
import { getDefaultPricing, getDefaultQuestions } from "@/config/configurator";

/**
 * Calculate price estimate based on configuration answers
 */
export async function calculatePrice(
  input: PriceCalculationInput,
  siteSlug: string = "assymo"
): Promise<PriceCalculationResult> {
  // Try category-based lookup first (new system), then product-based (legacy)
  let pricing = await getPricingForCategory(input.product_slug, siteSlug);
  let questions = await getQuestionsForCategory(input.product_slug, siteSlug);

  // Fall back to legacy product_slug based lookup
  if (!pricing) {
    pricing = await getPricingForProduct(input.product_slug, siteSlug);
  }
  if (questions.length === 0) {
    questions = await getQuestionsForProduct(input.product_slug, siteSlug);
  }

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
      display_type: "select" as const,
      options: q.options || null,
      required: q.required,
      order_rank: q.order_rank,
      catalogue_item_id: null,
      price_per_unit_min: null,
      price_per_unit_max: null,
      step_id: null,
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
 * Get option price from catalogue or manual price fields (flat price only)
 */
function getOptionFlatPrice(
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
 * Get catalogue item for an option (for unit-based pricing)
 */
function getOptionCatalogueItem(
  option: QuestionOption,
  catalogueMap: Map<string, PriceCatalogueItem>
): PriceCatalogueItem | null {
  if (option.catalogueItemId) {
    return catalogueMap.get(option.catalogueItemId) || null;
  }
  return null;
}

/**
 * Get dimension value from answers, supporting both English and Dutch keys
 * Uses partial matching to find keys that contain the dimension name
 */
function getDimensionValue(
  answers: PriceCalculationInput["answers"],
  ...searchTerms: string[]
): number {
  // First try exact matches
  for (const key of searchTerms) {
    const value = answers[key];
    if (typeof value === "number" && value > 0) {
      return value;
    }
  }

  // Then try partial matches (key contains the search term)
  for (const [answerKey, value] of Object.entries(answers)) {
    if (typeof value === "number" && value > 0) {
      const lowerKey = answerKey.toLowerCase();
      for (const term of searchTerms) {
        if (lowerKey.includes(term.toLowerCase())) {
          return value;
        }
      }
    }
  }

  return 0;
}

/**
 * Calculate area from dimension answers
 * Supports both English (length, width, height) and Dutch (lengte, breedte, hoogte) keys
 * Returns: length × width, or length × height, or width × height
 */
function calculateArea(answers: PriceCalculationInput["answers"]): number {
  const length = getDimensionValue(answers, "length", "lengte");
  const width = getDimensionValue(answers, "width", "breedte");
  const height = getDimensionValue(answers, "height", "hoogte");

  // Prefer length × width, then length × height, then width × height
  if (length > 0 && width > 0) {
    return length * width;
  }
  if (length > 0 && height > 0) {
    return length * height;
  }
  if (width > 0 && height > 0) {
    return width * height;
  }
  return 0;
}

/**
 * Get length value from answers (for "per m" unit calculations)
 */
function getLength(answers: PriceCalculationInput["answers"]): number {
  return getDimensionValue(answers, "length", "lengte");
}

/**
 * Calculate price from pricing config and answers (pure function for testing)
 *
 * Calculation logic:
 * 1. Start with base price (min/max) from category pricing
 * 2. Calculate area from dimension answers (length, width, height)
 * 3. For each answered question:
 *    - single-select: add selected option's price (considering unit)
 *    - multi-select: sum all selected options' prices (considering unit)
 *    - number: multiply value × pricePerUnit (min/max)
 * 4. For options with catalogue items:
 *    - "per m²": price × area
 *    - "per m": price × length
 *    - "per stuk" or no unit: flat price
 * 5. Return total min/max
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

  // Calculate area and length from dimension answers
  const area = calculateArea(answers);
  const length = getLength(answers);

  /**
   * Process an option's price based on its catalogue item's unit
   */
  const processOptionPrice = (option: QuestionOption): { min: number; max: number } | null => {
    const catalogueItem = getOptionCatalogueItem(option, catalogueMap);

    if (catalogueItem) {
      const basePrice = { min: catalogueItem.price_min, max: catalogueItem.price_max };

      // Apply unit-based multiplier
      if (catalogueItem.unit === "per m²" && area > 0) {
        return { min: basePrice.min * area, max: basePrice.max * area };
      } else if (catalogueItem.unit === "per m" && length > 0) {
        return { min: basePrice.min * length, max: basePrice.max * length };
      } else {
        // "per stuk" or no unit = flat price
        return basePrice;
      }
    }

    // Fall back to manual/flat pricing
    return getOptionFlatPrice(option, catalogueMap);
  };

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
        const price = processOptionPrice(selectedOption);
        if (price) {
          totalModifierMin += price.min;
          totalModifierMax += price.max;

          // Build breakdown label with unit info
          const catalogueItem = getOptionCatalogueItem(selectedOption, catalogueMap);
          let breakdownLabel = selectedOption.label;
          if (catalogueItem?.unit === "per m²" && area > 0) {
            breakdownLabel = `${selectedOption.label} (${area.toFixed(1)} m²)`;
          } else if (catalogueItem?.unit === "per m" && length > 0) {
            breakdownLabel = `${selectedOption.label} (${length} m)`;
          }

          modifierBreakdown.push({
            label: breakdownLabel,
            amount: price.min, // Use min for breakdown display
          });
        }
      }
    } else if (question.type === "multi-select" && Array.isArray(answer)) {
      // Multi-select: sum all selected options' prices
      for (const selectedValue of answer) {
        const selectedOption = question.options?.find((o) => o.value === selectedValue);
        if (selectedOption) {
          const price = processOptionPrice(selectedOption);
          if (price) {
            totalModifierMin += price.min;
            totalModifierMax += price.max;

            // Build breakdown label with unit info
            const catalogueItem = getOptionCatalogueItem(selectedOption, catalogueMap);
            let breakdownLabel = selectedOption.label;
            if (catalogueItem?.unit === "per m²" && area > 0) {
              breakdownLabel = `${selectedOption.label} (${area.toFixed(1)} m²)`;
            } else if (catalogueItem?.unit === "per m" && length > 0) {
              breakdownLabel = `${selectedOption.label} (${length} m)`;
            }

            modifierBreakdown.push({
              label: breakdownLabel,
              amount: price.min, // Use min for breakdown display
            });
          }
        }
      }
    } else if (question.type === "number" && typeof answer === "number") {
      // Number: multiply value × pricePerUnit (for non-dimension numbers like quantity)
      // Skip dimension keys - they're handled via area calculation
      const dimensionTerms = ["length", "width", "height", "lengte", "breedte", "hoogte"];
      const lowerKey = questionKey.toLowerCase();
      const isDimensionKey = dimensionTerms.some(term => lowerKey.includes(term));
      if (isDimensionKey) {
        continue;
      }

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
 * Format price as "Vanaf" (starting from) price
 * Uses only the minimum price since there's no real maximum for custom products
 */
export function formatPriceRange(minCents: number, _maxCents?: number): string {
  return `Vanaf ${formatPrice(minCents)}`;
}
