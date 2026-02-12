import { neon } from "@neondatabase/serverless";
import { unstable_cache } from "next/cache";

const sql = neon(process.env.DATABASE_URL!);

// =============================================================================
// Types
// =============================================================================

export interface ConfiguratorStep {
  id: string;
  site_id: string;
  category_id: string;
  name: string;
  description: string | null;
  order_rank: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateStepInput {
  name: string;
  description?: string | null;
  order_rank?: number;
}

export interface UpdateStepInput {
  name?: string;
  description?: string | null;
  order_rank?: number;
}

// Cache tags for on-demand revalidation
export const STEPS_CACHE_TAG = "configurator-steps";

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
// Public Queries (cached)
// =============================================================================

/**
 * Get all steps for a category by category slug (public, cached)
 */
async function _getStepsForCategory(
  categorySlug: string,
  siteSlug: string = DEFAULT_SITE_SLUG
): Promise<ConfiguratorStep[]> {
  const siteId = await getSiteIdBySlug(siteSlug);
  if (!siteId) return [];

  const rows = await sql`
    SELECT s.*
    FROM configurator_steps s
    JOIN configurator_categories c ON s.category_id = c.id
    WHERE s.site_id = ${siteId}
      AND c.slug = ${categorySlug}
    ORDER BY s.order_rank, s.created_at
  `;

  return rows as ConfiguratorStep[];
}

export const getStepsForCategory = (
  categorySlug: string,
  siteSlug: string = DEFAULT_SITE_SLUG
) =>
  unstable_cache(
    _getStepsForCategory,
    [`configurator-steps-category-${siteSlug}-${categorySlug}`],
    {
      tags: [STEPS_CACHE_TAG],
      revalidate: false,
    }
  )(categorySlug, siteSlug);

// =============================================================================
// Admin Queries (no caching)
// =============================================================================

/**
 * Get all steps for a category by category ID (admin)
 */
export async function getSteps(
  siteId: string,
  categoryId: string
): Promise<ConfiguratorStep[]> {
  const rows = await sql`
    SELECT *
    FROM configurator_steps
    WHERE site_id = ${siteId}
      AND category_id = ${categoryId}
    ORDER BY order_rank, created_at
  `;

  return rows as ConfiguratorStep[];
}

/**
 * Get a step by ID (admin)
 */
export async function getStepById(
  siteId: string,
  stepId: string
): Promise<ConfiguratorStep | null> {
  const rows = await sql`
    SELECT *
    FROM configurator_steps
    WHERE id = ${stepId}
      AND site_id = ${siteId}
  `;

  return (rows[0] as ConfiguratorStep) || null;
}

/**
 * Create a new step
 */
export async function createStep(
  siteId: string,
  categoryId: string,
  input: CreateStepInput
): Promise<ConfiguratorStep> {
  // Get max order_rank if not specified
  let orderRank = input.order_rank;
  if (orderRank === undefined) {
    const maxResult = await sql`
      SELECT COALESCE(MAX(order_rank), 0) + 1 as next_rank
      FROM configurator_steps
      WHERE site_id = ${siteId}
        AND category_id = ${categoryId}
    `;
    orderRank = maxResult[0]?.next_rank || 1;
  }

  const rows = await sql`
    INSERT INTO configurator_steps (
      name,
      description,
      order_rank,
      category_id,
      site_id
    ) VALUES (
      ${input.name},
      ${input.description ?? null},
      ${orderRank},
      ${categoryId},
      ${siteId}
    )
    RETURNING *
  `;

  return rows[0] as ConfiguratorStep;
}

/**
 * Update a step
 */
export async function updateStep(
  siteId: string,
  stepId: string,
  input: UpdateStepInput
): Promise<ConfiguratorStep | null> {
  const existing = await getStepById(siteId, stepId);
  if (!existing) return null;

  const rows = await sql`
    UPDATE configurator_steps
    SET
      name = ${input.name ?? existing.name},
      description = ${input.description !== undefined ? input.description : existing.description},
      order_rank = ${input.order_rank ?? existing.order_rank},
      updated_at = now()
    WHERE id = ${stepId}
      AND site_id = ${siteId}
    RETURNING *
  `;

  return (rows[0] as ConfiguratorStep) || null;
}

/**
 * Delete a step
 */
export async function deleteStep(
  siteId: string,
  stepId: string
): Promise<boolean> {
  const existing = await getStepById(siteId, stepId);
  if (!existing) return false;

  await sql`
    DELETE FROM configurator_steps
    WHERE id = ${stepId}
      AND site_id = ${siteId}
  `;

  return true;
}

/**
 * Reorder steps
 */
export async function reorderSteps(
  siteId: string,
  orderedIds: string[]
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await sql`
      UPDATE configurator_steps
      SET order_rank = ${i}, updated_at = now()
      WHERE id = ${orderedIds[i]}
        AND site_id = ${siteId}
    `;
  }
}
