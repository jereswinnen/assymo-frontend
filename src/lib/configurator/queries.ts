import { neon } from "@neondatabase/serverless";
import { unstable_cache } from "next/cache";
import type {
  ConfiguratorQuestion,
  ConfiguratorPricing,
  QuoteSubmission,
  CreateQuestionInput,
  UpdateQuestionInput,
  CreatePricingInput,
  UpdatePricingInput,
  CreateQuoteSubmissionInput,
} from "./types";

const sql = neon(process.env.DATABASE_URL!);

// Cache tags for on-demand revalidation
export const CONFIGURATOR_CACHE_TAGS = {
  questions: "configurator-questions",
  pricing: "configurator-pricing",
} as const;

// Default site slug
const DEFAULT_SITE_SLUG = "assymo";

// =============================================================================
// Site ID Helper
// =============================================================================

async function _getSiteIdBySlug(slug: string): Promise<string | null> {
  const rows = await sql`SELECT id FROM sites WHERE slug = ${slug}`;
  return rows[0]?.id || null;
}

const getSiteIdBySlug = (slug: string) =>
  unstable_cache(_getSiteIdBySlug, [`site-id-${slug}`], {
    revalidate: 86400,
  })(slug);

// =============================================================================
// Questions - Public Queries
// =============================================================================

/**
 * Get questions for a specific product (or all products if null)
 * Returns questions that apply to all products (product_slug IS NULL) + product-specific ones
 */
async function _getQuestionsForProduct(
  productSlug: string | null,
  siteSlug: string = DEFAULT_SITE_SLUG
): Promise<ConfiguratorQuestion[]> {
  const siteId = await getSiteIdBySlug(siteSlug);
  if (!siteId) return [];

  let rows;
  if (productSlug) {
    // Get questions that apply to all products OR this specific product
    rows = await sql`
      SELECT *
      FROM configurator_questions
      WHERE site_id = ${siteId}
        AND (product_slug IS NULL OR product_slug = ${productSlug})
      ORDER BY order_rank, created_at
    `;
  } else {
    // Get only questions that apply to all products
    rows = await sql`
      SELECT *
      FROM configurator_questions
      WHERE site_id = ${siteId}
        AND product_slug IS NULL
      ORDER BY order_rank, created_at
    `;
  }

  return rows as ConfiguratorQuestion[];
}

export const getQuestionsForProduct = (
  productSlug: string | null,
  siteSlug: string = DEFAULT_SITE_SLUG
) =>
  unstable_cache(
    _getQuestionsForProduct,
    [`configurator-questions-${siteSlug}-${productSlug || "all"}`],
    {
      tags: [CONFIGURATOR_CACHE_TAGS.questions],
      revalidate: 60,
    }
  )(productSlug, siteSlug);

/**
 * Get questions for a category by slug (public, cached)
 */
async function _getQuestionsForCategory(
  categorySlug: string,
  siteSlug: string = DEFAULT_SITE_SLUG
): Promise<ConfiguratorQuestion[]> {
  const siteId = await getSiteIdBySlug(siteSlug);
  if (!siteId) return [];

  const rows = await sql`
    SELECT q.*
    FROM configurator_questions q
    JOIN configurator_categories c ON q.category_id = c.id
    WHERE q.site_id = ${siteId}
      AND c.slug = ${categorySlug}
    ORDER BY q.order_rank, q.created_at
  `;

  return rows as ConfiguratorQuestion[];
}

export const getQuestionsForCategory = (
  categorySlug: string,
  siteSlug: string = DEFAULT_SITE_SLUG
) =>
  unstable_cache(
    _getQuestionsForCategory,
    [`configurator-questions-category-${siteSlug}-${categorySlug}`],
    {
      tags: [CONFIGURATOR_CACHE_TAGS.questions],
      revalidate: 60,
    }
  )(categorySlug, siteSlug);

// =============================================================================
// Pricing - Public Queries
// =============================================================================

/**
 * Get pricing configuration for a specific product
 */
async function _getPricingForProduct(
  productSlug: string,
  siteSlug: string = DEFAULT_SITE_SLUG
): Promise<ConfiguratorPricing | null> {
  const siteId = await getSiteIdBySlug(siteSlug);
  if (!siteId) return null;

  const rows = await sql`
    SELECT *
    FROM configurator_pricing
    WHERE site_id = ${siteId}
      AND product_slug = ${productSlug}
  `;

  return (rows[0] as ConfiguratorPricing) || null;
}

export const getPricingForProduct = (
  productSlug: string,
  siteSlug: string = DEFAULT_SITE_SLUG
) =>
  unstable_cache(
    _getPricingForProduct,
    [`configurator-pricing-${siteSlug}-${productSlug}`],
    {
      tags: [CONFIGURATOR_CACHE_TAGS.pricing],
      revalidate: 60,
    }
  )(productSlug, siteSlug);

