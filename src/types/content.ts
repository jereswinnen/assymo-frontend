/**
 * CMS Content types
 */

// =============================================================================
// Shared Types
// =============================================================================

/**
 * Image stored in Vercel Blob
 */
export interface ContentImage {
  url: string;
  alt?: string;
}

/**
 * Section in a page or solution (stored as JSONB)
 */
export interface Section {
  _key: string;
  _type: string;
  [key: string]: unknown;
}

// =============================================================================
// Pages
// =============================================================================

export interface Page {
  id: string;
  title: string;
  slug: string;
  header_image: ContentImage | null;
  sections: Section[];
  meta_title: string | null;
  meta_description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PageListItem {
  id: string;
  title: string;
  slug: string;
  updated_at: Date;
}

// =============================================================================
// Solutions (Realisaties)
// =============================================================================

export interface Solution {
  id: string;
  name: string;
  subtitle: string | null;
  slug: string;
  header_image: ContentImage | null;
  sections: Section[];
  order_rank: number;
  filters: Filter[];
  meta_title: string | null;
  meta_description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SolutionListItem {
  id: string;
  name: string;
  subtitle: string | null;
  slug: string;
  header_image: ContentImage | null;
  order_rank: number;
  filters: Filter[];
}

// =============================================================================
// Filters
// =============================================================================

export interface Filter {
  id: string;
  name: string;
  slug: string;
  category_id?: string;
}

export interface FilterCategory {
  id: string;
  name: string;
  slug: string;
  order_rank: number;
  filters: Filter[];
}

// =============================================================================
// Navigation
// =============================================================================

export interface NavigationSubItem {
  id: string;
  solution: {
    name: string;
    slug: string;
    header_image: ContentImage | null;
  } | null;
}

export interface NavigationLink {
  id: string;
  location: "header" | "footer";
  title: string;
  slug: string;
  submenu_heading: string | null;
  order_rank: number;
  sub_items: NavigationSubItem[];
}

// =============================================================================
// Site Parameters
// =============================================================================

export interface SiteParameters {
  id: number;
  address: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  vat_number: string | null;
  updated_at: Date;
}
