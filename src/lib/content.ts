import { sql } from "@/lib/db";
import { unstable_cache } from "next/cache";
import type {
  Page,
  PageListItem,
  Solution,
  SolutionListItem,
  FilterCategory,
  NavigationLink,
  SiteParameters,
} from "@/types/content";

// Cache tags for on-demand revalidation
export const CACHE_TAGS = {
  pages: "pages",
  solutions: "solutions",
  filters: "filters",
  navigation: "navigation",
  siteParameters: "site-parameters",
} as const;

// Default site slug (used when no site is specified)
const DEFAULT_SITE_SLUG = "assymo";

/**
 * Get site ID from slug (cached)
 */
async function _getSiteIdBySlug(slug: string): Promise<string | null> {
  const rows = await sql`SELECT id FROM sites WHERE slug = ${slug}`;
  return rows[0]?.id || null;
}

const getSiteIdBySlug = (slug: string) =>
  unstable_cache(_getSiteIdBySlug, [`site-id-${slug}`], {
    revalidate: 86400, // 24 hours - sites rarely change
  })(slug);

// =============================================================================
// Pages
// =============================================================================

/**
 * Get a page by its slug (with image alt text from media library)
 * @param slug - Page slug
 * @param siteSlug - Site slug (defaults to "assymo")
 */
async function _getPageBySlug(slug: string, siteSlug: string = DEFAULT_SITE_SLUG): Promise<Page | null> {
  const siteId = await getSiteIdBySlug(siteSlug);
  if (!siteId) return null;

  const rows = await sql`
    SELECT p.*, im.alt_text as header_image_alt
    FROM pages p
    LEFT JOIN image_metadata im ON im.url = p.header_image->>'url'
    WHERE p.slug = ${slug} AND p.site_id = ${siteId}
  `;

  if (!rows[0]) return null;

  // Merge alt text into header_image
  const page = rows[0] as Page & { header_image_alt?: string };
  if (page.header_image && page.header_image_alt) {
    page.header_image.alt = page.header_image_alt;
  }
  delete page.header_image_alt;

  // Enrich sections with alt text
  if (page.sections && Array.isArray(page.sections)) {
    page.sections = await enrichSectionsWithAltText(page.sections);
  }

  return page as Page;
}

export const getPageBySlug = (slug: string, siteSlug: string = DEFAULT_SITE_SLUG) =>
  unstable_cache(_getPageBySlug, [`page-${siteSlug}-${slug}`], {
    tags: [CACHE_TAGS.pages],
    revalidate: false, // Only revalidate via revalidateTag() when admin publishes
  })(slug, siteSlug);

/**
 * Get the homepage (with image alt text from media library)
 * @param siteSlug - Site slug (defaults to "assymo")
 */
async function _getHomepage(siteSlug: string = DEFAULT_SITE_SLUG): Promise<Page | null> {
  const siteId = await getSiteIdBySlug(siteSlug);
  if (!siteId) return null;

  const rows = await sql`
    SELECT p.*, im.alt_text as header_image_alt
    FROM pages p
    LEFT JOIN image_metadata im ON im.url = p.header_image->>'url'
    WHERE p.is_homepage = true AND p.site_id = ${siteId}
    LIMIT 1
  `;

  if (!rows[0]) return null;

  // Merge alt text into header_image
  const page = rows[0] as Page & { header_image_alt?: string };
  if (page.header_image && page.header_image_alt) {
    page.header_image.alt = page.header_image_alt;
  }
  delete page.header_image_alt;

  // Enrich sections with alt text
  if (page.sections && Array.isArray(page.sections)) {
    page.sections = await enrichSectionsWithAltText(page.sections);
  }

  return page as Page;
}

export const getHomepage = (siteSlug: string = DEFAULT_SITE_SLUG) =>
  unstable_cache(_getHomepage, [`homepage-${siteSlug}`], {
    tags: [CACHE_TAGS.pages],
    revalidate: false, // Only revalidate via revalidateTag() when admin publishes
  })(siteSlug);

/**
 * Get all pages (list view) - used by admin, not cached
 */
export async function getAllPages(): Promise<PageListItem[]> {
  const rows = await sql`
    SELECT id, title, slug, updated_at
    FROM pages
    ORDER BY title
  `;
  return rows as PageListItem[];
}

// =============================================================================
// Solutions
// =============================================================================

