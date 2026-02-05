import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sql } from "../db.js";
import { requireSiteContext } from "../context.js";
import { randomUUID } from "crypto";

// Types
type SectionType =
  | "pageHeader"
  | "slideshow"
  | "solutionsScroller"
  | "splitSection"
  | "uspSection"
  | "flexibleSection"
  | "solutionHighlight";

interface Section {
  _key: string;
  _type: SectionType;
  [key: string]: unknown;
}

type TargetType = "page" | "solution";

// Section type defaults
function getSectionDefaults(type: SectionType): Omit<Section, "_key" | "_type"> {
  switch (type) {
    case "pageHeader":
      return {
        title: "",
        subtitle: "",
        background: false,
        showImage: true,
        showButtons: false,
        buttons: [],
      };
    case "slideshow":
      return {
        background: false,
        images: [],
      };
    case "solutionsScroller":
      return {
        heading: "",
        subtitle: "",
      };
    case "splitSection":
      return {
        items: [{ _key: randomUUID() }, { _key: randomUUID() }],
      };
    case "uspSection":
      return {
        heading: "",
        usps: [],
      };
    case "flexibleSection":
      return {
        layout: "1-col",
        background: false,
        verticalAlign: "top",
        blockMain: [],
        blockLeft: [],
        blockRight: [],
      };
    case "solutionHighlight":
      return {
        solutionId: "",
        subtitle: "",
      };
    default:
      return {};
  }
}

// Helper to get sections from page or solution
async function getSections(
  targetType: TargetType,
  targetId: string,
  siteId: string
): Promise<{ sections: Section[]; exists: boolean }> {
  const table = targetType === "page" ? "pages" : "solutions";

  const results = (await sql`
    SELECT sections FROM ${sql(table)}
    WHERE id = ${targetId} AND site_id = ${siteId}
  `) as { sections: Section[] }[];

  if (results.length === 0) {
    return { sections: [], exists: false };
  }

  return { sections: results[0].sections || [], exists: true };
}

// Helper to save sections to page or solution
async function saveSections(
  targetType: TargetType,
  targetId: string,
  siteId: string,
  sections: Section[]
): Promise<void> {
  const table = targetType === "page" ? "pages" : "solutions";
  const sectionsJson = JSON.stringify(sections);

  await sql`
    UPDATE ${sql(table)}
    SET sections = ${sectionsJson}::jsonb, updated_at = NOW()
    WHERE id = ${targetId} AND site_id = ${siteId}
  `;
}

// Zod schemas
const targetTypeSchema = z.enum(["page", "solution"]);
const sectionTypeSchema = z.enum([
  "pageHeader",
  "slideshow",
  "solutionsScroller",
  "splitSection",
  "uspSection",
  "flexibleSection",
  "solutionHighlight",
]);

