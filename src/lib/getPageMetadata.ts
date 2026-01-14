import { getPageBySlug } from "@/lib/content";
import type { Metadata } from "next";

// ============================================================================
// METADATA CONFIGURATION
// ============================================================================

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://assymo.be";
const SITE_NAME = "Assymo";
const DEFAULT_DESCRIPTION =
  "Assymo - Uw specialist in maatwerk interieur en buitenschrijnwerk";

// ============================================================================
// METADATA HELPERS
// ============================================================================

/**
 * Format a page title with consistent em dash separator
 */
export function formatTitle(title?: string | null): string {
  return title ? `${title} — ${SITE_NAME}` : SITE_NAME;
}

/**
 * Build complete metadata object with OpenGraph and Twitter cards
 */
export function buildMetadata({
  title,
  description,
  path = "",
  image,
  type = "website",
}: {
  title?: string | null;
  description?: string | null;
  path?: string;
  image?: string | null;
  type?: "website" | "article";
}): Metadata {
  const formattedTitle = formatTitle(title);
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const url = `${BASE_URL}${path}`;

  return {
    title: formattedTitle,
    description: metaDescription,
    openGraph: {
      title: formattedTitle,
      description: metaDescription,
      url,
      siteName: SITE_NAME,
      type,
      locale: "nl_BE",
      ...(image && {
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: title || SITE_NAME,
          },
        ],
      }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: formattedTitle,
      description: metaDescription,
      ...(image && { images: [image] }),
    },
    alternates: {
      canonical: url,
    },
  };
}

// ============================================================================
// PAGE-SPECIFIC METADATA FUNCTIONS
// ============================================================================

/**
 * Get metadata for a page by slug (fetches from database)
 */
export async function getPageMetadata(slug: string): Promise<Metadata> {
  const page = await getPageBySlug(slug);
  return buildMetadata({
    title: page?.title,
    path: `/${slug}`,
    image: (page?.header_image as any)?.url,
  });
}
