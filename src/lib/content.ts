import { neon } from "@neondatabase/serverless";
import type {
  Page,
  PageListItem,
  Solution,
  SolutionListItem,
  FilterCategory,
  NavigationLink,
  SiteParameters,
} from "@/types/content";

const sql = neon(process.env.DATABASE_URL!);

// =============================================================================
// Pages
// =============================================================================

/**
 * Get a page by its slug
 */
export async function getPageBySlug(slug: string): Promise<Page | null> {
  const rows = await sql`
    SELECT * FROM pages WHERE slug = ${slug}
  `;
  return (rows[0] as Page) || null;
}

/**
 * Get all pages (list view)
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
 * Get a solution by its slug (with filters)
 */
export async function getSolutionBySlug(slug: string): Promise<Solution | null> {
  const rows = await sql`
    SELECT s.*,
      COALESCE(
        json_agg(
          json_build_object('id', f.id, 'name', f.name, 'slug', f.slug)
        ) FILTER (WHERE f.id IS NOT NULL),
        '[]'
      ) as filters
    FROM solutions s
    LEFT JOIN solution_filters sf ON s.id = sf.solution_id
    LEFT JOIN filters f ON sf.filter_id = f.id
    WHERE s.slug = ${slug}
    GROUP BY s.id
  `;
  return (rows[0] as Solution) || null;
}

/**
 * Get all solutions (with filters)
 */
export async function getAllSolutions(): Promise<SolutionListItem[]> {
  const rows = await sql`
    SELECT
      s.id,
      s.name,
      s.subtitle,
      s.slug,
      s.header_image,
      s.order_rank,
      COALESCE(
        json_agg(
          json_build_object('id', f.id, 'name', f.name, 'slug', f.slug, 'category_id', f.category_id)
        ) FILTER (WHERE f.id IS NOT NULL),
        '[]'
      ) as filters
    FROM solutions s
    LEFT JOIN solution_filters sf ON s.id = sf.solution_id
    LEFT JOIN filters f ON sf.filter_id = f.id
    GROUP BY s.id
    ORDER BY s.order_rank
  `;
  return rows as SolutionListItem[];
}

// =============================================================================
// Filter Categories
// =============================================================================

/**
 * Get all filter categories with their filters
 */
export async function getFilterCategories(): Promise<FilterCategory[]> {
  const rows = await sql`
    SELECT fc.*,
      COALESCE(
        json_agg(
          json_build_object('id', f.id, 'name', f.name, 'slug', f.slug)
          ORDER BY f.name
        ) FILTER (WHERE f.id IS NOT NULL),
        '[]'
      ) as filters
    FROM filter_categories fc
    LEFT JOIN filters f ON fc.id = f.category_id
    GROUP BY fc.id
    ORDER BY fc.order_rank
  `;
  return rows as FilterCategory[];
}

// =============================================================================
// Navigation
// =============================================================================

/**
 * Get navigation links for a location (header or footer)
 */
export async function getNavigation(
  location: "header" | "footer"
): Promise<NavigationLink[]> {
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
    WHERE nl.location = ${location}
    GROUP BY nl.id
    ORDER BY nl.order_rank
  `;
  return rows as NavigationLink[];
}

// =============================================================================
// Site Parameters
// =============================================================================

/**
 * Get site parameters (singleton)
 */
export async function getSiteParameters(): Promise<SiteParameters | null> {
  const rows = await sql`
    SELECT * FROM site_parameters WHERE id = 1
  `;
  return (rows[0] as SiteParameters) || null;
}