/**
 * Get a solution by its slug (with filters and image alt text from media library)
 * @param slug - Solution slug
 * @param siteSlug - Site slug (defaults to "assymo")
 */
async function _getSolutionBySlug(slug: string, siteSlug: string = DEFAULT_SITE_SLUG): Promise<Solution | null> {
  const siteId = await getSiteIdBySlug(siteSlug);
  if (!siteId) return null;

  const rows = await sql`
    SELECT s.*,
      im.alt_text as header_image_alt,
      cc.slug as configurator_category_slug,
      COALESCE(
        json_agg(
          json_build_object('id', f.id, 'name', f.name, 'slug', f.slug)
        ) FILTER (WHERE f.id IS NOT NULL),
        '[]'
      ) as filters
    FROM solutions s
    LEFT JOIN solution_filters sf ON s.id = sf.solution_id
    LEFT JOIN filters f ON sf.filter_id = f.id
    LEFT JOIN image_metadata im ON im.url = s.header_image->>'url'
    LEFT JOIN configurator_categories cc ON s.configurator_category_id = cc.id
    WHERE s.slug = ${slug} AND s.site_id = ${siteId}
    GROUP BY s.id, im.alt_text, cc.slug
  `;

  if (!rows[0]) return null;

  // Merge alt text into header_image
  const solution = rows[0] as Solution & { header_image_alt?: string };
  if (solution.header_image && solution.header_image_alt) {
    solution.header_image.alt = solution.header_image_alt;
  }
  delete solution.header_image_alt;

  // Enrich sections with alt text
  if (solution.sections && Array.isArray(solution.sections)) {
    solution.sections = await enrichSectionsWithAltText(solution.sections);
  }

  return solution as Solution;
}

export const getSolutionBySlug = (slug: string, siteSlug: string = DEFAULT_SITE_SLUG) =>
  unstable_cache(_getSolutionBySlug, [`solution-${siteSlug}-${slug}`], {
    tags: [CACHE_TAGS.solutions],
    revalidate: false, // Only revalidate via revalidateTag() when admin publishes
  })(slug, siteSlug);

/**
 * Get all solutions (with filters and image alt text from media library)
 * @param siteSlug - Site slug (defaults to "assymo")
 */
async function _getAllSolutions(siteSlug: string = DEFAULT_SITE_SLUG): Promise<SolutionListItem[]> {
  const siteId = await getSiteIdBySlug(siteSlug);
  if (!siteId) return [];

  const rows = await sql`
    SELECT
      s.id,
      s.name,
      s.subtitle,
      s.slug,
      s.header_image,
      s.order_rank,
      im.alt_text as header_image_alt,
      COALESCE(
        json_agg(
          json_build_object('id', f.id, 'name', f.name, 'slug', f.slug, 'category_id', f.category_id)
        ) FILTER (WHERE f.id IS NOT NULL),
        '[]'
      ) as filters
    FROM solutions s
    LEFT JOIN solution_filters sf ON s.id = sf.solution_id
    LEFT JOIN filters f ON sf.filter_id = f.id
    LEFT JOIN image_metadata im ON im.url = s.header_image->>'url'
    WHERE s.site_id = ${siteId}
    GROUP BY s.id, im.alt_text
    ORDER BY s.order_rank
  `;

  // Merge alt text into header_image
  return rows.map((row) => {
    const solution = row as SolutionListItem & { header_image_alt?: string };
    if (solution.header_image && solution.header_image_alt) {
      solution.header_image.alt = solution.header_image_alt;
    }
    delete solution.header_image_alt;
    return solution as SolutionListItem;
  });
}

export const getAllSolutions = (siteSlug: string = DEFAULT_SITE_SLUG) =>
  unstable_cache(_getAllSolutions, [`all-solutions-${siteSlug}`], {
    tags: [CACHE_TAGS.solutions],
    revalidate: false, // Only revalidate via revalidateTag() when admin publishes
  })(siteSlug);

// =============================================================================
// Filter Categories
// =============================================================================

/**
 * Get all filter categories with their filters
 * @param siteSlug - Site slug (defaults to "assymo")
 */
