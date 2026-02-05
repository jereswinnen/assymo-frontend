import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { listSites } from "./db.js";
import { getSiteContext, setSiteContext } from "./context.js";
import { registerPageTools } from "./tools/pages.js";

const server = new McpServer({
  name: "assymo-admin",
  version: "1.0.0",
});

// Tool: list_sites
// Lists all available sites in the database
server.tool(
  "list_sites",
  "List all available sites in the Assymo CMS. Returns site ID, name, and slug for each site.",
  {},
  async () => {
    try {
      const sites = await listSites();
      const currentSiteId = getSiteContext();

      const siteList = sites
        .map((site) => {
          const isCurrent = site.id === currentSiteId ? " (current)" : "";
          return `- ${site.name} (slug: ${site.slug}, id: ${site.id})${isCurrent}`;
        })
        .join("\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `Available sites:\n${siteList}\n\nUse the set_site tool with a site ID to select a site for subsequent operations.`,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text" as const,
            text: `Error listing sites: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: set_site
// Sets the current site context for subsequent operations
server.tool(
  "set_site",
  "Set the current site context for subsequent operations. All site-scoped operations will use this site.",
  {
    siteId: z.string().describe("The UUID of the site to set as current context"),
  },
  async ({ siteId }) => {
    try {
      // Verify the site exists
      const sites = await listSites();
      const site = sites.find((s) => s.id === siteId);

      if (!site) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Site with ID "${siteId}" not found. Use list_sites to see available sites.`,
            },
          ],
          isError: true,
        };
      }

      setSiteContext(siteId);

      return {
        content: [
          {
            type: "text" as const,
            text: `Site context set to: ${site.name} (slug: ${site.slug}, id: ${site.id})\n\nAll subsequent site-scoped operations will use this site.`,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text" as const,
            text: `Error setting site context: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register page tools
registerPageTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Assymo Admin MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
