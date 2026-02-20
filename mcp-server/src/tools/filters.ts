import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sql } from "../db.js";
import { requireSiteContext } from "../context.js";

// Types
interface FilterCategory {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  order_rank: number;
}

interface FilterCategoryWithFilters extends FilterCategory {
  filters: Filter[];
}

interface Filter {
  id: string;
  site_id: string;
  category_id: string;
  name: string;
  slug: string;
  order_rank: number;
}

export function registerFilterTools(server: McpServer): void {
  // Tool: list_filter_categories
  server.tool(
    "list_filter_categories",
    "List all filter categories for the current site, including nested filters. Returns id, name, slug, order_rank, and filters array for each category.",
    {},
    async () => {
      try {
        const siteId = requireSiteContext();

        const categories = (await sql`
          SELECT id, site_id, name, slug, order_rank
          FROM filter_categories
          WHERE site_id = ${siteId}
          ORDER BY order_rank
        `) as FilterCategory[];

        if (categories.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No filter categories found for the current site.",
              },
            ],
          };
        }

        // Fetch all filters for this site
        const filters = (await sql`
          SELECT id, site_id, category_id, name, slug, order_rank
          FROM filters
          WHERE site_id = ${siteId}
          ORDER BY order_rank
        `) as Filter[];

        // Group filters by category
        const filtersByCategory = new Map<string, Filter[]>();
        for (const filter of filters) {
          const existing = filtersByCategory.get(filter.category_id) ?? [];
          existing.push(filter);
          filtersByCategory.set(filter.category_id, existing);
        }

        // Combine categories with their filters
        const categoriesWithFilters: FilterCategoryWithFilters[] = categories.map(
          (category) => ({
            ...category,
            filters: filtersByCategory.get(category.id) ?? [],
          })
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(categoriesWithFilters, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error listing filter categories: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: create_filter_category
  server.tool(
    "create_filter_category",
    "Create a new filter category. Requires name and slug.",
    {
      name: z.string().min(1).describe("The category name (required)"),
      slug: z
        .string()
        .min(1)
        .describe("The category slug (required). Must be unique per site."),
      order_rank: z
        .number()
        .int()
        .optional()
        .describe("Order rank for sorting. Defaults to max + 1."),
    },
    async ({ name, slug, order_rank }) => {
      try {
        const siteId = requireSiteContext();

        // Check slug uniqueness
        const existing = await sql`
          SELECT id FROM filter_categories WHERE site_id = ${siteId} AND slug = ${slug}
        `;
        if (existing.length > 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: A filter category with slug "${slug}" already exists in this site.`,
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
            FROM filter_categories
            WHERE site_id = ${siteId}
          `) as { next_rank: number }[];
          finalOrderRank = maxRankResult[0].next_rank;
        }

        const result = (await sql`
          INSERT INTO filter_categories (site_id, name, slug, order_rank)
          VALUES (${siteId}, ${name}, ${slug}, ${finalOrderRank})
          RETURNING id, site_id, name, slug, order_rank
        `) as FilterCategory[];

        const category = result[0];

        return {
          content: [
            {
              type: "text" as const,
              text: `Filter category created successfully:\n\n${JSON.stringify(category, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error creating filter category: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: update_filter_category
  server.tool(
    "update_filter_category",
    "Update an existing filter category. Only provided fields will be updated.",
    {
      id: z.string().describe("The UUID of the filter category to update (required)"),
      name: z.string().min(1).optional().describe("The category name"),
      slug: z
        .string()
        .min(1)
        .optional()
        .describe("The category slug. Must be unique per site."),
      order_rank: z.number().int().optional().describe("Order rank for sorting"),
    },
    async ({ id, name, slug, order_rank }) => {
      try {
        const siteId = requireSiteContext();

        // Verify category exists in current site
        const existingCategories = (await sql`
          SELECT id, name, slug, order_rank FROM filter_categories
          WHERE id = ${id} AND site_id = ${siteId}
        `) as FilterCategory[];

        if (existingCategories.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Filter category with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        // Check slug uniqueness if being updated
        if (slug !== undefined) {
          const slugConflict = await sql`
            SELECT id FROM filter_categories
            WHERE site_id = ${siteId} AND slug = ${slug} AND id != ${id}
          `;
          if (slugConflict.length > 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Error: A filter category with slug "${slug}" already exists in this site.`,
                },
              ],
              isError: true,
            };
          }
        }

        const current = existingCategories[0];
        const finalName = name !== undefined ? name : current.name;
        const finalSlug = slug !== undefined ? slug : current.slug;
        const finalOrderRank = order_rank !== undefined ? order_rank : current.order_rank;

        const result = (await sql`
          UPDATE filter_categories
          SET name = ${finalName}, slug = ${finalSlug}, order_rank = ${finalOrderRank}
          WHERE id = ${id} AND site_id = ${siteId}
          RETURNING id, site_id, name, slug, order_rank
        `) as FilterCategory[];

        const category = result[0];

        return {
          content: [
            {
              type: "text" as const,
              text: `Filter category updated successfully:\n\n${JSON.stringify(category, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error updating filter category: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: delete_filter_category
  server.tool(
    "delete_filter_category",
    "Delete a filter category by ID. This will cascade delete all filters in the category.",
    {
      id: z.string().describe("The UUID of the filter category to delete"),
    },
    async ({ id }) => {
      try {
        const siteId = requireSiteContext();

        // Verify category exists and get its name
        const existingCategories = (await sql`
          SELECT id, name FROM filter_categories WHERE id = ${id} AND site_id = ${siteId}
        `) as { id: string; name: string }[];

        if (existingCategories.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Filter category with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const categoryName = existingCategories[0].name;

        // Get all filter IDs in this category for cleanup
        const filtersInCategory = (await sql`
          SELECT id FROM filters WHERE category_id = ${id}
        `) as { id: string }[];

        // Delete solution_filters associations for all filters in this category
        for (const filter of filtersInCategory) {
          await sql`
            DELETE FROM solution_filters WHERE filter_id = ${filter.id}
          `;
        }

        // Delete all filters in this category
        await sql`
          DELETE FROM filters WHERE category_id = ${id}
        `;

        // Delete the category
        await sql`
          DELETE FROM filter_categories WHERE id = ${id} AND site_id = ${siteId}
        `;

        return {
          content: [
            {
              type: "text" as const,
              text: `Filter category "${categoryName}" (ID: ${id}) and ${filtersInCategory.length} filters have been deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error deleting filter category: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: reorder_filter_categories
  server.tool(
    "reorder_filter_categories",
    "Reorder filter categories by providing an array of category IDs in the desired order.",
    {
      ids: z
        .array(z.string())
        .min(1)
        .describe(
          "Array of filter category IDs in the desired order. The first ID will have order_rank 1, etc."
        ),
    },
    async ({ ids }) => {
      try {
        const siteId = requireSiteContext();

        // Verify all categories exist in current site
        const existingCategories = (await sql`
          SELECT id FROM filter_categories WHERE site_id = ${siteId} AND id = ANY(${ids})
        `) as { id: string }[];

        const existingIds = new Set(existingCategories.map((c) => c.id));
        const invalidIds = ids.filter((id) => !existingIds.has(id));

        if (invalidIds.length > 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: The following filter category IDs were not found in the current site: ${invalidIds.join(", ")}`,
              },
            ],
            isError: true,
          };
        }

        // Batch update order_rank for all categories in a single query
        const ranks = ids.map((_: string, i: number) => i + 1);
        await sql`
          UPDATE filter_categories AS t
          SET order_rank = v.rank
          FROM (SELECT unnest(${ids}::uuid[]) AS id, unnest(${ranks}::int[]) AS rank) AS v
          WHERE t.id = v.id AND t.site_id = ${siteId}
        `;

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully reordered ${ids.length} filter categories.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error reordering filter categories: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: list_filters
  server.tool(
    "list_filters",
    "List all filters for the current site, optionally filtered by category ID.",
    {
      categoryId: z
        .string()
        .optional()
        .describe("Optional filter category ID to filter by"),
    },
    async ({ categoryId }) => {
      try {
        const siteId = requireSiteContext();

        let filters: Filter[];
        if (categoryId) {
          filters = (await sql`
            SELECT id, site_id, category_id, name, slug, order_rank
            FROM filters
            WHERE site_id = ${siteId} AND category_id = ${categoryId}
            ORDER BY order_rank
          `) as Filter[];
        } else {
          filters = (await sql`
            SELECT id, site_id, category_id, name, slug, order_rank
            FROM filters
            WHERE site_id = ${siteId}
            ORDER BY order_rank
          `) as Filter[];
        }

        if (filters.length === 0) {
          const suffix = categoryId ? " in this category" : "";
          return {
            content: [
              {
                type: "text" as const,
                text: `No filters found for the current site${suffix}.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(filters, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error listing filters: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: create_filter
  server.tool(
    "create_filter",
    "Create a new filter. Requires name, slug, and categoryId.",
    {
      name: z.string().min(1).describe("The filter name (required)"),
      slug: z
        .string()
        .min(1)
        .describe("The filter slug (required). Must be unique per category."),
      categoryId: z.string().describe("The UUID of the filter category (required)"),
      order_rank: z
        .number()
        .int()
        .optional()
        .describe("Order rank for sorting within the category. Defaults to max + 1."),
    },
    async ({ name, slug, categoryId, order_rank }) => {
      try {
        const siteId = requireSiteContext();

        // Verify category exists
        const categoryExists = await sql`
          SELECT id FROM filter_categories WHERE id = ${categoryId} AND site_id = ${siteId}
        `;
        if (categoryExists.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Filter category with ID "${categoryId}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        // Check slug uniqueness within category
        const existing = await sql`
          SELECT id FROM filters WHERE category_id = ${categoryId} AND slug = ${slug}
        `;
        if (existing.length > 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: A filter with slug "${slug}" already exists in this category.`,
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
            FROM filters
            WHERE category_id = ${categoryId}
          `) as { next_rank: number }[];
          finalOrderRank = maxRankResult[0].next_rank;
        }

        const result = (await sql`
          INSERT INTO filters (site_id, category_id, name, slug, order_rank)
          VALUES (${siteId}, ${categoryId}, ${name}, ${slug}, ${finalOrderRank})
          RETURNING id, site_id, category_id, name, slug, order_rank
        `) as Filter[];

        const filter = result[0];

        return {
          content: [
            {
              type: "text" as const,
              text: `Filter created successfully:\n\n${JSON.stringify(filter, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error creating filter: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: update_filter
  server.tool(
    "update_filter",
    "Update an existing filter. Only provided fields will be updated.",
    {
      id: z.string().describe("The UUID of the filter to update (required)"),
      name: z.string().min(1).optional().describe("The filter name"),
      slug: z
        .string()
        .min(1)
        .optional()
        .describe("The filter slug. Must be unique per category."),
      categoryId: z
        .string()
        .optional()
        .describe("The UUID of the filter category to move the filter to"),
      order_rank: z.number().int().optional().describe("Order rank for sorting"),
    },
    async ({ id, name, slug, categoryId, order_rank }) => {
      try {
        const siteId = requireSiteContext();

        // Verify filter exists in current site
        const existingFilters = (await sql`
          SELECT id, name, slug, category_id, order_rank FROM filters
          WHERE id = ${id} AND site_id = ${siteId}
        `) as Filter[];

        if (existingFilters.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Filter with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const current = existingFilters[0];
        const targetCategoryId = categoryId !== undefined ? categoryId : current.category_id;

        // If moving to a new category, verify it exists
        if (categoryId !== undefined && categoryId !== current.category_id) {
          const categoryExists = await sql`
            SELECT id FROM filter_categories WHERE id = ${categoryId} AND site_id = ${siteId}
          `;
          if (categoryExists.length === 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Error: Filter category with ID "${categoryId}" not found in the current site.`,
                },
              ],
              isError: true,
            };
          }
        }

        // Check slug uniqueness if being updated
        if (slug !== undefined) {
          const slugConflict = await sql`
            SELECT id FROM filters
            WHERE category_id = ${targetCategoryId} AND slug = ${slug} AND id != ${id}
          `;
          if (slugConflict.length > 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Error: A filter with slug "${slug}" already exists in this category.`,
                },
              ],
              isError: true,
            };
          }
        }

        const finalName = name !== undefined ? name : current.name;
        const finalSlug = slug !== undefined ? slug : current.slug;
        const finalOrderRank = order_rank !== undefined ? order_rank : current.order_rank;

        const result = (await sql`
          UPDATE filters
          SET name = ${finalName}, slug = ${finalSlug}, category_id = ${targetCategoryId}, order_rank = ${finalOrderRank}
          WHERE id = ${id} AND site_id = ${siteId}
          RETURNING id, site_id, category_id, name, slug, order_rank
        `) as Filter[];

        const filter = result[0];

        return {
          content: [
            {
              type: "text" as const,
              text: `Filter updated successfully:\n\n${JSON.stringify(filter, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error updating filter: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: delete_filter
  server.tool(
    "delete_filter",
    "Delete a filter by ID. This will also remove associations from solution_filters.",
    {
      id: z.string().describe("The UUID of the filter to delete"),
    },
    async ({ id }) => {
      try {
        const siteId = requireSiteContext();

        // Verify filter exists and get its name
        const existingFilters = (await sql`
          SELECT id, name FROM filters WHERE id = ${id} AND site_id = ${siteId}
        `) as { id: string; name: string }[];

        if (existingFilters.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Filter with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const filterName = existingFilters[0].name;

        // Delete solution_filters associations
        await sql`
          DELETE FROM solution_filters WHERE filter_id = ${id}
        `;

        // Delete the filter
        await sql`
          DELETE FROM filters WHERE id = ${id} AND site_id = ${siteId}
        `;

        return {
          content: [
            {
              type: "text" as const,
              text: `Filter "${filterName}" (ID: ${id}) has been deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error deleting filter: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: reorder_filters
  server.tool(
    "reorder_filters",
    "Reorder filters within a category by providing an array of filter IDs in the desired order.",
    {
      categoryId: z.string().describe("The UUID of the filter category"),
      ids: z
        .array(z.string())
        .min(1)
        .describe(
          "Array of filter IDs in the desired order. The first ID will have order_rank 1, etc."
        ),
    },
    async ({ categoryId, ids }) => {
      try {
        const siteId = requireSiteContext();

        // Verify category exists
        const categoryExists = await sql`
          SELECT id FROM filter_categories WHERE id = ${categoryId} AND site_id = ${siteId}
        `;
        if (categoryExists.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: Filter category with ID "${categoryId}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        // Verify all filters exist in the category
        const existingFilters = (await sql`
          SELECT id FROM filters WHERE category_id = ${categoryId} AND id = ANY(${ids})
        `) as { id: string }[];

        const existingIds = new Set(existingFilters.map((f) => f.id));
        const invalidIds = ids.filter((id) => !existingIds.has(id));

        if (invalidIds.length > 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: The following filter IDs were not found in category ${categoryId}: ${invalidIds.join(", ")}`,
              },
            ],
            isError: true,
          };
        }

        // Batch update order_rank for all filters in a single query
        const ranks = ids.map((_: string, i: number) => i + 1);
        await sql`
          UPDATE filters AS t
          SET order_rank = v.rank
          FROM (SELECT unnest(${ids}::uuid[]) AS id, unnest(${ranks}::int[]) AS rank) AS v
          WHERE t.id = v.id AND t.category_id = ${categoryId}
        `;

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully reordered ${ids.length} filters in category.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error reordering filters: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