/**
 * Get pricing for a category by slug (public, cached)
 */
async function _getPricingForCategory(
  categorySlug: string,
  siteSlug: string = DEFAULT_SITE_SLUG
): Promise<ConfiguratorPricing | null> {
  const siteId = await getSiteIdBySlug(siteSlug);
  if (!siteId) return null;

  const rows = await sql`
    SELECT p.*
    FROM configurator_pricing p
    JOIN configurator_categories c ON p.category_id = c.id
    WHERE p.site_id = ${siteId}
      AND c.slug = ${categorySlug}
  `;

  return (rows[0] as ConfiguratorPricing) || null;
}

export const getPricingForCategory = (
  categorySlug: string,
  siteSlug: string = DEFAULT_SITE_SLUG
) =>
  unstable_cache(
    _getPricingForCategory,
    [`configurator-pricing-category-${siteSlug}-${categorySlug}`],
    {
      tags: [CONFIGURATOR_CACHE_TAGS.pricing],
      revalidate: 60,
    }
  )(categorySlug, siteSlug);

// =============================================================================
// Questions - Admin Queries (no caching)
// =============================================================================

/**
 * Get all questions for a site (admin)
 */
export async function getAllQuestions(siteId: string): Promise<ConfiguratorQuestion[]> {
  const rows = await sql`
    SELECT *
    FROM configurator_questions
    WHERE site_id = ${siteId}
    ORDER BY product_slug NULLS FIRST, order_rank, created_at
  `;
  return rows as ConfiguratorQuestion[];
}

/**
 * Get questions for a specific product (admin)
 * @deprecated Use getQuestionsByCategory instead
 */
export async function getQuestionsByProduct(
  siteId: string,
  productSlug: string | null
): Promise<ConfiguratorQuestion[]> {
  if (productSlug === null) {
    const rows = await sql`
      SELECT *
      FROM configurator_questions
      WHERE site_id = ${siteId}
        AND product_slug IS NULL
      ORDER BY order_rank, created_at
    `;
    return rows as ConfiguratorQuestion[];
  }

  const rows = await sql`
    SELECT *
    FROM configurator_questions
    WHERE site_id = ${siteId}
      AND product_slug = ${productSlug}
    ORDER BY order_rank, created_at
  `;
  return rows as ConfiguratorQuestion[];
}

/**
 * Get questions for a specific category (admin)
 */
export async function getQuestionsByCategory(
  siteId: string,
  categoryId: string
): Promise<ConfiguratorQuestion[]> {
  const rows = await sql`
    SELECT *
    FROM configurator_questions
    WHERE site_id = ${siteId}
      AND category_id = ${categoryId}
    ORDER BY order_rank, created_at
  `;
  return rows as ConfiguratorQuestion[];
}

/**
 * Get a single question by ID
 */
export async function getQuestionById(
  siteId: string,
  questionId: string
): Promise<ConfiguratorQuestion | null> {
  const rows = await sql`
    SELECT *
    FROM configurator_questions
    WHERE id = ${questionId}
      AND site_id = ${siteId}
  `;
  return (rows[0] as ConfiguratorQuestion) || null;
}

/**
 * Create a new question
 */
export async function createQuestion(
  siteId: string,
  input: CreateQuestionInput
): Promise<ConfiguratorQuestion> {
  const rows = await sql`
    INSERT INTO configurator_questions (
      product_slug,
      category_id,
      question_key,
      label,
      heading_level,
      subtitle,
      type,
      display_type,
      options,
      required,
      order_rank,
      catalogue_item_id,
      price_per_unit_min,
      price_per_unit_max,
      site_id
    ) VALUES (
      ${input.product_slug},
      ${input.category_id ?? null},
      ${input.question_key},
      ${input.label},
      ${input.heading_level ?? "h2"},
      ${input.subtitle ?? null},
      ${input.type},
      ${input.display_type ?? "select"},
      ${input.options ? JSON.stringify(input.options) : null},
      ${input.required ?? true},
      ${input.order_rank ?? 0},
      ${input.catalogue_item_id ?? null},
      ${input.price_per_unit_min ?? null},
      ${input.price_per_unit_max ?? null},
      ${siteId}
    )
    RETURNING *
  `;
  return rows[0] as ConfiguratorQuestion;
}

/**
 * Update a question
 */