async function _getFilterCategories(siteSlug: string = DEFAULT_SITE_SLUG): Promise<FilterCategory[]> {
  const siteId = await getSiteIdBySlug(siteSlug);
  if (!siteId) return [];

  const rows = await sql`
    SELECT fc.*,
      COALESCE(
        json_agg(
          json_build_object('id', f.id, 'name', f.name, 'slug', f.slug)
          ORDER BY f.order_rank
        ) FILTER (WHERE f.id IS NOT NULL),
        '[]'
      ) as filters
    FROM filter_categories fc
    LEFT JOIN filters f ON fc.id = f.category_id
    WHERE fc.site_id = ${siteId}
    GROUP BY fc.id
    ORDER BY fc.order_rank
  `;
  return rows as FilterCategory[];
}

export const getFilterCategories = (siteSlug: string = DEFAULT_SITE_SLUG) =>
  unstable_cache(_getFilterCategories, [`filter-categories-${siteSlug}`], {
    tags: [CACHE_TAGS.filters],
    revalidate: false, // Only revalidate via revalidateTag() when admin publishes
  })(siteSlug);

// =============================================================================
// Navigation
// =============================================================================

/**
 * Get navigation links for a location (header or footer)
 * Includes alt text for solution header images from media library
 * @param location - "header" or "footer"
 * @param siteSlug - Site slug (defaults to "assymo")
 */
async function _getNavigation(
  location: "header" | "footer",
  siteSlug: string = DEFAULT_SITE_SLUG
): Promise<NavigationLink[]> {
  const siteId = await getSiteIdBySlug(siteSlug);
  if (!siteId) return [];

  const rows = await sql`
    SELECT nl.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', ns.id,
            'solution', CASE
              WHEN s.id IS NOT NULL THEN json_build_object(
                'name', s.name,
                'slug', s.slug,
                'header_image', s.header_image
              )
              ELSE NULL
            END
          ) ORDER BY ns.order_rank
        ) FILTER (WHERE ns.id IS NOT NULL),
        '[]'
      ) as sub_items
    FROM navigation_links nl
    LEFT JOIN navigation_subitems ns ON nl.id = ns.link_id
    LEFT JOIN solutions s ON ns.solution_id = s.id
    WHERE nl.location = ${location} AND nl.site_id = ${siteId}
    GROUP BY nl.id
    ORDER BY nl.order_rank
  `;

  const navLinks = rows as NavigationLink[];

  // Collect all solution header image URLs
  const imageUrls: string[] = [];
  for (const link of navLinks) {
    if (link.sub_items) {
      for (const subItem of link.sub_items) {
        if (subItem.solution?.header_image?.url) {
          imageUrls.push(subItem.solution.header_image.url);
        }
      }
    }
  }

  if (imageUrls.length === 0) return navLinks;

  // Batch fetch alt texts
  const altTextRows = await sql`
    SELECT url, alt_text FROM image_metadata WHERE url = ANY(${imageUrls})
  ` as { url: string; alt_text: string | null }[];

  const altTextMap = new Map(
    altTextRows.filter(r => r.alt_text).map(r => [r.url, r.alt_text!])
  );

  // Merge alt texts into navigation
  for (const link of navLinks) {
    if (link.sub_items) {
      for (const subItem of link.sub_items) {
        if (subItem.solution?.header_image?.url) {
          const alt = altTextMap.get(subItem.solution.header_image.url);
          if (alt) {
            subItem.solution.header_image.alt = alt;
          }
        }
      }
    }
  }

  return navLinks;
}

export const getNavigation = (location: "header" | "footer", siteSlug: string = DEFAULT_SITE_SLUG) =>
  unstable_cache(_getNavigation, [`navigation-${siteSlug}-${location}`], {
    tags: [CACHE_TAGS.navigation],
    revalidate: false, // Only revalidate via revalidateTag() when admin publishes
  })(location, siteSlug);

// =============================================================================
// Site Parameters
// =============================================================================

/**
 * Get site parameters for a site
 * @param siteSlug - Site slug (defaults to "assymo")
 */
async function _getSiteParameters(siteSlug: string = DEFAULT_SITE_SLUG): Promise<SiteParameters | null> {
  const siteId = await getSiteIdBySlug(siteSlug);
  if (!siteId) return null;

  const rows = await sql`
    SELECT * FROM site_parameters WHERE site_id = ${siteId}
  `;
  return (rows[0] as SiteParameters) || null;
}

