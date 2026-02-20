import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sql } from "../db.js";
import { requireSiteContext } from "../context.js";

// Types
interface NavigationLink {
  id: string;
  site_id: string;
  location: "header" | "footer";
  title: string;
  slug: string;
  submenu_heading: string | null;
  order_rank: number;
}

interface NavigationSubitem {
  id: string;
  link_id: string;
  solution_id: string | null;
  order_rank: number;
}

interface NavigationSubitemWithSolution extends NavigationSubitem {
  solution_name: string | null;
}

interface NavigationLinkWithSubitems extends NavigationLink {
  subitems: NavigationSubitemWithSolution[];
}

export function registerNavigationTools(server: McpServer): void {
  // Tool: list_navigation
  server.tool(
    "list_navigation",
    "List navigation links for a specific location (header or footer), including subitems with solution names.",
    {
      location: z
        .enum(["header", "footer"])
        .describe("The navigation location: 'header' or 'footer'"),
    },
    async ({ location }) => {
      try {
        const siteId = requireSiteContext();

        const links = (await sql`
          SELECT id, site_id, location, title, slug, submenu_heading, order_rank
          FROM navigation_links
          WHERE site_id = ${siteId} AND location = ${location}
          ORDER BY order_rank
        `) as NavigationLink[];

        if (links.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No navigation links found for ${location}.`,
              },
            ],
          };
        }

        // Fetch all subitems for these links with solution names
        const linkIds = links.map((l) => l.id);
        const subitems = (await sql`
          SELECT ns.id, ns.link_id, ns.solution_id, ns.order_rank, s.name as solution_name
          FROM navigation_subitems ns
          LEFT JOIN solutions s ON ns.solution_id = s.id
          WHERE ns.link_id = ANY(${linkIds})
          ORDER BY ns.order_rank
        `) as (NavigationSubitem & { solution_name: string | null })[];

        // Group subitems by link
        const subitemsByLink = new Map<string, NavigationSubitemWithSolution[]>();
        for (const subitem of subitems) {
          const existing = subitemsByLink.get(subitem.link_id) ?? [];
          existing.push({
            id: subitem.id,
            link_id: subitem.link_id,
            solution_id: subitem.solution_id,
            order_rank: subitem.order_rank,
            solution_name: subitem.solution_name,
          });
          subitemsByLink.set(subitem.link_id, existing);
        }

        // Combine links with their subitems
        const linksWithSubitems: NavigationLinkWithSubitems[] = links.map((link) => ({
          ...link,
          subitems: subitemsByLink.get(link.id) ?? [],
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(linksWithSubitems, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error listing navigation: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: create_nav_link
  server.tool(
    "create_nav_link",
    "Create a new navigation link. Requires location, title, and slug.",
    {
      location: z
        .enum(["header", "footer"])
        .describe("The navigation location: 'header' or 'footer'"),
      title: z.string().min(1).describe("The link title (required)"),
      slug: z.string().min(1).describe("The link slug/path (required)"),
      submenu_heading: z
        .string()
        .nullable()
        .optional()
        .describe("Optional heading for submenu items"),
      order_rank: z
        .number()
        .int()
        .optional()
        .describe("Order rank for sorting within the location. Defaults to max + 1."),
    },
    async ({ location, title, slug, submenu_heading, order_rank }) => {
      try {
        const siteId = requireSiteContext();

        // Determine order_rank if not provided
        let finalOrderRank = order_rank;
        if (finalOrderRank === undefined) {
          const maxRankResult = (await sql`
            SELECT COALESCE(MAX(order_rank), 0) + 1 as next_rank
            FROM navigation_links
            WHERE site_id = ${siteId} AND location = ${location}
          `) as { next_rank: number }[];
          finalOrderRank = maxRankResult[0].next_rank;
        }

        const result = (await sql`
          INSERT INTO navigation_links (site_id, location, title, slug, submenu_heading, order_rank)
          VALUES (${siteId}, ${location}, ${title}, ${slug}, ${submenu_heading ?? null}, ${finalOrderRank})
          RETURNING id, site_id, location, title, slug, submenu_heading, order_rank
        `) as NavigationLink[];

        const link = result[0];

        return {
          content: [
            {
              type: "text" as const,
              text: `Navigation link created successfully:\n\n${JSON.stringify(link, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error creating navigation link: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: update_nav_link
  server.tool(
    "update_nav_link",
    "Update an existing navigation link. Only provided fields will be updated.",
    {
      id: z.string().describe("The UUID of the navigation link to update (required)"),
      title: z.string().min(1).optional().describe("The link title"),
      slug: z.string().min(1).optional().describe("The link slug/path"),
      submenu_heading: z
        .string()
        .nullable()
        .optional()
        .describe("Heading for submenu items, or null to remove"),
      order_rank: z.number().int().optional().describe("Order rank for sorting"),
    },
    async ({ id, title, slug, submenu_heading, order_rank }) => {
      try {
        const siteId = requireSiteContext();

        // Verify link exists in current site
        const existingLinks = (await sql`
          SELECT id, title, slug, submenu_heading, order_rank FROM navigation_links
          WHERE id = ${id} AND site_id = ${siteId}
        `) as NavigationLink[];

        if (existingLinks.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Navigation link with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const current = existingLinks[0];
        const finalTitle = title !== undefined ? title : current.title;
        const finalSlug = slug !== undefined ? slug : current.slug;
        const finalSubmenuHeading =
          submenu_heading !== undefined ? submenu_heading : current.submenu_heading;
        const finalOrderRank = order_rank !== undefined ? order_rank : current.order_rank;

        const result = (await sql`
          UPDATE navigation_links
          SET title = ${finalTitle}, slug = ${finalSlug}, submenu_heading = ${finalSubmenuHeading}, order_rank = ${finalOrderRank}
          WHERE id = ${id} AND site_id = ${siteId}
          RETURNING id, site_id, location, title, slug, submenu_heading, order_rank
        `) as NavigationLink[];

        const link = result[0];

        return {
          content: [
            {
              type: "text" as const,
              text: `Navigation link updated successfully:\n\n${JSON.stringify(link, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error updating navigation link: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: delete_nav_link
  server.tool(
    "delete_nav_link",
    "Delete a navigation link by ID. This will cascade delete all subitems.",
    {
      id: z.string().describe("The UUID of the navigation link to delete"),
    },
    async ({ id }) => {
      try {
        const siteId = requireSiteContext();

        // Verify link exists and get its title
        const existingLinks = (await sql`
          SELECT id, title FROM navigation_links WHERE id = ${id} AND site_id = ${siteId}
        `) as { id: string; title: string }[];

        if (existingLinks.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Navigation link with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const linkTitle = existingLinks[0].title;

        // Count subitems that will be deleted
        const subitemCount = (await sql`
          SELECT COUNT(*) as count FROM navigation_subitems WHERE link_id = ${id}
        `) as { count: number }[];

        // Delete all subitems
        await sql`
          DELETE FROM navigation_subitems WHERE link_id = ${id}
        `;

        // Delete the link
        await sql`
          DELETE FROM navigation_links WHERE id = ${id} AND site_id = ${siteId}
        `;

        return {
          content: [
            {
              type: "text" as const,
              text: `Navigation link "${linkTitle}" (ID: ${id}) and ${subitemCount[0].count} subitems have been deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error deleting navigation link: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: reorder_nav_links
  server.tool(
    "reorder_nav_links",
    "Reorder navigation links within a location by providing an array of link IDs in the desired order.",
    {
      location: z
        .enum(["header", "footer"])
        .describe("The navigation location: 'header' or 'footer'"),
      ids: z
        .array(z.string())
        .min(1)
        .describe(
          "Array of navigation link IDs in the desired order. The first ID will have order_rank 1, etc."
        ),
    },
    async ({ location, ids }) => {
      try {
        const siteId = requireSiteContext();

        // Verify all links exist in the location
        const existingLinks = (await sql`
          SELECT id FROM navigation_links
          WHERE site_id = ${siteId} AND location = ${location} AND id = ANY(${ids})
        `) as { id: string }[];

        const existingIds = new Set(existingLinks.map((l) => l.id));
        const invalidIds = ids.filter((id) => !existingIds.has(id));

        if (invalidIds.length > 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: The following navigation link IDs were not found in ${location}: ${invalidIds.join(", ")}`,
              },
            ],
            isError: true,
          };
        }

        // Batch update order_rank for all links in a single query
        const ranks = ids.map((_: string, i: number) => i + 1);
        await sql`
          UPDATE navigation_links AS t
          SET order_rank = v.rank
          FROM (SELECT unnest(${ids}::uuid[]) AS id, unnest(${ranks}::int[]) AS rank) AS v
          WHERE t.id = v.id AND t.site_id = ${siteId} AND t.location = ${location}
        `;

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully reordered ${ids.length} navigation links in ${location}.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error reordering navigation links: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: list_nav_subitems
  server.tool(
    "list_nav_subitems",
    "List subitems for a navigation link, including solution names.",
    {
      linkId: z.string().describe("The UUID of the navigation link"),
    },
    async ({ linkId }) => {
      try {
        const siteId = requireSiteContext();

        // Verify link exists
        const linkExists = await sql`
          SELECT id FROM navigation_links WHERE id = ${linkId} AND site_id = ${siteId}
        `;
        if (linkExists.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Navigation link with ID "${linkId}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const subitems = (await sql`
          SELECT ns.id, ns.link_id, ns.solution_id, ns.order_rank, s.name as solution_name
          FROM navigation_subitems ns
          LEFT JOIN solutions s ON ns.solution_id = s.id
          WHERE ns.link_id = ${linkId}
          ORDER BY ns.order_rank
        `) as (NavigationSubitem & { solution_name: string | null })[];

        if (subitems.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No subitems found for this navigation link.",
              },
            ],
          };
        }

        const subitemsWithSolution: NavigationSubitemWithSolution[] = subitems.map(
          (subitem) => ({
            id: subitem.id,
            link_id: subitem.link_id,
            solution_id: subitem.solution_id,
            order_rank: subitem.order_rank,
            solution_name: subitem.solution_name,
          })
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(subitemsWithSolution, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error listing navigation subitems: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: add_nav_subitem
  server.tool(
    "add_nav_subitem",
    "Add a subitem to a navigation link. Requires linkId, optionally solutionId.",
    {
      linkId: z.string().describe("The UUID of the navigation link (required)"),
      solutionId: z
        .string()
        .nullable()
        .optional()
        .describe("The UUID of the solution to link to (optional)"),
      order_rank: z
        .number()
        .int()
        .optional()
        .describe("Order rank for sorting. Defaults to max + 1."),
    },
    async ({ linkId, solutionId, order_rank }) => {
      try {
        const siteId = requireSiteContext();

        // Verify link exists
        const linkExists = await sql`
          SELECT id FROM navigation_links WHERE id = ${linkId} AND site_id = ${siteId}
        `;
        if (linkExists.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Navigation link with ID "${linkId}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        // Verify solution exists if provided
        if (solutionId) {
          const solutionExists = await sql`
            SELECT id FROM solutions WHERE id = ${solutionId} AND site_id = ${siteId}
          `;
          if (solutionExists.length === 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Solution with ID "${solutionId}" not found in the current site.`,
                },
              ],
              isError: true,
            };
          }
        }

        // Determine order_rank if not provided
        let finalOrderRank = order_rank;
        if (finalOrderRank === undefined) {
          const maxRankResult = (await sql`
            SELECT COALESCE(MAX(order_rank), 0) + 1 as next_rank
            FROM navigation_subitems
            WHERE link_id = ${linkId}
          `) as { next_rank: number }[];
          finalOrderRank = maxRankResult[0].next_rank;
        }

        const result = (await sql`
          INSERT INTO navigation_subitems (link_id, solution_id, order_rank)
          VALUES (${linkId}, ${solutionId ?? null}, ${finalOrderRank})
          RETURNING id, link_id, solution_id, order_rank
        `) as NavigationSubitem[];

        const subitem = result[0];

        // Get solution name if applicable
        let solutionName: string | null = null;
        if (solutionId) {
          const solution = (await sql`
            SELECT name FROM solutions WHERE id = ${solutionId}
          `) as { name: string }[];
          solutionName = solution[0]?.name ?? null;
        }

        const response: NavigationSubitemWithSolution = {
          ...subitem,
          solution_name: solutionName,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Navigation subitem added successfully:\n\n${JSON.stringify(response, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error adding navigation subitem: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: update_nav_subitem
  server.tool(
    "update_nav_subitem",
    "Update an existing navigation subitem. Only provided fields will be updated.",
    {
      id: z.string().describe("The UUID of the navigation subitem to update (required)"),
      solutionId: z
        .string()
        .nullable()
        .optional()
        .describe("The UUID of the solution to link to, or null to remove"),
      order_rank: z.number().int().optional().describe("Order rank for sorting"),
    },
    async ({ id, solutionId, order_rank }) => {
      try {
        const siteId = requireSiteContext();

        // Verify subitem exists and belongs to a link in the current site
        const existingSubitems = (await sql`
          SELECT ns.id, ns.link_id, ns.solution_id, ns.order_rank
          FROM navigation_subitems ns
          JOIN navigation_links nl ON ns.link_id = nl.id
          WHERE ns.id = ${id} AND nl.site_id = ${siteId}
        `) as NavigationSubitem[];

        if (existingSubitems.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Navigation subitem with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const current = existingSubitems[0];

        // Verify new solution exists if provided
        if (solutionId !== undefined && solutionId !== null) {
          const solutionExists = await sql`
            SELECT id FROM solutions WHERE id = ${solutionId} AND site_id = ${siteId}
          `;
          if (solutionExists.length === 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Solution with ID "${solutionId}" not found in the current site.`,
                },
              ],
              isError: true,
            };
          }
        }

        const finalSolutionId = solutionId !== undefined ? solutionId : current.solution_id;
        const finalOrderRank = order_rank !== undefined ? order_rank : current.order_rank;

        const result = (await sql`
          UPDATE navigation_subitems
          SET solution_id = ${finalSolutionId}, order_rank = ${finalOrderRank}
          WHERE id = ${id}
          RETURNING id, link_id, solution_id, order_rank
        `) as NavigationSubitem[];

        const subitem = result[0];

        // Get solution name if applicable
        let solutionName: string | null = null;
        if (subitem.solution_id) {
          const solution = (await sql`
            SELECT name FROM solutions WHERE id = ${subitem.solution_id}
          `) as { name: string }[];
          solutionName = solution[0]?.name ?? null;
        }

        const response: NavigationSubitemWithSolution = {
          ...subitem,
          solution_name: solutionName,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Navigation subitem updated successfully:\n\n${JSON.stringify(response, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error updating navigation subitem: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: remove_nav_subitem
  server.tool(
    "remove_nav_subitem",
    "Remove a navigation subitem by ID.",
    {
      id: z.string().describe("The UUID of the navigation subitem to remove"),
    },
    async ({ id }) => {
      try {
        const siteId = requireSiteContext();

        // Verify subitem exists and belongs to a link in the current site
        const existingSubitems = (await sql`
          SELECT ns.id
          FROM navigation_subitems ns
          JOIN navigation_links nl ON ns.link_id = nl.id
          WHERE ns.id = ${id} AND nl.site_id = ${siteId}
        `) as { id: string }[];

        if (existingSubitems.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Navigation subitem with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        await sql`
          DELETE FROM navigation_subitems WHERE id = ${id}
        `;

        return {
          content: [
            {
              type: "text" as const,
              text: `Navigation subitem (ID: ${id}) has been removed successfully.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error removing navigation subitem: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: reorder_nav_subitems
  server.tool(
    "reorder_nav_subitems",
    "Reorder subitems within a navigation link by providing an array of subitem IDs in the desired order.",
    {
      linkId: z.string().describe("The UUID of the navigation link"),
      ids: z
        .array(z.string())
        .min(1)
        .describe(
          "Array of navigation subitem IDs in the desired order. The first ID will have order_rank 1, etc."
        ),
    },
    async ({ linkId, ids }) => {
      try {
        const siteId = requireSiteContext();

        // Verify link exists
        const linkExists = await sql`
          SELECT id FROM navigation_links WHERE id = ${linkId} AND site_id = ${siteId}
        `;
        if (linkExists.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Navigation link with ID "${linkId}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        // Verify all subitems exist for this link
        const existingSubitems = (await sql`
          SELECT id FROM navigation_subitems WHERE link_id = ${linkId} AND id = ANY(${ids})
        `) as { id: string }[];

        const existingIds = new Set(existingSubitems.map((s) => s.id));
        const invalidIds = ids.filter((id) => !existingIds.has(id));

        if (invalidIds.length > 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: The following subitem IDs were not found for link ${linkId}: ${invalidIds.join(", ")}`,
              },
            ],
            isError: true,
          };
        }

        // Batch update order_rank for all subitems in a single query
        const ranks = ids.map((_: string, i: number) => i + 1);
        await sql`
          UPDATE navigation_subitems AS t
          SET order_rank = v.rank
          FROM (SELECT unnest(${ids}::uuid[]) AS id, unnest(${ranks}::int[]) AS rank) AS v
          WHERE t.id = v.id AND t.link_id = ${linkId}
        `;

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully reordered ${ids.length} subitems for navigation link.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error reordering navigation subitems: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
