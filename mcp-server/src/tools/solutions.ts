import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sql } from "../db.js";
import { requireSiteContext } from "../context.js";

// Types
interface HeaderImage {
  url: string;
  alt?: string;
}

interface Solution {
  id: string;
  site_id: string;
  name: string;
  subtitle: string | null;
  slug: string;
  header_image: HeaderImage | null;
  sections: unknown[];
  order_rank: number;
  configurator_category_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

interface SolutionListItem {
  id: string;
  name: string;
  subtitle: string | null;
  slug: string;
  order_rank: number;
  updated_at: string;
}

interface SolutionWithFilters extends Solution {
  filter_ids: string[];
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

export function registerSolutionTools(server: McpServer): void {
  // Tool: list_solutions
  server.tool(
    "list_solutions",
    "List all solutions for the current site. Returns id, name, subtitle, slug, order_rank, and updated_at for each solution, sorted by order_rank.",
    {},
    async () => {
      try {
        const siteId = requireSiteContext();

        const solutions = (await sql`
          SELECT id, name, subtitle, slug, order_rank, updated_at
          FROM solutions
          WHERE site_id = ${siteId}
          ORDER BY order_rank
        `) as SolutionListItem[];

        if (solutions.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No solutions found for the current site.",
              },
            ],
          };
        }

        const solutionList = solutions
          .map((solution) => {
            const subtitleDisplay = solution.subtitle
              ? ` - ${solution.subtitle}`
              : "";
            return `- ${solution.name}${subtitleDisplay} (/${solution.slug})\n  ID: ${solution.id}\n  Order: ${solution.order_rank}\n  Updated: ${solution.updated_at}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `Solutions for current site:\n\n${solutionList}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error listing solutions: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: get_solution
  server.tool(
    "get_solution",
    "Get a single solution by ID. Returns the full solution object including sections and associated filter IDs.",
    {
      id: z.string().describe("The UUID of the solution to retrieve"),
    },
    async ({ id }) => {
      try {
        const siteId = requireSiteContext();

        const solutions = (await sql`
          SELECT id, site_id, name, subtitle, slug, header_image, sections,
                 order_rank, configurator_category_id, meta_title, meta_description,
                 created_at, updated_at
          FROM solutions
          WHERE id = ${id} AND site_id = ${siteId}
        `) as Solution[];

        if (solutions.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Solution with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const solution = solutions[0];

        // Get associated filter IDs
        const filterAssociations = (await sql`
          SELECT filter_id FROM solution_filters WHERE solution_id = ${id}
        `) as { filter_id: string }[];

        const solutionWithFilters: SolutionWithFilters = {
          ...solution,
          filter_ids: filterAssociations.map((f) => f.filter_id),
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(solutionWithFilters, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error getting solution: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: create_solution
  server.tool(
    "create_solution",
    "Create a new solution. Requires name and slug.",
    {
      name: z.string().min(1).describe("The solution name (required)"),
      slug: z
        .string()
        .min(1)
        .describe("The solution slug (required). Must be unique per site."),
      subtitle: z.string().nullable().optional().describe("Solution subtitle"),
      header_image: headerImageSchema.describe(
        "Header image object with url and optional alt text"
      ),
      sections: sectionsSchema.describe("Array of section objects"),
      order_rank: z
        .number()
        .int()
        .optional()
        .describe("Order rank for sorting. Defaults to max + 1."),
      filters: z
        .array(z.string())
        .optional()
        .describe("Array of filter IDs to associate with the solution"),
      configurator_category_id: z
        .string()
        .nullable()
        .optional()
        .describe("UUID of the configurator category"),
      meta_title: z.string().nullable().optional().describe("SEO meta title"),
      meta_description: z
        .string()
        .nullable()
        .optional()
        .describe("SEO meta description"),
    },
    async ({
      name,
      slug,
      subtitle,
      header_image,
      sections,
      order_rank,
      filters,
      configurator_category_id,
      meta_title,
      meta_description,
    }) => {
      try {
        const siteId = requireSiteContext();

        // Check slug uniqueness
        const existing = await sql`
          SELECT id FROM solutions WHERE site_id = ${siteId} AND slug = ${slug}
        `;
        if (existing.length > 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: A solution with slug "${slug}" already exists in this site.`,
              },
            ],
            isError: true,
          };
        }

        // Determine order_rank if not provided
        let finalOrderRank = order_rank;
        if (finalOrderRank === undefined) {
          const maxRankResult = (await sql`
            SELECT COALESCE(MAX(order_rank), 0) + 1 as next_rank
            FROM solutions
            WHERE site_id = ${siteId}
          `) as { next_rank: number }[];
          finalOrderRank = maxRankResult[0].next_rank;
        }

        // Prepare JSONB values
        const headerImageJson = header_image ? JSON.stringify(header_image) : null;
        const sectionsJson = JSON.stringify(sections ?? []);

        // Insert the solution
        const result = (await sql`
          INSERT INTO solutions (
            site_id, name, subtitle, slug, header_image, sections,
            order_rank, configurator_category_id, meta_title, meta_description
          )
          VALUES (
            ${siteId},
            ${name},
            ${subtitle ?? null},
            ${slug},
            ${headerImageJson}::jsonb,
            ${sectionsJson}::jsonb,
            ${finalOrderRank},
            ${configurator_category_id ?? null},
            ${meta_title ?? null},
            ${meta_description ?? null}
          )
          RETURNING id, site_id, name, subtitle, slug, header_image, sections,
                    order_rank, configurator_category_id, meta_title, meta_description,
                    created_at, updated_at
        `) as Solution[];

        const solution = result[0];

        // Insert filter associations if provided
        if (filters && filters.length > 0) {
          for (const filterId of filters) {
            await sql`
              INSERT INTO solution_filters (solution_id, filter_id)
              VALUES (${solution.id}, ${filterId})
            `;
          }
        }

        // Return solution with filter IDs
        const solutionWithFilters: SolutionWithFilters = {
          ...solution,
          filter_ids: filters ?? [],
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Solution created successfully:\n\n${JSON.stringify(solutionWithFilters, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error creating solution: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: update_solution
  server.tool(
    "update_solution",
    "Update an existing solution. Only provided fields will be updated.",
    {
      id: z.string().describe("The UUID of the solution to update (required)"),
      name: z.string().min(1).optional().describe("The solution name"),
      slug: z
        .string()
        .min(1)
        .optional()
        .describe("The solution slug. Must be unique per site."),
      subtitle: z.string().nullable().optional().describe("Solution subtitle"),
      header_image: headerImageSchema.describe(
        "Header image object with url and optional alt text, or null to remove"
      ),
      sections: sectionsSchema.describe("Array of section objects"),
      order_rank: z.number().int().optional().describe("Order rank for sorting"),
      filters: z
        .array(z.string())
        .optional()
        .describe(
          "Array of filter IDs to associate with the solution. If provided, replaces all existing associations."
        ),
      configurator_category_id: z
        .string()
        .nullable()
        .optional()
        .describe("UUID of the configurator category"),
      meta_title: z.string().nullable().optional().describe("SEO meta title"),
      meta_description: z
        .string()
        .nullable()
        .optional()
        .describe("SEO meta description"),
    },
    async ({
      id,
      name,
      slug,
      subtitle,
      header_image,
      sections,
      order_rank,
      filters,
      configurator_category_id,
      meta_title,
      meta_description,
    }) => {
      try {
        const siteId = requireSiteContext();

        // Verify solution exists in current site
        const existingSolutions = (await sql`
          SELECT id FROM solutions WHERE id = ${id} AND site_id = ${siteId}
        `) as { id: string }[];

        if (existingSolutions.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Solution with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        // Check slug uniqueness if being updated
        if (slug !== undefined) {
          const slugConflict = await sql`
            SELECT id FROM solutions
            WHERE site_id = ${siteId} AND slug = ${slug} AND id != ${id}
          `;
          if (slugConflict.length > 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Error: A solution with slug "${slug}" already exists in this site.`,
                },
              ],
              isError: true,
            };
          }
        }

        // Fetch current solution to merge values
        const currentSolution = (await sql`
          SELECT name, subtitle, slug, header_image, sections, order_rank,
                 configurator_category_id, meta_title, meta_description
          FROM solutions WHERE id = ${id}
        `) as Solution[];

        const current = currentSolution[0];

        const finalName = name !== undefined ? name : current.name;
        const finalSubtitle = subtitle !== undefined ? subtitle : current.subtitle;
        const finalSlug = slug !== undefined ? slug : current.slug;
        const finalHeaderImage =
          header_image !== undefined
            ? JSON.stringify(header_image)
            : JSON.stringify(current.header_image);
        const finalSections =
          sections !== undefined
            ? JSON.stringify(sections)
            : JSON.stringify(current.sections);
        const finalOrderRank =
          order_rank !== undefined ? order_rank : current.order_rank;
        const finalConfiguratorCategoryId =
          configurator_category_id !== undefined
            ? configurator_category_id
            : current.configurator_category_id;
        const finalMetaTitle =
          meta_title !== undefined ? meta_title : current.meta_title;
        const finalMetaDescription =
          meta_description !== undefined
            ? meta_description
            : current.meta_description;

        const result = (await sql`
          UPDATE solutions
          SET
            name = ${finalName},
            subtitle = ${finalSubtitle},
            slug = ${finalSlug},
            header_image = ${finalHeaderImage}::jsonb,
            sections = ${finalSections}::jsonb,
            order_rank = ${finalOrderRank},
            configurator_category_id = ${finalConfiguratorCategoryId},
            meta_title = ${finalMetaTitle},
            meta_description = ${finalMetaDescription},
            updated_at = NOW()
          WHERE id = ${id} AND site_id = ${siteId}
          RETURNING id, site_id, name, subtitle, slug, header_image, sections,
                    order_rank, configurator_category_id, meta_title, meta_description,
                    created_at, updated_at
        `) as Solution[];

        const solution = result[0];

        // Update filter associations if provided
        let filterIds: string[];
        if (filters !== undefined) {
          // Delete existing associations
          await sql`
            DELETE FROM solution_filters WHERE solution_id = ${id}
          `;

          // Insert new associations
          for (const filterId of filters) {
            await sql`
              INSERT INTO solution_filters (solution_id, filter_id)
              VALUES (${id}, ${filterId})
            `;
          }
          filterIds = filters;
        } else {
          // Fetch existing filter associations
          const filterAssociations = (await sql`
            SELECT filter_id FROM solution_filters WHERE solution_id = ${id}
          `) as { filter_id: string }[];
          filterIds = filterAssociations.map((f) => f.filter_id);
        }

        const solutionWithFilters: SolutionWithFilters = {
          ...solution,
          filter_ids: filterIds,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Solution updated successfully:\n\n${JSON.stringify(solutionWithFilters, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error updating solution: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: delete_solution
  server.tool(
    "delete_solution",
    "Delete a solution by ID.",
    {
      id: z.string().describe("The UUID of the solution to delete"),
    },
    async ({ id }) => {
      try {
        const siteId = requireSiteContext();

        // Verify solution exists and get its name for the success message
        const existingSolutions = (await sql`
          SELECT id, name FROM solutions WHERE id = ${id} AND site_id = ${siteId}
        `) as { id: string; name: string }[];

        if (existingSolutions.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Solution with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const solutionName = existingSolutions[0].name;

        // Delete filter associations first
        await sql`
          DELETE FROM solution_filters WHERE solution_id = ${id}
        `;

        // Delete the solution
        await sql`
          DELETE FROM solutions WHERE id = ${id} AND site_id = ${siteId}
        `;

        return {
          content: [
            {
              type: "text" as const,
              text: `Solution "${solutionName}" (ID: ${id}) has been deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error deleting solution: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: reorder_solutions
  server.tool(
    "reorder_solutions",
    "Reorder solutions by providing an array of solution IDs in the desired order.",
    {
      ids: z
        .array(z.string())
        .min(1)
        .describe(
          "Array of solution IDs in the desired order. The first ID will have order_rank 1, the second will have 2, etc."
        ),
    },
    async ({ ids }) => {
      try {
        const siteId = requireSiteContext();

        // Verify all solutions exist in current site
        const existingSolutions = (await sql`
          SELECT id FROM solutions WHERE site_id = ${siteId} AND id = ANY(${ids})
        `) as { id: string }[];

        const existingIds = new Set(existingSolutions.map((s) => s.id));
        const invalidIds = ids.filter((id) => !existingIds.has(id));

        if (invalidIds.length > 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: The following solution IDs were not found in the current site: ${invalidIds.join(", ")}`,
              },
            ],
            isError: true,
          };
        }

        // Update order_rank for each solution
        for (let i = 0; i < ids.length; i++) {
          const orderRank = i + 1;
          await sql`
            UPDATE solutions
            SET order_rank = ${orderRank}, updated_at = NOW()
            WHERE id = ${ids[i]} AND site_id = ${siteId}
          `;
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully reordered ${ids.length} solutions.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error reordering solutions: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