export function registerSectionTools(server: McpServer): void {
  // Tool: get_section
  server.tool(
    "get_section",
    "Get a single section by key from a page or solution.",
    {
      targetType: targetTypeSchema.describe('Either "page" or "solution"'),
      targetId: z.string().describe("The UUID of the page or solution"),
      sectionKey: z.string().describe("The _key of the section to retrieve"),
    },
    async ({ targetType, targetId, sectionKey }) => {
      try {
        const siteId = requireSiteContext();

        const { sections, exists } = await getSections(
          targetType,
          targetId,
          siteId
        );

        if (!exists) {
          return {
            content: [
              {
                type: "text" as const,
                text: `${targetType === "page" ? "Page" : "Solution"} with ID "${targetId}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const section = sections.find((s) => s._key === sectionKey);

        if (!section) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Section with key "${sectionKey}" not found.`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(section, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error getting section: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: add_section
  server.tool(
    "add_section",
    "Add a new section to a page or solution. Generates a unique _key automatically.",
    {
      targetType: targetTypeSchema.describe('Either "page" or "solution"'),
      targetId: z.string().describe("The UUID of the page or solution"),
      sectionType: sectionTypeSchema.describe("The type of section to add"),
      position: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe(
          "Position to insert the section (0-indexed). Defaults to appending at the end."
        ),
      data: z
        .record(z.unknown())
        .optional()
        .describe("Optional section data to merge with defaults"),
    },
    async ({ targetType, targetId, sectionType, position, data }) => {
      try {
        const siteId = requireSiteContext();

        const { sections, exists } = await getSections(
          targetType,
          targetId,
          siteId
        );

        if (!exists) {
          return {
            content: [
              {
                type: "text" as const,
                text: `${targetType === "page" ? "Page" : "Solution"} with ID "${targetId}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        // Create new section with defaults
        const newSection: Section = {
          _key: randomUUID(),
          _type: sectionType,
          ...getSectionDefaults(sectionType),
          ...(data || {}),
        };

        // Insert at position or append
        const insertPosition =
          position !== undefined
            ? Math.min(position, sections.length)
            : sections.length;

        sections.splice(insertPosition, 0, newSection);

        await saveSections(targetType, targetId, siteId, sections);

        return {
          content: [
            {
              type: "text" as const,
              text: `Section added successfully at position ${insertPosition}:\n\n${JSON.stringify(newSection, null, 2)}\n\nUpdated sections array:\n${JSON.stringify(sections, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error adding section: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: update_section
  server.tool(
    "update_section",
    "Update a section by key. Merges provided data with existing section data (preserves _key and _type).",
    {
      targetType: targetTypeSchema.describe('Either "page" or "solution"'),
      targetId: z.string().describe("The UUID of the page or solution"),
      sectionKey: z.string().describe("The _key of the section to update"),
      data: z
        .record(z.unknown())
        .describe("Partial update object to merge with existing section"),
    },
    async ({ targetType, targetId, sectionKey, data }) => {
      try {
        const siteId = requireSiteContext();

        const { sections, exists } = await getSections(
          targetType,
          targetId,
          siteId
        );

        if (!exists) {
          return {
            content: [
              {
                type: "text" as const,
                text: `${targetType === "page" ? "Page" : "Solution"} with ID "${targetId}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const sectionIndex = sections.findIndex((s) => s._key === sectionKey);

        if (sectionIndex === -1) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Section with key "${sectionKey}" not found.`,
              },
            ],
            isError: true,
          };
        }

        // Merge data, preserving _key and _type
        const existingSection = sections[sectionIndex];
        const updatedSection: Section = {
          ...existingSection,
          ...data,
          _key: existingSection._key,
          _type: existingSection._type,
        };

        sections[sectionIndex] = updatedSection;

        await saveSections(targetType, targetId, siteId, sections);

        return {
          content: [
            {
              type: "text" as const,
              text: `Section updated successfully:\n\n${JSON.stringify(updatedSection, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error updating section: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: remove_section
  server.tool(
    "remove_section",
    "Remove a section by key from a page or solution.",
    {
      targetType: targetTypeSchema.describe('Either "page" or "solution"'),
      targetId: z.string().describe("The UUID of the page or solution"),
      sectionKey: z.string().describe("The _key of the section to remove"),
    },
    async ({ targetType, targetId, sectionKey }) => {
      try {
        const siteId = requireSiteContext();

        const { sections, exists } = await getSections(
          targetType,
          targetId,
          siteId
        );

        if (!exists) {
          return {
            content: [
              {
                type: "text" as const,
                text: `${targetType === "page" ? "Page" : "Solution"} with ID "${targetId}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const sectionIndex = sections.findIndex((s) => s._key === sectionKey);

        if (sectionIndex === -1) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Section with key "${sectionKey}" not found.`,
              },
            ],
            isError: true,
          };
        }

        const removedSection = sections[sectionIndex];
        sections.splice(sectionIndex, 1);

        await saveSections(targetType, targetId, siteId, sections);

        return {
          content: [
            {
              type: "text" as const,
              text: `Section "${removedSection._type}" with key "${sectionKey}" removed successfully. ${sections.length} sections remaining.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error removing section: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: reorder_sections
  server.tool(
    "reorder_sections",
    "Reorder sections by providing an array of section keys in the desired order.",
    {
      targetType: targetTypeSchema.describe('Either "page" or "solution"'),
      targetId: z.string().describe("The UUID of the page or solution"),
      sectionKeys: z
        .array(z.string())
        .min(1)
        .describe(
          "Array of section _keys in the desired order. Must include all existing section keys."
        ),
    },
    async ({ targetType, targetId, sectionKeys }) => {
      try {
        const siteId = requireSiteContext();

        const { sections, exists } = await getSections(
          targetType,
          targetId,
          siteId
        );

        if (!exists) {
          return {
            content: [
              {
                type: "text" as const,
                text: `${targetType === "page" ? "Page" : "Solution"} with ID "${targetId}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        // Validate all keys exist
        const existingKeys = new Set(sections.map((s) => s._key));
        const providedKeys = new Set(sectionKeys);

        const missingKeys = sectionKeys.filter((key) => !existingKeys.has(key));
        if (missingKeys.length > 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: The following section keys were not found: ${missingKeys.join(", ")}`,
              },
            ],
            isError: true,
          };
        }

        const extraKeys = [...existingKeys].filter(
          (key) => !providedKeys.has(key)
        );
        if (extraKeys.length > 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: The following existing section keys were not included in the reorder: ${extraKeys.join(", ")}`,
              },
            ],
            isError: true,
          };
        }

        // Reorder sections
        const sectionMap = new Map(sections.map((s) => [s._key, s]));
        const reorderedSections = sectionKeys.map(
          (key) => sectionMap.get(key)!
        );

        await saveSections(targetType, targetId, siteId, reorderedSections);

        return {
          content: [
            {
              type: "text" as const,
              text: `Sections reordered successfully:\n\n${JSON.stringify(reorderedSections, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error reordering sections: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
