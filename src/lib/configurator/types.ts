// Configurator types

export type QuestionType = "single-select" | "multi-select" | "text" | "number";

// =============================================================================
// Visibility Rules
// =============================================================================

export type VisibilityOperator =
  | "equals"
  | "not_equals"
  | "includes"
  | "not_includes"
  | "is_not_empty"
  | "is_empty"
  | "greater_than"
  | "less_than";

export interface VisibilityRule {
  questionKey: string;
  operator: VisibilityOperator;
  value?: string | number;
}

export interface VisibilityConfig {
  rules: VisibilityRule[];
  logic: "all" | "any";
  action?: "show" | "hide"; // default "show"
}

export type DisplayType = "select" | "radio-cards";

export type HeadingLevel = "h2" | "h3" | "h4";

// =============================================================================
// Price Catalogue
// =============================================================================

export interface PriceCatalogueItem {
  id: string;
  site_id: string;
  name: string;
  category: string;
  image: string | null; // URL to product image
  price_min: number; // in cents
  price_max: number; // in cents
  unit: string | null; // e.g., "per stuk", "per m²", null for flat price
  created_at: Date;
  updated_at: Date;
}

export interface CreatePriceCatalogueInput {
  name: string;
  category: string;
  image?: string | null;
  price_min: number;
  price_max: number;
  unit?: string | null;
}

export interface UpdatePriceCatalogueInput {
  name?: string;
  category?: string;
  image?: string | null;
  price_min?: number;
  price_max?: number;
  unit?: string | null;
}

// =============================================================================
// Question Options
// =============================================================================

export interface QuestionOption {
  value: string;
  label: string;
  image?: string; // URL to image (for radio-cards display type)
  catalogueItemId?: string; // Reference to price catalogue (linked pricing)
  priceModifierMin?: number; // Manual price override (in cents)
  priceModifierMax?: number; // Manual price override (in cents)
  /** @deprecated Use catalogueItemId or priceModifierMin/Max instead */
  priceModifier?: number; // Legacy: in cents, can be positive or negative
  visibility_rules?: VisibilityConfig | null; // Option-level visibility rules
}

export interface ConfiguratorQuestion {
  id: string;
  product_slug: string | null; // @deprecated - use category_id
  category_id: string | null; // Links to configurator_categories
  question_key: string;
  label: string;
  heading_level: HeadingLevel;
  subtitle: string | null;
  type: QuestionType;
  display_type: DisplayType; // How to render the field (select dropdown or radio cards)
  options: QuestionOption[] | null; // For select types
  required: boolean;
  order_rank: number;
  site_id: string;
  // Pricing for number type questions (multiplied by user input)
  catalogue_item_id: string | null; // Reference to price catalogue for per-unit pricing
  price_per_unit_min: number | null; // Manual per-unit price (in cents)
  price_per_unit_max: number | null; // Manual per-unit price (in cents)
  step_id: string | null; // Links to configurator_steps
  visibility_rules: VisibilityConfig | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateQuestionInput {
  product_slug?: string | null; // @deprecated - use category_id
  category_id?: string | null;
  question_key: string;
  label: string;
  heading_level?: HeadingLevel;
  subtitle?: string | null;
  type: QuestionType;
  display_type?: DisplayType;
  options?: QuestionOption[];
  required?: boolean;
  order_rank?: number;
  catalogue_item_id?: string | null;
  price_per_unit_min?: number | null;
  price_per_unit_max?: number | null;
  step_id?: string | null;
  visibility_rules?: VisibilityConfig | null;
}

export interface UpdateQuestionInput {
  product_slug?: string | null; // @deprecated - use category_id
  category_id?: string | null;
  question_key?: string;
  label?: string;
  heading_level?: HeadingLevel;
  subtitle?: string | null;
  type?: QuestionType;
  display_type?: DisplayType;
  options?: QuestionOption[] | null;
  required?: boolean;
  order_rank?: number;
  catalogue_item_id?: string | null;
  price_per_unit_min?: number | null;
  price_per_unit_max?: number | null;
  step_id?: string | null;
  visibility_rules?: VisibilityConfig | null;
}

export interface PriceModifier {
  questionKey: string;
  optionValue: string;
  modifier: number; // in cents
}

export interface ConfiguratorPricing {
  id: string;
  product_slug: string | null; // @deprecated - use category_id
  category_id: string | null; // Links to configurator_categories
  base_price_min: number; // in cents
  base_price_max: number; // in cents
  /** @deprecated Use option-level pricing instead */
  price_modifiers: PriceModifier[] | null;
  site_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePricingInput {
  product_slug?: string | null; // @deprecated - use category_id
  category_id?: string | null;
  base_price_min: number;
  base_price_max: number;
  /** @deprecated */
  price_modifiers?: PriceModifier[];
}

export interface UpdatePricingInput {
  base_price_min?: number;
  base_price_max?: number;
  price_modifiers?: PriceModifier[] | null;
}

export interface QuoteSubmission {
  id: string;
  configuration: Record<string, unknown>; // Full wizard answers
  price_estimate_min: number | null;
  price_estimate_max: number | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  contact_address: string | null;
  appointment_id: number | null;
  site_id: string;
  created_at: Date;
  reminder_sent_at: Date | null;
}

export interface CreateQuoteSubmissionInput {
  configuration: Record<string, unknown>;
  price_estimate_min?: number;
  price_estimate_max?: number;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_address?: string;
  appointment_id?: number;
}

// For price calculation
export interface PriceCalculationInput {
  product_slug: string;
  answers: Record<string, string | string[] | number>;
}

export interface PriceCalculationResult {
  min: number; // in cents
  max: number; // in cents
  breakdown?: {
    base_min: number;
    base_max: number;
    modifiers: { label: string; amount: number }[];
  };
}
