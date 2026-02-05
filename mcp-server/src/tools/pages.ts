import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sql } from "../db.js";
import { requireSiteContext } from "../context.js";

// Types
interface HeaderImage {
  url: string;
  alt?: string;
}

interface Page {
  id: string;
  site_id: string;
  title: string;
  slug: string | null;
  is_homepage: boolean;
  header_image: HeaderImage | null;
  sections: unknown[];
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

interface PageListItem {
  id: string;
  title: string;
  slug: string | null;
  is_homepage: boolean;
  updated_at: string;
}

// Zod schemas for validation
const headerImageSchema = z
  .object({
    url: z.string().url(),
    alt: z.string().optional(),
  })
  .nullable()
  .optional();

const sectionsSchema = z.array(z.record(z.unknown())).optional();

export function registerPageTools(server: McpServer): void {
  // Tool: list_pages
  server.tool(
    "list_pages",
    "List all pages for the current site. Returns id, title, slug, is_homepage, and updated_at for each page, sorted by title.",
    {},
    async () => {
      try {
        const siteId = requireSiteContext();

        const pages = (await sql`
          SELECT id, title, slug, is_homepage, updated_at
          FROM pages
          WHERE site_id = ${siteId}
          ORDER BY title
        `) as PageListItem[];

        if (pages.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No pages found for the current site.",
              },
            ],
          };
        }

        const pageList = pages
          .map((page) => {
            const homepage = page.is_homepage ? " [homepage]" : "";
            const slugDisplay = page.slug ? `/${page.slug}` : "/";
            return `- ${page.title} (${slugDisplay})${homepage}\n  ID: ${page.id}\n  Updated: ${page.updated_at}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `Pages for current site:\n\n${pageList}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error listing pages: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: get_page
  server.tool(
    "get_page",
    "Get a single page by ID. Returns the full page object including sections.",
    {
      id: z.string().describe("The UUID of the page to retrieve"),
    },
    async ({ id }) => {
      try {
        const siteId = requireSiteContext();

        const pages = (await sql`
          SELECT id, site_id, title, slug, is_homepage, header_image, sections,
                 meta_title, meta_description, created_at, updated_at
          FROM pages
          WHERE id = ${id} AND site_id = ${siteId}
        `) as Page[];

        if (pages.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Page with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const page = pages[0];

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(page, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error getting page: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: create_page
  server.tool(
    "create_page",
    "Create a new page. Requires title. Slug is required unless is_homepage is true. If is_homepage is true, the existing homepage will be unset.",
    {
      title: z.string().min(1).describe("The page title (required)"),
      slug: z
        .string()
        .nullable()
        .optional()
        .describe(
          "The page slug (required unless is_homepage is true). Must be unique per site."
        ),
      is_homepage: z
        .boolean()
        .optional()
        .describe(
          "Whether this is the homepage. Only one page per site can be the homepage."
        ),
      header_image: headerImageSchema.describe(
        "Header image object with url and optional alt text"
      ),
      sections: sectionsSchema.describe("Array of section objects"),
      meta_title: z.string().nullable().optional().describe("SEO meta title"),
      meta_description: z
        .string()
        .nullable()
        .optional()
        .describe("SEO meta description"),
    },
    async ({
      title,
      slug,
      is_homepage,
      header_image,
      sections,
      meta_title,
      meta_description,
    }) => {
      try {
        const siteId = requireSiteContext();
        const isHomepage = is_homepage ?? false;

        // Validate: slug is required unless is_homepage
        if (!isHomepage && !slug) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: slug is required unless is_homepage is true.",
              },
            ],
            isError: true,
          };
        }

        // Check slug uniqueness if provided
        if (slug) {
          const existing = await sql`
            SELECT id FROM pages WHERE site_id = ${siteId} AND slug = ${slug}
          `;
          if (existing.length > 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Error: A page with slug "${slug}" already exists in this site.`,
                },
              ],
              isError: true,
            };
          }
        }

        // If setting as homepage, unset existing homepage first
        if (isHomepage) {
          await sql`
            UPDATE pages SET is_homepage = false WHERE site_id = ${siteId} AND is_homepage = true
          `;
        }

        // Prepare JSONB values
        const headerImageJson = header_image ? JSON.stringify(header_image) : null;
        const sectionsJson = JSON.stringify(sections ?? []);

        // Insert the page
        const result = (await sql`
          INSERT INTO pages (site_id, title, slug, is_homepage, header_image, sections, meta_title, meta_description)
          VALUES (
            ${siteId},
            ${title},
            ${isHomepage ? null : slug},
            ${isHomepage},
            ${headerImageJson}::jsonb,
            ${sectionsJson}::jsonb,
            ${meta_title ?? null},
            ${meta_description ?? null}
          )
          RETURNING id, site_id, title, slug, is_homepage, header_image, sections,
                    meta_title, meta_description, created_at, updated_at
        `) as Page[];

        const page = result[0];

        return {
          content: [
            {
              type: "text" as const,
              text: `Page created successfully:\n\n${JSON.stringify(page, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error creating page: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: update_page
  server.tool(
    "update_page",
    "Update an existing page. Only provided fields will be updated. If is_homepage is set to true, the existing homepage will be unset.",
    {
      id: z.string().describe("The UUID of the page to update (required)"),
      title: z.string().min(1).optional().describe("The page title"),
      slug: z
        .string()
        .nullable()
        .optional()
        .describe("The page slug. Must be unique per site."),
      is_homepage: z
        .boolean()
        .optional()
        .describe(
          "Whether this is the homepage. Only one page per site can be the homepage."
        ),
      header_image: headerImageSchema.describe(
        "Header image object with url and optional alt text, or null to remove"
      ),
      sections: sectionsSchema.describe("Array of section objects"),
      meta_title: z.string().nullable().optional().describe("SEO meta title"),
      meta_description: z
        .string()
        .nullable()
        .optional()
        .describe("SEO meta description"),
    },
    async ({
      id,
      title,
      slug,
      is_homepage,
      header_image,
      sections,
      meta_title,
      meta_description,
    }) => {
      try {
        const siteId = requireSiteContext();

        // Verify page exists in current site
        const existingPages = (await sql`
          SELECT id, is_homepage FROM pages WHERE id = ${id} AND site_id = ${siteId}
        `) as { id: string; is_homepage: boolean }[];

        if (existingPages.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Page with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        // Check slug uniqueness if being updated
        if (slug !== undefined && slug !== null) {
          const slugConflict = await sql`
            SELECT id FROM pages
            WHERE site_id = ${siteId} AND slug = ${slug} AND id != ${id}
          `;
          if (slugConflict.length > 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Error: A page with slug "${slug}" already exists in this site.`,
                },
              ],
              isError: true,
            };
          }
        }

        // If setting as homepage, unset existing homepage first (excluding this page)
        if (is_homepage === true) {
          await sql`
            UPDATE pages
            SET is_homepage = false
            WHERE site_id = ${siteId} AND is_homepage = true AND id != ${id}
          `;
        }

        // Build dynamic update - we need to handle this carefully with Neon's tagged template
        // Since we can't build dynamic SQL easily, we'll update all fields
        const updatedTitle = title !== undefined ? title : null;
        const updatedSlug = slug !== undefined ? slug : undefined;
        const updatedIsHomepage = is_homepage !== undefined ? is_homepage : undefined;
        const updatedHeaderImage =
          header_image !== undefined ? JSON.stringify(header_image) : undefined;
        const updatedSections =
          sections !== undefined ? JSON.stringify(sections) : undefined;
        const updatedMetaTitle = meta_title !== undefined ? meta_title : undefined;
        const updatedMetaDescription =
          meta_description !== undefined ? meta_description : undefined;

        // Use COALESCE-like approach by fetching and updating
        const currentPage = (await sql`
          SELECT title, slug, is_homepage, header_image, sections, meta_title, meta_description
          FROM pages WHERE id = ${id}
        `) as Page[];

        const current = currentPage[0];

        const finalTitle = title !== undefined ? title : current.title;
        const finalSlug = slug !== undefined ? slug : current.slug;
        const finalIsHomepage =
          is_homepage !== undefined ? is_homepage : current.is_homepage;
        const finalHeaderImage =
          header_image !== undefined
            ? JSON.stringify(header_image)
            : JSON.stringify(current.header_image);
        const finalSections =
          sections !== undefined
            ? JSON.stringify(sections)
            : JSON.stringify(current.sections);
        const finalMetaTitle =
          meta_title !== undefined ? meta_title : current.meta_title;
        const finalMetaDescription =
          meta_description !== undefined
            ? meta_description
            : current.meta_description;

        const result = (await sql`
          UPDATE pages
          SET
            title = ${finalTitle},
            slug = ${finalSlug},
            is_homepage = ${finalIsHomepage},
            header_image = ${finalHeaderImage}::jsonb,
            sections = ${finalSections}::jsonb,
            meta_title = ${finalMetaTitle},
            meta_description = ${finalMetaDescription},
            updated_at = NOW()
          WHERE id = ${id} AND site_id = ${siteId}
          RETURNING id, site_id, title, slug, is_homepage, header_image, sections,
                    meta_title, meta_description, created_at, updated_at
        `) as Page[];

        const page = result[0];

        return {
          content: [
            {
              type: "text" as const,
              text: `Page updated successfully:\n\n${JSON.stringify(page, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error updating page: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: delete_page
  server.tool(
    "delete_page",
    "Delete a page by ID.",
    {
      id: z.string().describe("The UUID of the page to delete"),
    },
    async ({ id }) => {
      try {
        const siteId = requireSiteContext();

        // Verify page exists and get its title for the success message
        const existingPages = (await sql`
          SELECT id, title FROM pages WHERE id = ${id} AND site_id = ${siteId}
        `) as { id: string; title: string }[];

        if (existingPages.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Page with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const pageTitle = existingPages[0].title;

        await sql`
          DELETE FROM pages WHERE id = ${id} AND site_id = ${siteId}
        `;

        return {
          content: [
            {
              type: "text" as const,
              text: `Page "${pageTitle}" (ID: ${id}) has been deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error deleting page: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
