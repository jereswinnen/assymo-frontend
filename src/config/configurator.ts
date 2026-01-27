// Default configurator configuration
// Used as fallback when no questions/pricing are configured in the database

import type { QuestionOption, PriceModifier } from "@/lib/configurator/types";

// =============================================================================
// Quote Reminder Configuration
// =============================================================================

export const QUOTE_REMINDER_CONFIG = {
  /** Number of days after quote submission to send the reminder */
  daysAfterSubmission: 3,
} as const;

// =============================================================================
// Default Questions (used when database is empty)
// =============================================================================

export interface DefaultQuestion {
  question_key: string;
  label: string;
  type: "single-select" | "multi-select" | "number" | "text";
  options?: QuestionOption[];
  required: boolean;
  order_rank: number;
  /** If null, applies to all products. Otherwise, only for this product slug. */
  product_slug: string | null;
}

/**
 * Default questions that apply to all products
 */
export const DEFAULT_COMMON_QUESTIONS: DefaultQuestion[] = [
  {
    question_key: "style",
    label: "Stijl",
    type: "single-select",
    options: [
      { value: "modern", label: "Modern" },
      { value: "klassiek", label: "Klassiek" },
      { value: "landelijk", label: "Landelijk" },
      { value: "cottage", label: "Cottage" },
    ],
    required: true,
    order_rank: 10,
    product_slug: null,
  },
  {
    question_key: "material",
    label: "Materiaal",
    type: "single-select",
    options: [
      { value: "eik", label: "Eik", priceModifier: 0 },
      { value: "beuk", label: "Beuk", priceModifier: -500000 }, // -€5000
      { value: "thermowood", label: "Thermowood", priceModifier: 200000 }, // +€2000
    ],
    required: true,
    order_rank: 20,
    product_slug: null,
  },
];

/**
 * Product-specific default questions
 */
export const DEFAULT_PRODUCT_QUESTIONS: Record<string, DefaultQuestion[]> = {
  poolhouses: [
    {
      question_key: "length",
      label: "Lengte (m)",
      type: "number",
      required: true,
      order_rank: 5,
      product_slug: "poolhouses",
    },
    {
      question_key: "width",
      label: "Breedte (m)",
      type: "number",
      required: true,
      order_rank: 6,
      product_slug: "poolhouses",
    },
    {
      question_key: "features",
      label: "Extra opties",
      type: "multi-select",
      options: [
        { value: "kitchen", label: "Buitenkeuken", priceModifier: 800000 },
        { value: "shower", label: "Douche", priceModifier: 350000 },
        { value: "toilet", label: "Toilet", priceModifier: 250000 },
        { value: "heating", label: "Verwarming", priceModifier: 400000 },
      ],
      required: false,
      order_rank: 30,
      product_slug: "poolhouses",
    },
  ],
  carports: [
    {
      question_key: "car_count",
      label: "Aantal wagens",
      type: "single-select",
      options: [
        { value: "1", label: "1 wagen", priceModifier: 0 },
        { value: "2", label: "2 wagens", priceModifier: 500000 },
        { value: "3", label: "3 wagens", priceModifier: 1000000 },
      ],
      required: true,
      order_rank: 5,
      product_slug: "carports",
    },
    {
      question_key: "storage",
      label: "Berging",
      type: "single-select",
      options: [
        { value: "none", label: "Geen berging" },
        { value: "small", label: "Kleine berging", priceModifier: 300000 },
        { value: "large", label: "Grote berging", priceModifier: 600000 },
      ],
      required: true,
      order_rank: 25,
      product_slug: "carports",
    },
  ],
  poorten: [
    {
      question_key: "gate_type",
      label: "Type poort",
      type: "single-select",
      options: [
        { value: "swing", label: "Draaipoort" },
        { value: "sliding", label: "Schuifpoort", priceModifier: 200000 },
      ],
      required: true,
      order_rank: 5,
      product_slug: "poorten",
    },
    {
      question_key: "automation",
      label: "Automatisering",
      type: "single-select",
      options: [
        { value: "manual", label: "Manueel" },
        { value: "motorized", label: "Gemotoriseerd", priceModifier: 350000 },
      ],
      required: true,
      order_rank: 25,
      product_slug: "poorten",
    },
  ],
  guesthouse: [
    {
      question_key: "length",
      label: "Lengte (m)",
      type: "number",
      required: true,
      order_rank: 5,
      product_slug: "guesthouse",
    },
    {
      question_key: "width",
      label: "Breedte (m)",
      type: "number",
      required: true,
      order_rank: 6,
      product_slug: "guesthouse",
    },
    {
      question_key: "bedrooms",
      label: "Aantal slaapkamers",
      type: "single-select",
      options: [
        { value: "1", label: "1 slaapkamer" },
        { value: "2", label: "2 slaapkamers", priceModifier: 800000 },
      ],
      required: true,
      order_rank: 25,
      product_slug: "guesthouse",
    },
    {
      question_key: "bathroom",
      label: "Badkamer",
      type: "single-select",
      options: [
        { value: "none", label: "Geen badkamer" },
        { value: "shower", label: "Douchekamer", priceModifier: 500000 },
        { value: "full", label: "Volledige badkamer", priceModifier: 900000 },
      ],
      required: true,
      order_rank: 30,
      product_slug: "guesthouse",
    },
  ],
};