export async function updateQuestion(
  siteId: string,
  questionId: string,
  input: UpdateQuestionInput
): Promise<ConfiguratorQuestion | null> {
  const existing = await getQuestionById(siteId, questionId);
  if (!existing) return null;

  const rows = await sql`
    UPDATE configurator_questions
    SET
      product_slug = ${input.product_slug !== undefined ? input.product_slug : existing.product_slug},
      category_id = ${input.category_id !== undefined ? input.category_id : existing.category_id},
      question_key = ${input.question_key ?? existing.question_key},
      label = ${input.label ?? existing.label},
      heading_level = ${input.heading_level ?? existing.heading_level},
      subtitle = ${input.subtitle !== undefined ? input.subtitle : existing.subtitle},
      type = ${input.type ?? existing.type},
      display_type = ${input.display_type ?? existing.display_type ?? "select"},
      options = ${input.options !== undefined ? (input.options ? JSON.stringify(input.options) : null) : (existing.options ? JSON.stringify(existing.options) : null)},
      required = ${input.required ?? existing.required},
      order_rank = ${input.order_rank ?? existing.order_rank},
      catalogue_item_id = ${input.catalogue_item_id !== undefined ? input.catalogue_item_id : existing.catalogue_item_id},
      price_per_unit_min = ${input.price_per_unit_min !== undefined ? input.price_per_unit_min : existing.price_per_unit_min},
      price_per_unit_max = ${input.price_per_unit_max !== undefined ? input.price_per_unit_max : existing.price_per_unit_max},
      updated_at = now()
    WHERE id = ${questionId}
      AND site_id = ${siteId}
    RETURNING *
  `;
  return (rows[0] as ConfiguratorQuestion) || null;
}

/**
 * Delete a question
 */
export async function deleteQuestion(siteId: string, questionId: string): Promise<boolean> {
  const existing = await getQuestionById(siteId, questionId);
  if (!existing) return false;

  await sql`
    DELETE FROM configurator_questions
    WHERE id = ${questionId}
      AND site_id = ${siteId}
  `;
  return true;
}

// =============================================================================
// Pricing - Admin Queries (no caching)
// =============================================================================

/**
 * Get all pricing configurations for a site
 */
export async function getAllPricing(siteId: string): Promise<ConfiguratorPricing[]> {
  const rows = await sql`
    SELECT *
    FROM configurator_pricing
    WHERE site_id = ${siteId}
    ORDER BY product_slug
  `;
  return rows as ConfiguratorPricing[];
}

/**
 * Get pricing by ID
 */
export async function getPricingById(
  siteId: string,
  pricingId: string
): Promise<ConfiguratorPricing | null> {
  const rows = await sql`
    SELECT *
    FROM configurator_pricing
    WHERE id = ${pricingId}
      AND site_id = ${siteId}
  `;
  return (rows[0] as ConfiguratorPricing) || null;
}

/**
 * Create or update pricing for a product or category (upsert)
 * Supports both product_slug (deprecated) and category_id
 */
export async function upsertPricing(
  siteId: string,
  input: CreatePricingInput
): Promise<ConfiguratorPricing> {
  // Use category_id if provided, otherwise fall back to product_slug
  if (input.category_id) {
    // Check if pricing exists for this category
    const existing = await sql`
      SELECT id FROM configurator_pricing
      WHERE site_id = ${siteId} AND category_id = ${input.category_id}
    `;

    if (existing.length > 0) {
      // Update existing pricing
      const rows = await sql`
        UPDATE configurator_pricing
        SET
          base_price_min = ${input.base_price_min},
          base_price_max = ${input.base_price_max},
          price_modifiers = ${input.price_modifiers ? JSON.stringify(input.price_modifiers) : null},
          updated_at = now()
        WHERE site_id = ${siteId} AND category_id = ${input.category_id}
        RETURNING *
      `;
      return rows[0] as ConfiguratorPricing;
    }

    // Insert new pricing
    const rows = await sql`
      INSERT INTO configurator_pricing (
        product_slug,
        category_id,
        base_price_min,
        base_price_max,
        price_modifiers,
        site_id
      ) VALUES (
        ${input.product_slug ?? null},
        ${input.category_id},
        ${input.base_price_min},
        ${input.base_price_max},
        ${input.price_modifiers ? JSON.stringify(input.price_modifiers) : null},
        ${siteId}
      )
      RETURNING *
    `;
    return rows[0] as ConfiguratorPricing;
  }

  // Legacy: product_slug based pricing (uses existing unique constraint)
  const rows = await sql`
    INSERT INTO configurator_pricing (
      product_slug,
      base_price_min,
      base_price_max,
      price_modifiers,
      site_id
    ) VALUES (
      ${input.product_slug},
      ${input.base_price_min},
      ${input.base_price_max},
      ${input.price_modifiers ? JSON.stringify(input.price_modifiers) : null},
      ${siteId}
    )
    ON CONFLICT (product_slug, site_id)
    DO UPDATE SET
      base_price_min = EXCLUDED.base_price_min,
      base_price_max = EXCLUDED.base_price_max,
      price_modifiers = EXCLUDED.price_modifiers,
      updated_at = now()
    RETURNING *
  `;
  return rows[0] as ConfiguratorPricing;
}

