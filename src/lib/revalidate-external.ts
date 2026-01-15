import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// External site configurations for cache revalidation
const EXTERNAL_SITES: Record<string, { url: string; secret: string | undefined }> = {
  vpg: {
    url: process.env.VPG_REVALIDATE_URL || "https://vpg.be/api/revalidate",
    secret: process.env.VPG_REVALIDATION_SECRET,
  },
};

/**
 * Get site slug from site ID
 */
async function getSiteSlug(siteId: string): Promise<string | null> {
  const rows = await sql`SELECT slug FROM sites WHERE id = ${siteId}`;
  return rows[0]?.slug || null;
}

/**
 * Revalidate cache for external sites
 * Call this after revalidating the local cache when content is saved
 *
 * @param siteId - The site ID of the content that was saved
 * @param tag - The cache tag to revalidate (e.g., "pages", "solutions")
 */
export async function revalidateExternalSite(
  siteId: string,
  tag: string
): Promise<void> {
  try {
    const siteSlug = await getSiteSlug(siteId);
    if (!siteSlug) return;

    // Check if this site has an external frontend
    const config = EXTERNAL_SITES[siteSlug];
    if (!config || !config.secret) return;

    // Call the external site's revalidation endpoint
    const response = await fetch(config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag, secret: config.secret }),
    });

    if (!response.ok) {
      console.error(
        `Failed to revalidate ${siteSlug} cache:`,
        await response.text()
      );
    }
  } catch (error) {
    // Don't throw - external revalidation failures shouldn't break admin operations
    console.error("External site revalidation failed:", error);
  }
}