export const getSiteParameters = (siteSlug: string = DEFAULT_SITE_SLUG) =>
  unstable_cache(_getSiteParameters, [`site-parameters-${siteSlug}`], {
    tags: [CACHE_TAGS.siteParameters],
    revalidate: false, // Only revalidate via revalidateTag() when admin publishes
  })(siteSlug);

// =============================================================================
// Images
// =============================================================================

interface ImageMetadataRow {
  url: string;
  alt_text: string | null;
}

/**
 * Get alt text for an image from the database
 * @param url - The Vercel Blob URL
 * @returns The alt text or null if not set
 */
export async function getImageAltText(url: string): Promise<string | null> {
  try {
    const rows = await sql`
      SELECT alt_text FROM image_metadata WHERE url = ${url}
    ` as ImageMetadataRow[];
    return rows[0]?.alt_text || null;
  } catch {
    return null;
  }
}

/**
 * Batch fetch alt text for multiple image URLs
 * @param urls - Array of image URLs
 * @returns Map of URL to alt text
 */
async function getImageAltTexts(urls: string[]): Promise<Map<string, string>> {
  if (urls.length === 0) return new Map();

  try {
    const rows = await sql`
      SELECT url, alt_text FROM image_metadata WHERE url = ANY(${urls})
    ` as ImageMetadataRow[];

    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.alt_text) {
        map.set(row.url, row.alt_text);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Extract all image URLs from sections
 */
function extractImageUrlsFromSections(sections: unknown[]): string[] {
  const urls: string[] = [];

  for (const section of sections) {
    if (!section || typeof section !== "object") continue;
    const s = section as Record<string, unknown>;

    // Slideshow images
    if (s._type === "slideshow" && Array.isArray(s.images)) {
      for (const item of s.images) {
        if (item?.image?.url) urls.push(item.image.url);
      }
    }

    // Split section items
    if (s._type === "splitSection" && Array.isArray(s.items)) {
      for (const item of s.items) {
        if (item?.image?.url) urls.push(item.image.url);
      }
    }

    // Flexible section blocks
    if (s._type === "flexibleSection") {
      const blocks = [
        ...(Array.isArray(s.blockMain) ? s.blockMain : []),
        ...(Array.isArray(s.blockLeft) ? s.blockLeft : []),
        ...(Array.isArray(s.blockRight) ? s.blockRight : []),
      ];
      for (const block of blocks) {
        if (block?._type === "flexImageBlock" && block?.image?.url) {
          urls.push(block.image.url);
        }
      }
    }
  }

  return urls;
}

/**
 * Enrich sections with alt text from the media library
 * @param sections - Array of sections
 * @returns Sections with alt text filled in from media library
 */
export async function enrichSectionsWithAltText<T>(sections: T[]): Promise<T[]> {
  if (!sections || sections.length === 0) return sections;

  // Extract all image URLs
  const urls = extractImageUrlsFromSections(sections as unknown[]);
  if (urls.length === 0) return sections;

  // Batch fetch alt texts
  const altTexts = await getImageAltTexts(urls);
  if (altTexts.size === 0) return sections;

  // Deep clone and update sections
  const enriched = JSON.parse(JSON.stringify(sections)) as Record<string, unknown>[];

  for (const section of enriched) {
    if (!section || typeof section !== "object") continue;

    // Slideshow images
    if (section._type === "slideshow" && Array.isArray(section.images)) {
      for (const item of section.images) {
        if (item?.image?.url && altTexts.has(item.image.url)) {
          item.image.alt = altTexts.get(item.image.url);
        }
      }
    }

    // Split section items
    if (section._type === "splitSection" && Array.isArray(section.items)) {
      for (const item of section.items) {
        if (item?.image?.url && altTexts.has(item.image.url)) {
          item.image.alt = altTexts.get(item.image.url);
        }
      }
    }

    // Flexible section blocks
    if (section._type === "flexibleSection") {
      const blockArrays = ["blockMain", "blockLeft", "blockRight"];
      for (const blockArrayName of blockArrays) {
        const blocks = section[blockArrayName];
        if (Array.isArray(blocks)) {
          for (const block of blocks) {
            if (block?._type === "flexImageBlock" && block?.image?.url && altTexts.has(block.image.url)) {
              block.image.alt = altTexts.get(block.image.url);
            }
          }
        }
      }
    }
  }

  return enriched as T[];
}