/**
 * Update pricing
 */
export async function updatePricing(
  siteId: string,
  pricingId: string,
  input: UpdatePricingInput
): Promise<ConfiguratorPricing | null> {
  const existing = await getPricingById(siteId, pricingId);
  if (!existing) return null;

  const rows = await sql`
    UPDATE configurator_pricing
    SET
      base_price_min = ${input.base_price_min ?? existing.base_price_min},
      base_price_max = ${input.base_price_max ?? existing.base_price_max},
      price_modifiers = ${input.price_modifiers !== undefined ? (input.price_modifiers ? JSON.stringify(input.price_modifiers) : null) : (existing.price_modifiers ? JSON.stringify(existing.price_modifiers) : null)},
      updated_at = now()
    WHERE id = ${pricingId}
      AND site_id = ${siteId}
    RETURNING *
  `;
  return (rows[0] as ConfiguratorPricing) || null;
}

/**
 * Delete pricing
 */
export async function deletePricing(siteId: string, pricingId: string): Promise<boolean> {
  const existing = await getPricingById(siteId, pricingId);
  if (!existing) return false;

  await sql`
    DELETE FROM configurator_pricing
    WHERE id = ${pricingId}
      AND site_id = ${siteId}
  `;
  return true;
}

// =============================================================================
// Quote Submissions
// =============================================================================

/**
 * Create a quote submission
 */
export async function createQuoteSubmission(
  siteId: string,
  input: CreateQuoteSubmissionInput
): Promise<QuoteSubmission> {
  const rows = await sql`
    INSERT INTO quote_submissions (
      configuration,
      price_estimate_min,
      price_estimate_max,
      contact_name,
      contact_email,
      contact_phone,
      contact_address,
      appointment_id,
      site_id
    ) VALUES (
      ${JSON.stringify(input.configuration)},
      ${input.price_estimate_min ?? null},
      ${input.price_estimate_max ?? null},
      ${input.contact_name},
      ${input.contact_email},
      ${input.contact_phone ?? null},
      ${input.contact_address ?? null},
      ${input.appointment_id ?? null},
      ${siteId}
    )
    RETURNING *
  `;
  return rows[0] as QuoteSubmission;
}

/**
 * Get all quote submissions for a site (admin)
 */
export async function getQuoteSubmissions(
  siteId: string,
  limit = 50,
  offset = 0
): Promise<QuoteSubmission[]> {
  const rows = await sql`
    SELECT *
    FROM quote_submissions
    WHERE site_id = ${siteId}
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
  return rows as QuoteSubmission[];
}

/**
 * Get a single quote submission by ID
 */
export async function getQuoteSubmissionById(
  siteId: string,
  submissionId: string
): Promise<QuoteSubmission | null> {
  const rows = await sql`
    SELECT *
    FROM quote_submissions
    WHERE id = ${submissionId}
      AND site_id = ${siteId}
  `;
  return (rows[0] as QuoteSubmission) || null;
}

/**
 * Count quote submissions for a site
 */
export async function countQuoteSubmissions(siteId: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*) as count
    FROM quote_submissions
    WHERE site_id = ${siteId}
  `;
  return Number(rows[0]?.count || 0);
}

// =============================================================================
// Quote Reminder Queries
// =============================================================================

/**
 * Get quote submissions that need a reminder email
 * Returns submissions where:
 * - No appointment was booked (appointment_id IS NULL)
 * - Reminder hasn't been sent yet (reminder_sent_at IS NULL)
 * - Created exactly `daysAfterSubmission` days ago (targets that specific day)
 */
export async function getQuoteSubmissionsNeedingReminder(
  daysAfterSubmission: number
): Promise<QuoteSubmission[]> {
  const rows = await sql`
    SELECT *
    FROM quote_submissions
    WHERE appointment_id IS NULL
      AND reminder_sent_at IS NULL
      AND created_at >= (CURRENT_DATE - ${daysAfterSubmission})::timestamptz
      AND created_at < (CURRENT_DATE - ${daysAfterSubmission - 1})::timestamptz
    ORDER BY created_at ASC
  `;
  return rows as QuoteSubmission[];
}

/**
 * Mark a quote submission as having had its reminder sent
 */
export async function markQuoteReminderSent(submissionId: string): Promise<void> {
  await sql`
    UPDATE quote_submissions
    SET reminder_sent_at = now()
    WHERE id = ${submissionId}
  `;
}
