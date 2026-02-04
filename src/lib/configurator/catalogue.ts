import { neon } from "@neondatabase/serverless";
import { unstable_cache } from "next/cache";
import type {
  PriceCatalogueItem,
  CreatePriceCatalogueInput,
  UpdatePriceCatalogueInput,
} from "./types";

const sql = neon(process.env.DATABASE_URL!);

// Cache tags for on-demand revalidation
export const CATALOGUE_CACHE_TAG = "configurator-catalogue";

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
 * Get all catalogue items for a site (public, cached)
 */
async function _getCatalogueItemsForSite(
  siteSlug: string = DEFAULT_SITE_SLUG
): Promise<PriceCatalogueItem[]> {
  const siteId = await getSiteIdBySlug(siteSlug);
  if (!siteId) return [];

  const rows = await sql`
    SELECT *
    FROM configurator_price_catalogue
    WHERE site_id = ${siteId}
    ORDER BY category, name
  `;

  return rows as PriceCatalogueItem[];
}

export const getCatalogueItemsForSite = (siteSlug: string = DEFAULT_SITE_SLUG) =>
  unstable_cache(
    _getCatalogueItemsForSite,
    [`configurator-catalogue-${siteSlug}`],
    {
      tags: [CATALOGUE_CACHE_TAG],
      revalidate: 60,
    }
  )(siteSlug);

/**
 * Get a catalogue item by ID (public, cached)
 */
async function _getCatalogueItemById(
  itemId: string,
  siteSlug: string = DEFAULT_SITE_SLUG
): Promise<PriceCatalogueItem | null> {
  const siteId = await getSiteIdBySlug(siteSlug);
  if (!siteId) return null;

  const rows = await sql`
    SELECT *
    FROM configurator_price_catalogue
    WHERE id = ${itemId}
      AND site_id = ${siteId}
  `;

  return (rows[0] as PriceCatalogueItem) || null;
}

export const getCatalogueItemByIdCached = (
  itemId: string,
  siteSlug: string = DEFAULT_SITE_SLUG
) =>
  unstable_cache(
    _getCatalogueItemById,
    [`configurator-catalogue-item-${siteSlug}-${itemId}`],
    {
      tags: [CATALOGUE_CACHE_TAG],
      revalidate: 60,
    }
  )(itemId, siteSlug);

/**
 * Get all unique categories from catalogue items (public, cached)
 */
async function _getCatalogueCategories(
  siteSlug: string = DEFAULT_SITE_SLUG
): Promise<string[]> {
  const siteId = await getSiteIdBySlug(siteSlug);
  if (!siteId) return [];

  const rows = await sql`
    SELECT DISTINCT category
    FROM configurator_price_catalogue
    WHERE site_id = ${siteId}
    ORDER BY category
  `;

  return rows.map((row) => row.category as string);
}

export const getCatalogueCategories = (siteSlug: string = DEFAULT_SITE_SLUG) =>
  unstable_cache(
    _getCatalogueCategories,
    [`configurator-catalogue-categories-${siteSlug}`],
    {
      tags: [CATALOGUE_CACHE_TAG],
      revalidate: 60,
    }
  )(siteSlug);

// =============================================================================
// Admin Queries (no caching)
// =============================================================================

/**
 * Get all catalogue items for a site by site ID (admin)
 */
export async function getCatalogueItems(siteId: string): Promise<PriceCatalogueItem[]> {
  const rows = await sql`
    SELECT *
    FROM configurator_price_catalogue
    WHERE site_id = ${siteId}
    ORDER BY category, name
  `;

  return rows as PriceCatalogueItem[];
}

/**
 * Get a catalogue item by ID (admin)
 */
export async function getCatalogueItemById(
  siteId: string,
  itemId: string
): Promise<PriceCatalogueItem | null> {
  const rows = await sql`
    SELECT *
    FROM configurator_price_catalogue
    WHERE id = ${itemId}
      AND site_id = ${siteId}
  `;

  return (rows[0] as PriceCatalogueItem) || null;
}

/**
 * Get all unique categories (admin)
 */
export async function getCatalogueItemCategories(siteId: string): Promise<string[]> {
  const rows = await sql`
    SELECT DISTINCT category
    FROM configurator_price_catalogue
    WHERE site_id = ${siteId}
    ORDER BY category
  `;

  return rows.map((row) => row.category as string);
}

/**
 * Create a new catalogue item
 */
export async function createCatalogueItem(
  siteId: string,
  input: CreatePriceCatalogueInput
): Promise<PriceCatalogueItem> {
  const rows = await sql`
    INSERT INTO configurator_price_catalogue (
      site_id,
      name,
      category,
      image,
      price_min,
      price_max,
      unit
    ) VALUES (
      ${siteId},
      ${input.name},
      ${input.category},
      ${input.image ?? null},
      ${input.price_min},
      ${input.price_max},
      ${input.unit ?? null}
    )
    RETURNING *
  `;

  return rows[0] as PriceCatalogueItem;
}

/**
 * Update a catalogue item
 */
export async function updateCatalogueItem(
  siteId: string,
  itemId: string,
  input: UpdatePriceCatalogueInput
): Promise<PriceCatalogueItem | null> {
  const existing = await getCatalogueItemById(siteId, itemId);
  if (!existing) return null;

  const rows = await sql`
    UPDATE configurator_price_catalogue
    SET
      name = ${input.name ?? existing.name},
      category = ${input.category ?? existing.category},
      image = ${input.image !== undefined ? input.image : existing.image},
      price_min = ${input.price_min ?? existing.price_min},
      price_max = ${input.price_max ?? existing.price_max},
      unit = ${input.unit !== undefined ? input.unit : existing.unit},
      updated_at = now()
    WHERE id = ${itemId}
      AND site_id = ${siteId}
    RETURNING *
  `;

  return (rows[0] as PriceCatalogueItem) || null;
}

/**
 * Delete a catalogue item
 */
export async function deleteCatalogueItem(
  siteId: string,
  itemId: string
): Promise<boolean> {
  const existing = await getCatalogueItemById(siteId, itemId);
  if (!existing) return false;

  await sql`
    DELETE FROM configurator_price_catalogue
    WHERE id = ${itemId}
      AND site_id = ${siteId}
  `;

  return true;
}

/**
 * Get multiple catalogue items by IDs (for price calculation)
 */
export async function getCatalogueItemsByIds(
  siteId: string,
  itemIds: string[]
): Promise<Map<string, PriceCatalogueItem>> {
  if (itemIds.length === 0) return new Map();

  const rows = await sql`
    SELECT *
    FROM configurator_price_catalogue
    WHERE id = ANY(${itemIds})
      AND site_id = ${siteId}
  `;

  const map = new Map<string, PriceCatalogueItem>();
  for (const row of rows) {
    map.set(row.id as string, row as PriceCatalogueItem);
  }

  return map;
}
