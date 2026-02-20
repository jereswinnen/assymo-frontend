import { sql } from "@/lib/db";
import { unstable_cache } from "next/cache";

// =============================================================================
// Types
// =============================================================================

export interface ConfiguratorCategory {
  id: string;
  name: string;
  slug: string;
  order_rank: number;
  site_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  order_rank?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  order_rank?: number;
}

// Cache tags for on-demand revalidation
export const CATEGORIES_CACHE_TAG = "configurator-categories";

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
 * Get all categories for a site (public, cached)
 */
async function _getCategoriesForSite(
  siteSlug: string = DEFAULT_SITE_SLUG
): Promise<ConfiguratorCategory[]> {
  const siteId = await getSiteIdBySlug(siteSlug);
  if (!siteId) return [];

  const rows = await sql`
    SELECT *
    FROM configurator_categories
    WHERE site_id = ${siteId}
    ORDER BY order_rank, name
  `;

  return rows as ConfiguratorCategory[];
}

export const getCategoriesForSite = (siteSlug: string = DEFAULT_SITE_SLUG) =>
  unstable_cache(
    _getCategoriesForSite,
    [`configurator-categories-${siteSlug}`],
    {
      tags: [CATEGORIES_CACHE_TAG],
      revalidate: false, // Only revalidate via revalidateTag() when admin publishes
    }
  )(siteSlug);

/**
 * Get a category by slug (public, cached)
 */
async function _getCategoryBySlug(
  slug: string,
  siteSlug: string = DEFAULT_SITE_SLUG
): Promise<ConfiguratorCategory | null> {
  const siteId = await getSiteIdBySlug(siteSlug);
  if (!siteId) return null;

  const rows = await sql`
    SELECT *
    FROM configurator_categories
    WHERE site_id = ${siteId}
      AND slug = ${slug}
  `;

  return (rows[0] as ConfiguratorCategory) || null;
}

export const getCategoryBySlug = (
  slug: string,
  siteSlug: string = DEFAULT_SITE_SLUG
) =>
  unstable_cache(
    _getCategoryBySlug,
    [`configurator-category-slug-${siteSlug}-${slug}`],
    {
      tags: [CATEGORIES_CACHE_TAG],
      revalidate: false, // Only revalidate via revalidateTag() when admin publishes
    }
  )(slug, siteSlug);

// =============================================================================
// Admin Queries (no caching)
// =============================================================================

/**
 * Get all categories for a site by site ID (admin)
 */
export async function getCategories(siteId: string): Promise<ConfiguratorCategory[]> {
  const rows = await sql`
    SELECT *
    FROM configurator_categories
    WHERE site_id = ${siteId}
    ORDER BY order_rank, name
  `;

  return rows as ConfiguratorCategory[];
}

/**
 * Get a category by ID (admin)
 */
export async function getCategoryById(
  siteId: string,
  categoryId: string
): Promise<ConfiguratorCategory | null> {
  const rows = await sql`
    SELECT *
    FROM configurator_categories
    WHERE id = ${categoryId}
      AND site_id = ${siteId}
  `;

  return (rows[0] as ConfiguratorCategory) || null;
}

/**
 * Create a new category
 */
export async function createCategory(
  siteId: string,
  input: CreateCategoryInput
): Promise<ConfiguratorCategory> {
  // Get max order_rank if not specified
  let orderRank = input.order_rank;
  if (orderRank === undefined) {
    const maxResult = await sql`
      SELECT COALESCE(MAX(order_rank), 0) + 1 as next_rank
      FROM configurator_categories
      WHERE site_id = ${siteId}
    `;
    orderRank = maxResult[0]?.next_rank || 1;
  }

  const rows = await sql`
    INSERT INTO configurator_categories (
      name,
      slug,
      order_rank,
      site_id
    ) VALUES (
      ${input.name},
      ${input.slug},
      ${orderRank},
      ${siteId}
    )
    RETURNING *
  `;

  return rows[0] as ConfiguratorCategory;
}

/**
 * Update a category
 */
export async function updateCategory(
  siteId: string,
  categoryId: string,
  input: UpdateCategoryInput
): Promise<ConfiguratorCategory | null> {
  const existing = await getCategoryById(siteId, categoryId);
  if (!existing) return null;

  const rows = await sql`
    UPDATE configurator_categories
    SET
      name = ${input.name ?? existing.name},
      slug = ${input.slug ?? existing.slug},
      order_rank = ${input.order_rank ?? existing.order_rank},
      updated_at = now()
    WHERE id = ${categoryId}
      AND site_id = ${siteId}
    RETURNING *
  `;

  return (rows[0] as ConfiguratorCategory) || null;
}

/**
 * Delete a category
 */
export async function deleteCategory(
  siteId: string,
  categoryId: string
): Promise<boolean> {
  // Check if exists first
  const existing = await getCategoryById(siteId, categoryId);
  if (!existing) return false;

  await sql`
    DELETE FROM configurator_categories
    WHERE id = ${categoryId}
      AND site_id = ${siteId}
  `;

  return true;
}

/**
 * Reorder categories
 */
export async function reorderCategories(
  siteId: string,
  orderedIds: string[]
): Promise<void> {
  // Update each category's order_rank based on position in array
  for (let i = 0; i < orderedIds.length; i++) {
    await sql`
      UPDATE configurator_categories
      SET order_rank = ${i}, updated_at = now()
      WHERE id = ${orderedIds[i]}
        AND site_id = ${siteId}
    `;
  }
}
