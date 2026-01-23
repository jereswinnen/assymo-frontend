// Configurator types

export type QuestionType = "single-select" | "multi-select" | "number" | "dimensions";

export interface QuestionOption {
  value: string;
  label: string;
  priceModifier?: number; // in cents, can be positive or negative
}

export interface ConfiguratorQuestion {
  id: string;
  product_slug: string | null; // NULL = applies to all products
  question_key: string;
  label: string;
  type: QuestionType;
  options: QuestionOption[] | null; // For select types
  required: boolean;
  order_rank: number;
  site_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateQuestionInput {
  product_slug: string | null;
  question_key: string;
  label: string;
  type: QuestionType;
  options?: QuestionOption[];
  required?: boolean;
  order_rank?: number;
}

export interface UpdateQuestionInput {
  product_slug?: string | null;
  question_key?: string;
  label?: string;
  type?: QuestionType;
  options?: QuestionOption[] | null;
  required?: boolean;
  order_rank?: number;
}

export interface PriceModifier {
  questionKey: string;
  optionValue: string;
  modifier: number; // in cents
}

export interface ConfiguratorPricing {
  id: string;
  product_slug: string;
  base_price_min: number; // in cents
  base_price_max: number; // in cents
  price_modifiers: PriceModifier[] | null;
  site_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePricingInput {
  product_slug: string;
  base_price_min: number;
  base_price_max: number;
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
  answers: Record<string, string | string[] | number | { length: number; width: number; height?: number }>;
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