/**
 * Get all default questions for a product
 */
export function getDefaultQuestions(productSlug: string | null): DefaultQuestion[] {
  const common = [...DEFAULT_COMMON_QUESTIONS];

  if (productSlug && DEFAULT_PRODUCT_QUESTIONS[productSlug]) {
    const productSpecific = DEFAULT_PRODUCT_QUESTIONS[productSlug];
    return [...productSpecific, ...common].sort((a, b) => a.order_rank - b.order_rank);
  }

  return common;
}

// =============================================================================
// Default Pricing (used when database is empty)
// =============================================================================

export interface DefaultPricing {
  product_slug: string;
  base_price_min: number; // in cents
  base_price_max: number; // in cents
  price_modifiers: PriceModifier[];
}

export const DEFAULT_PRICING: Record<string, DefaultPricing> = {
  poolhouses: {
    product_slug: "poolhouses",
    base_price_min: 3500000, // €35.000
    base_price_max: 7500000, // €75.000
    price_modifiers: [
      { questionKey: "material", optionValue: "eik", modifier: 0 },
      { questionKey: "material", optionValue: "beuk", modifier: -500000 },
      { questionKey: "material", optionValue: "thermowood", modifier: 200000 },
      { questionKey: "features", optionValue: "kitchen", modifier: 800000 },
      { questionKey: "features", optionValue: "shower", modifier: 350000 },
      { questionKey: "features", optionValue: "toilet", modifier: 250000 },
      { questionKey: "features", optionValue: "heating", modifier: 400000 },
    ],
  },
  carports: {
    product_slug: "carports",
    base_price_min: 1500000, // €15.000
    base_price_max: 3500000, // €35.000
    price_modifiers: [
      { questionKey: "car_count", optionValue: "2", modifier: 500000 },
      { questionKey: "car_count", optionValue: "3", modifier: 1000000 },
      { questionKey: "storage", optionValue: "small", modifier: 300000 },
      { questionKey: "storage", optionValue: "large", modifier: 600000 },
    ],
  },
  poorten: {
    product_slug: "poorten",
    base_price_min: 800000, // €8.000
    base_price_max: 2000000, // €20.000
    price_modifiers: [
      { questionKey: "gate_type", optionValue: "sliding", modifier: 200000 },
      { questionKey: "automation", optionValue: "motorized", modifier: 350000 },
    ],
  },
  guesthouse: {
    product_slug: "guesthouse",
    base_price_min: 5000000, // €50.000
    base_price_max: 12000000, // €120.000
    price_modifiers: [
      { questionKey: "bedrooms", optionValue: "2", modifier: 800000 },
      { questionKey: "bathroom", optionValue: "shower", modifier: 500000 },
      { questionKey: "bathroom", optionValue: "full", modifier: 900000 },
    ],
  },
};

/**
 * Get default pricing for a product
 */
export function getDefaultPricing(productSlug: string): DefaultPricing | null {
  return DEFAULT_PRICING[productSlug] || null;
}

// =============================================================================
// Product slugs that support the configurator
// @deprecated - Use configurator_categories table instead
// Kept for backward compatibility with existing product_slug references
// =============================================================================

/**
 * @deprecated Use configurator_categories from database instead
 */
export const CONFIGURATOR_PRODUCTS = [
  "poolhouses",
  "carports",
  "poorten",
  "guesthouse",
  "tuinkamers",
  "tuinhuizen-op-maat",
  "bijgebouwen",
  "overdekkingen",
  "woninguitbreiding",
] as const;

export type ConfiguratorProduct = (typeof CONFIGURATOR_PRODUCTS)[number];

/**
 * Check if a product slug supports the configurator
 * @deprecated Use configurator_categories from database instead
 */
export function isConfiguratorProduct(slug: string): slug is ConfiguratorProduct {
  return CONFIGURATOR_PRODUCTS.includes(slug as ConfiguratorProduct);
}
