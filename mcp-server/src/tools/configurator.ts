import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sql } from "../db.js";
import { requireSiteContext } from "../context.js";

// Types
interface ConfiguratorCategory {
  id: string;
  site_id: string;
  name: string;
  slug: string;
  order_rank: number;
  created_at: string;
  updated_at: string;
}

interface ConfiguratorCategoryListItem {
  id: string;
  name: string;
  slug: string;
  order_rank: number;
  updated_at: string;
}

interface QuestionOption {
  value: string;
  label: string;
  image?: string;
  catalogueItemId?: string;
  priceModifierMin?: number;
  priceModifierMax?: number;
}

interface ConfiguratorQuestion {
  id: string;
  site_id: string;
  category_id: string | null;
  question_key: string;
  label: string;
  heading_level: string;
  subtitle: string | null;
  type: string;
  display_type: string;
  options: QuestionOption[] | null;
  required: boolean;
  order_rank: number;
  catalogue_item_id: string | null;
  price_per_unit_min: number | null;
  price_per_unit_max: number | null;
  step_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ConfiguratorQuestionListItem {
  id: string;
  question_key: string;
  label: string;
  type: string;
  category_id: string | null;
  step_id: string | null;
  order_rank: number;
  required: boolean;
  updated_at: string;
}

interface ConfiguratorStep {
  id: string;
  site_id: string;
  category_id: string;
  name: string;
  description: string | null;
  order_rank: number;
  created_at: string;
  updated_at: string;
}

interface ConfiguratorStepListItem {
  id: string;
  name: string;
  category_id: string;
  order_rank: number;
  updated_at: string;
}

interface CatalogueItem {
  id: string;
  site_id: string;
  name: string;
  category: string;
  image: string | null;
  price_min: number;
  price_max: number;
  unit: string | null;
  created_at: string;
  updated_at: string;
}

interface CatalogueItemListItem {
  id: string;
  name: string;
  category: string;
  price_min: number;
  price_max: number;
  unit: string | null;
  updated_at: string;
}

// Zod schemas for validation
const questionOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  image: z.string().optional(),
  catalogueItemId: z.string().optional(),
  priceModifierMin: z.number().int().optional(),
  priceModifierMax: z.number().int().optional(),
});

const questionOptionsSchema = z.array(questionOptionSchema).nullable().optional();

export function registerConfiguratorTools(server: McpServer): void {
  // ========================================
  // Category Tools
  // ========================================

  // Tool: list_configurator_categories
  server.tool(
    "list_configurator_categories",
    "List all configurator categories for the current site. Returns id, name, slug, order_rank, and updated_at for each category, sorted by order_rank.",
    {},
    async () => {
      try {
        const siteId = requireSiteContext();

        const categories = (await sql`
          SELECT id, name, slug, order_rank, updated_at
          FROM configurator_categories
          WHERE site_id = ${siteId}
          ORDER BY order_rank
        `) as ConfiguratorCategoryListItem[];

        if (categories.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No configurator categories found for the current site.",
              },
            ],
          };
        }

        const categoryList = categories
          .map((category) => {
            return `- ${category.name} (/${category.slug})\n  ID: ${category.id}\n  Order: ${category.order_rank}\n  Updated: ${category.updated_at}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `Configurator categories for current site:\n\n${categoryList}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error listing configurator categories: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: get_configurator_category
  server.tool(
    "get_configurator_category",
    "Get a single configurator category by ID. Returns the full category object.",
    {
      id: z.string().describe("The UUID of the category to retrieve"),
    },
    async ({ id }) => {
      try {
        const siteId = requireSiteContext();

        const categories = (await sql`
          SELECT id, site_id, name, slug, order_rank, created_at, updated_at
          FROM configurator_categories
          WHERE id = ${id} AND site_id = ${siteId}
        `) as ConfiguratorCategory[];

        if (categories.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Configurator category with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const category = categories[0];

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(category, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error getting configurator category: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: create_configurator_category
  server.tool(
    "create_configurator_category",
    "Create a new configurator category. Requires name and slug.",
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
          SELECT id FROM configurator_categories WHERE site_id = ${siteId} AND slug = ${slug}
        `;
        if (existing.length > 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: A configurator category with slug "${slug}" already exists in this site.`,
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
            FROM configurator_categories
            WHERE site_id = ${siteId}
          `) as { next_rank: number }[];
          finalOrderRank = maxRankResult[0].next_rank;
        }

        // Insert the category
        const result = (await sql`
          INSERT INTO configurator_categories (site_id, name, slug, order_rank)
          VALUES (${siteId}, ${name}, ${slug}, ${finalOrderRank})
          RETURNING id, site_id, name, slug, order_rank, created_at, updated_at
        `) as ConfiguratorCategory[];

        const category = result[0];

        return {
          content: [
            {
              type: "text" as const,
              text: `Configurator category created successfully:\n\n${JSON.stringify(category, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error creating configurator category: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: update_configurator_category
  server.tool(
    "update_configurator_category",
    "Update an existing configurator category. Only provided fields will be updated.",
    {
      id: z.string().describe("The UUID of the category to update (required)"),
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
          SELECT id FROM configurator_categories WHERE id = ${id} AND site_id = ${siteId}
        `) as { id: string }[];

        if (existingCategories.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Configurator category with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        // Check slug uniqueness if being updated
        if (slug !== undefined) {
          const slugConflict = await sql`
            SELECT id FROM configurator_categories
            WHERE site_id = ${siteId} AND slug = ${slug} AND id != ${id}
          `;
          if (slugConflict.length > 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Error: A configurator category with slug "${slug}" already exists in this site.`,
                },
              ],
              isError: true,
            };
          }
        }

        // Fetch current category to merge values
        const currentCategory = (await sql`
          SELECT name, slug, order_rank
          FROM configurator_categories WHERE id = ${id}
        `) as ConfiguratorCategory[];

        const current = currentCategory[0];

        const finalName = name !== undefined ? name : current.name;
        const finalSlug = slug !== undefined ? slug : current.slug;
        const finalOrderRank = order_rank !== undefined ? order_rank : current.order_rank;

        const result = (await sql`
          UPDATE configurator_categories
          SET
            name = ${finalName},
            slug = ${finalSlug},
            order_rank = ${finalOrderRank},
            updated_at = NOW()
          WHERE id = ${id} AND site_id = ${siteId}
          RETURNING id, site_id, name, slug, order_rank, created_at, updated_at
        `) as ConfiguratorCategory[];

        const category = result[0];

        return {
          content: [
            {
              type: "text" as const,
              text: `Configurator category updated successfully:\n\n${JSON.stringify(category, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error updating configurator category: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: delete_configurator_category
  server.tool(
    "delete_configurator_category",
    "Delete a configurator category by ID.",
    {
      id: z.string().describe("The UUID of the category to delete"),
    },
    async ({ id }) => {
      try {
        const siteId = requireSiteContext();

        // Verify category exists and get its name for the success message
        const existingCategories = (await sql`
          SELECT id, name FROM configurator_categories WHERE id = ${id} AND site_id = ${siteId}
        `) as { id: string; name: string }[];

        if (existingCategories.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Configurator category with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const categoryName = existingCategories[0].name;

        // Delete the category
        await sql`
          DELETE FROM configurator_categories WHERE id = ${id} AND site_id = ${siteId}
        `;

        return {
          content: [
            {
              type: "text" as const,
              text: `Configurator category "${categoryName}" (ID: ${id}) has been deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error deleting configurator category: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: reorder_configurator_categories
  server.tool(
    "reorder_configurator_categories",
    "Reorder configurator categories by providing an array of category IDs in the desired order.",
    {
      ids: z
        .array(z.string())
        .min(1)
        .describe(
          "Array of category IDs in the desired order. The first ID will have order_rank 1, the second will have 2, etc."
        ),
    },
    async ({ ids }) => {
      try {
        const siteId = requireSiteContext();

        // Verify all categories exist in current site
        const existingCategories = (await sql`
          SELECT id FROM configurator_categories WHERE site_id = ${siteId} AND id = ANY(${ids})
        `) as { id: string }[];

        const existingIds = new Set(existingCategories.map((c) => c.id));
        const invalidIds = ids.filter((id) => !existingIds.has(id));

        if (invalidIds.length > 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: The following category IDs were not found in the current site: ${invalidIds.join(", ")}`,
              },
            ],
            isError: true,
          };
        }

        // Update order_rank for each category
        for (let i = 0; i < ids.length; i++) {
          const orderRank = i + 1;
          await sql`
            UPDATE configurator_categories
            SET order_rank = ${orderRank}, updated_at = NOW()
            WHERE id = ${ids[i]} AND site_id = ${siteId}
          `;
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully reordered ${ids.length} configurator categories.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error reordering configurator categories: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ========================================
  // Question Tools
  // ========================================

  // Tool: list_questions
  server.tool(
    "list_questions",
    "List all configurator questions for the current site. Optionally filter by category ID. Returns id, question_key, label, type, category_id, order_rank, required, and updated_at for each question, sorted by order_rank.",
    {
      categoryId: z
        .string()
        .optional()
        .describe("Optional category ID to filter questions by"),
    },
    async ({ categoryId }) => {
      try {
        const siteId = requireSiteContext();

        let questions: ConfiguratorQuestionListItem[];
        if (categoryId !== undefined) {
          questions = (await sql`
            SELECT id, question_key, label, type, category_id, step_id, order_rank, required, updated_at
            FROM configurator_questions
            WHERE site_id = ${siteId} AND category_id = ${categoryId}
            ORDER BY order_rank
          `) as ConfiguratorQuestionListItem[];
        } else {
          questions = (await sql`
            SELECT id, question_key, label, type, category_id, step_id, order_rank, required, updated_at
            FROM configurator_questions
            WHERE site_id = ${siteId}
            ORDER BY order_rank
          `) as ConfiguratorQuestionListItem[];
        }

        if (questions.length === 0) {
          const filterMsg = categoryId
            ? ` for category ${categoryId}`
            : "";
          return {
            content: [
              {
                type: "text" as const,
                text: `No configurator questions found${filterMsg} for the current site.`,
              },
            ],
          };
        }

        const questionList = questions
          .map((question) => {
            const requiredStr = question.required ? "[required]" : "[optional]";
            const categoryStr = question.category_id
              ? `Category: ${question.category_id}`
              : "No category";
            const stepStr = question.step_id
              ? `\n  Step: ${question.step_id}`
              : "";
            return `- ${question.label} (${question.question_key}) ${requiredStr}\n  ID: ${question.id}\n  Type: ${question.type}\n  ${categoryStr}${stepStr}\n  Order: ${question.order_rank}\n  Updated: ${question.updated_at}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `Configurator questions for current site:\n\n${questionList}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error listing configurator questions: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: get_question
  server.tool(
    "get_question",
    "Get a single configurator question by ID. Returns the full question object including options.",
    {
      id: z.string().describe("The UUID of the question to retrieve"),
    },
    async ({ id }) => {
      try {
        const siteId = requireSiteContext();

        const questions = (await sql`
          SELECT id, site_id, category_id, question_key, label, heading_level, subtitle,
                 type, display_type, options, required, order_rank, catalogue_item_id,
                 price_per_unit_min, price_per_unit_max, step_id, created_at, updated_at
          FROM configurator_questions
          WHERE id = ${id} AND site_id = ${siteId}
        `) as ConfiguratorQuestion[];

        if (questions.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Configurator question with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const question = questions[0];

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(question, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error getting configurator question: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: create_question
  server.tool(
    "create_question",
    "Create a new configurator question. Requires label, question_key, and type.",
    {
      label: z.string().min(1).describe("The question label (required)"),
      question_key: z
        .string()
        .min(1)
        .describe("Unique identifier for the question (required)"),
      type: z
        .enum(["single-select", "multi-select", "text", "number"])
        .describe("Question type (required)"),
      categoryId: z
        .string()
        .nullable()
        .optional()
        .describe("UUID of the configurator category"),
      heading_level: z
        .enum(["h2", "h3", "h4"])
        .optional()
        .describe("Heading level. Defaults to h2."),
      subtitle: z.string().nullable().optional().describe("Question subtitle"),
      display_type: z
        .enum(["select", "radio-cards"])
        .optional()
        .describe("Display type. Defaults to select."),
      options: questionOptionsSchema.describe(
        "Array of option objects for select types"
      ),
      required: z.boolean().optional().describe("Whether the question is required. Defaults to true."),
      order_rank: z
        .number()
        .int()
        .optional()
        .describe("Order rank for sorting. Defaults to max + 1 within category."),
      catalogue_item_id: z
        .string()
        .nullable()
        .optional()
        .describe("UUID of the linked price catalogue item"),
      price_per_unit_min: z
        .number()
        .int()
        .nullable()
        .optional()
        .describe("Minimum price per unit in cents"),
      price_per_unit_max: z
        .number()
        .int()
        .nullable()
        .optional()
        .describe("Maximum price per unit in cents"),
      stepId: z
        .string()
        .nullable()
        .optional()
        .describe("UUID of the step this question belongs to"),
    },
    async ({
      label,
      question_key,
      type,
      categoryId,
      heading_level,
      subtitle,
      display_type,
      options,
      required,
      order_rank,
      catalogue_item_id,
      price_per_unit_min,
      price_per_unit_max,
      stepId,
    }) => {
      try {
        const siteId = requireSiteContext();

        // Determine order_rank if not provided (within category context)
        let finalOrderRank = order_rank;
        if (finalOrderRank === undefined) {
          if (categoryId) {
            const maxRankResult = (await sql`
              SELECT COALESCE(MAX(order_rank), 0) + 1 as next_rank
              FROM configurator_questions
              WHERE site_id = ${siteId} AND category_id = ${categoryId}
            `) as { next_rank: number }[];
            finalOrderRank = maxRankResult[0].next_rank;
          } else {
            const maxRankResult = (await sql`
              SELECT COALESCE(MAX(order_rank), 0) + 1 as next_rank
              FROM configurator_questions
              WHERE site_id = ${siteId} AND category_id IS NULL
            `) as { next_rank: number }[];
            finalOrderRank = maxRankResult[0].next_rank;
          }
        }

        // Prepare JSONB values
        const optionsJson = options ? JSON.stringify(options) : null;

        // Insert the question
        const result = (await sql`
          INSERT INTO configurator_questions (
            site_id, category_id, question_key, label, heading_level, subtitle,
            type, display_type, options, required, order_rank, catalogue_item_id,
            price_per_unit_min, price_per_unit_max, step_id
          )
          VALUES (
            ${siteId},
            ${categoryId ?? null},
            ${question_key},
            ${label},
            ${heading_level ?? "h2"},
            ${subtitle ?? null},
            ${type},
            ${display_type ?? "select"},
            ${optionsJson}::jsonb,
            ${required ?? true},
            ${finalOrderRank},
            ${catalogue_item_id ?? null},
            ${price_per_unit_min ?? null},
            ${price_per_unit_max ?? null},
            ${stepId ?? null}
          )
          RETURNING id, site_id, category_id, question_key, label, heading_level, subtitle,
                    type, display_type, options, required, order_rank, catalogue_item_id,
                    price_per_unit_min, price_per_unit_max, step_id, created_at, updated_at
        `) as ConfiguratorQuestion[];

        const question = result[0];

        return {
          content: [
            {
              type: "text" as const,
              text: `Configurator question created successfully:\n\n${JSON.stringify(question, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error creating configurator question: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: update_question
  server.tool(
    "update_question",
    "Update an existing configurator question. Only provided fields will be updated.",
    {
      id: z.string().describe("The UUID of the question to update (required)"),
      label: z.string().min(1).optional().describe("The question label"),
      question_key: z.string().min(1).optional().describe("Unique identifier for the question"),
      type: z
        .enum(["single-select", "multi-select", "text", "number"])
        .optional()
        .describe("Question type"),
      categoryId: z
        .string()
        .nullable()
        .optional()
        .describe("UUID of the configurator category"),
      heading_level: z
        .enum(["h2", "h3", "h4"])
        .optional()
        .describe("Heading level"),
      subtitle: z.string().nullable().optional().describe("Question subtitle"),
      display_type: z
        .enum(["select", "radio-cards"])
        .optional()
        .describe("Display type"),
      options: questionOptionsSchema.describe(
        "Array of option objects for select types"
      ),
      required: z.boolean().optional().describe("Whether the question is required"),
      order_rank: z.number().int().optional().describe("Order rank for sorting"),
      catalogue_item_id: z
        .string()
        .nullable()
        .optional()
        .describe("UUID of the linked price catalogue item"),
      price_per_unit_min: z
        .number()
        .int()
        .nullable()
        .optional()
        .describe("Minimum price per unit in cents"),
      price_per_unit_max: z
        .number()
        .int()
        .nullable()
        .optional()
        .describe("Maximum price per unit in cents"),
      stepId: z
        .string()
        .nullable()
        .optional()
        .describe("UUID of the step this question belongs to"),
    },
    async ({
      id,
      label,
      question_key,
      type,
      categoryId,
      heading_level,
      subtitle,
      display_type,
      options,
      required,
      order_rank,
      catalogue_item_id,
      price_per_unit_min,
      price_per_unit_max,
      stepId,
    }) => {
      try {
        const siteId = requireSiteContext();

        // Verify question exists in current site
        const existingQuestions = (await sql`
          SELECT id FROM configurator_questions WHERE id = ${id} AND site_id = ${siteId}
        `) as { id: string }[];

        if (existingQuestions.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Configurator question with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        // Fetch current question to merge values
        const currentQuestion = (await sql`
          SELECT category_id, question_key, label, heading_level, subtitle, type, display_type,
                 options, required, order_rank, catalogue_item_id, price_per_unit_min, price_per_unit_max, step_id
          FROM configurator_questions WHERE id = ${id}
        `) as ConfiguratorQuestion[];

        const current = currentQuestion[0];

        const finalLabel = label !== undefined ? label : current.label;
        const finalQuestionKey = question_key !== undefined ? question_key : current.question_key;
        const finalType = type !== undefined ? type : current.type;
        const finalCategoryId = categoryId !== undefined ? categoryId : current.category_id;
        const finalHeadingLevel = heading_level !== undefined ? heading_level : current.heading_level;
        const finalSubtitle = subtitle !== undefined ? subtitle : current.subtitle;
        const finalDisplayType = display_type !== undefined ? display_type : current.display_type;
        const finalOptions =
          options !== undefined
            ? JSON.stringify(options)
            : JSON.stringify(current.options);
        const finalRequired = required !== undefined ? required : current.required;
        const finalOrderRank = order_rank !== undefined ? order_rank : current.order_rank;
        const finalCatalogueItemId =
          catalogue_item_id !== undefined ? catalogue_item_id : current.catalogue_item_id;
        const finalPricePerUnitMin =
          price_per_unit_min !== undefined ? price_per_unit_min : current.price_per_unit_min;
        const finalPricePerUnitMax =
          price_per_unit_max !== undefined ? price_per_unit_max : current.price_per_unit_max;
        const finalStepId = stepId !== undefined ? stepId : current.step_id;

        const result = (await sql`
          UPDATE configurator_questions
          SET
            category_id = ${finalCategoryId},
            question_key = ${finalQuestionKey},
            label = ${finalLabel},
            heading_level = ${finalHeadingLevel},
            subtitle = ${finalSubtitle},
            type = ${finalType},
            display_type = ${finalDisplayType},
            options = ${finalOptions}::jsonb,
            required = ${finalRequired},
            order_rank = ${finalOrderRank},
            catalogue_item_id = ${finalCatalogueItemId},
            price_per_unit_min = ${finalPricePerUnitMin},
            price_per_unit_max = ${finalPricePerUnitMax},
            step_id = ${finalStepId},
            updated_at = NOW()
          WHERE id = ${id} AND site_id = ${siteId}
          RETURNING id, site_id, category_id, question_key, label, heading_level, subtitle,
                    type, display_type, options, required, order_rank, catalogue_item_id,
                    price_per_unit_min, price_per_unit_max, step_id, created_at, updated_at
        `) as ConfiguratorQuestion[];

        const question = result[0];

        return {
          content: [
            {
              type: "text" as const,
              text: `Configurator question updated successfully:\n\n${JSON.stringify(question, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error updating configurator question: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: delete_question
  server.tool(
    "delete_question",
    "Delete a configurator question by ID.",
    {
      id: z.string().describe("The UUID of the question to delete"),
    },
    async ({ id }) => {
      try {
        const siteId = requireSiteContext();

        // Verify question exists and get its label for the success message
        const existingQuestions = (await sql`
          SELECT id, label FROM configurator_questions WHERE id = ${id} AND site_id = ${siteId}
        `) as { id: string; label: string }[];

        if (existingQuestions.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Configurator question with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const questionLabel = existingQuestions[0].label;

        // Delete the question
        await sql`
          DELETE FROM configurator_questions WHERE id = ${id} AND site_id = ${siteId}
        `;

        return {
          content: [
            {
              type: "text" as const,
              text: `Configurator question "${questionLabel}" (ID: ${id}) has been deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error deleting configurator question: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: reorder_questions
  server.tool(
    "reorder_questions",
    "Reorder configurator questions by providing an array of question IDs in the desired order.",
    {
      ids: z
        .array(z.string())
        .min(1)
        .describe(
          "Array of question IDs in the desired order. The first ID will have order_rank 1, the second will have 2, etc."
        ),
    },
    async ({ ids }) => {
      try {
        const siteId = requireSiteContext();

        // Verify all questions exist in current site
        const existingQuestions = (await sql`
          SELECT id FROM configurator_questions WHERE site_id = ${siteId} AND id = ANY(${ids})
        `) as { id: string }[];

        const existingIds = new Set(existingQuestions.map((q) => q.id));
        const invalidIds = ids.filter((id) => !existingIds.has(id));

        if (invalidIds.length > 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: The following question IDs were not found in the current site: ${invalidIds.join(", ")}`,
              },
            ],
            isError: true,
          };
        }

        // Update order_rank for each question
        for (let i = 0; i < ids.length; i++) {
          const orderRank = i + 1;
          await sql`
            UPDATE configurator_questions
            SET order_rank = ${orderRank}, updated_at = NOW()
            WHERE id = ${ids[i]} AND site_id = ${siteId}
          `;
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully reordered ${ids.length} configurator questions.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error reordering configurator questions: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ========================================
  // Step Tools
  // ========================================

  // Tool: list_configurator_steps
  server.tool(
    "list_configurator_steps",
    "List all configurator steps for a category, ordered by order_rank. Steps group questions into separate wizard pages.",
    {
      categoryId: z.string().describe("The UUID of the category to list steps for (required)"),
    },
    async ({ categoryId }) => {
      try {
        const siteId = requireSiteContext();

        const steps = (await sql`
          SELECT id, name, category_id, order_rank, updated_at
          FROM configurator_steps
          WHERE site_id = ${siteId} AND category_id = ${categoryId}
          ORDER BY order_rank, created_at
        `) as ConfiguratorStepListItem[];

        if (steps.length === 0) {
          return {
            content: [{ type: "text" as const, text: `No configurator steps found for category ${categoryId}.` }],
          };
        }

        const stepList = steps
          .map((s) => `- ${s.name} (rank: ${s.order_rank})\n  ID: ${s.id}`)
          .join("\n\n");

        return {
          content: [{ type: "text" as const, text: `Configurator steps for category ${categoryId}:\n\n${stepList}` }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { content: [{ type: "text" as const, text: `Error listing steps: ${message}` }], isError: true };
      }
    }
  );

  // Tool: get_configurator_step
  server.tool(
    "get_configurator_step",
    "Get a single configurator step by ID.",
    {
      id: z.string().describe("The UUID of the step to retrieve"),
    },
    async ({ id }) => {
      try {
        const siteId = requireSiteContext();

        const steps = (await sql`
          SELECT * FROM configurator_steps WHERE id = ${id} AND site_id = ${siteId}
        `) as ConfiguratorStep[];

        if (steps.length === 0) {
          return { content: [{ type: "text" as const, text: `Step with ID "${id}" not found.` }], isError: true };
        }

        return { content: [{ type: "text" as const, text: JSON.stringify(steps[0], null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { content: [{ type: "text" as const, text: `Error getting step: ${message}` }], isError: true };
      }
    }
  );

  // Tool: create_configurator_step
  server.tool(
    "create_configurator_step",
    "Create a new configurator step within a category. Steps group questions into separate wizard pages.",
    {
      categoryId: z.string().describe("The UUID of the category (required)"),
      name: z.string().min(1).describe("Step name (required)"),
      description: z.string().nullable().optional().describe("Optional step description"),
      order_rank: z.number().int().optional().describe("Order rank (auto-calculated if not provided)"),
    },
    async ({ categoryId, name, description, order_rank }) => {
      try {
        const siteId = requireSiteContext();

        let finalOrderRank = order_rank;
        if (finalOrderRank === undefined) {
          const maxRankResult = (await sql`
            SELECT COALESCE(MAX(order_rank), 0) + 1 as next_rank
            FROM configurator_steps
            WHERE site_id = ${siteId} AND category_id = ${categoryId}
          `) as { next_rank: number }[];
          finalOrderRank = maxRankResult[0].next_rank;
        }

        const result = (await sql`
          INSERT INTO configurator_steps (site_id, category_id, name, description, order_rank)
          VALUES (${siteId}, ${categoryId}, ${name}, ${description ?? null}, ${finalOrderRank})
          RETURNING *
        `) as ConfiguratorStep[];

        return {
          content: [{ type: "text" as const, text: `Step created successfully:\n\n${JSON.stringify(result[0], null, 2)}` }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { content: [{ type: "text" as const, text: `Error creating step: ${message}` }], isError: true };
      }
    }
  );

  // Tool: update_configurator_step
  server.tool(
    "update_configurator_step",
    "Update an existing configurator step. Only provided fields will be updated.",
    {
      id: z.string().describe("The UUID of the step to update (required)"),
      name: z.string().min(1).optional().describe("Step name"),
      description: z.string().nullable().optional().describe("Step description"),
    },
    async ({ id, name, description }) => {
      try {
        const siteId = requireSiteContext();

        const existing = (await sql`
          SELECT * FROM configurator_steps WHERE id = ${id} AND site_id = ${siteId}
        `) as ConfiguratorStep[];

        if (existing.length === 0) {
          return { content: [{ type: "text" as const, text: `Step with ID "${id}" not found.` }], isError: true };
        }

        const current = existing[0];
        const finalName = name !== undefined ? name : current.name;
        const finalDescription = description !== undefined ? description : current.description;

        const result = (await sql`
          UPDATE configurator_steps
          SET name = ${finalName}, description = ${finalDescription}, updated_at = NOW()
          WHERE id = ${id} AND site_id = ${siteId}
          RETURNING *
        `) as ConfiguratorStep[];

        return {
          content: [{ type: "text" as const, text: `Step updated successfully:\n\n${JSON.stringify(result[0], null, 2)}` }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { content: [{ type: "text" as const, text: `Error updating step: ${message}` }], isError: true };
      }
    }
  );

  // Tool: delete_configurator_step
  server.tool(
    "delete_configurator_step",
    "Delete a configurator step by ID. Questions assigned to this step will have their step_id set to NULL.",
    {
      id: z.string().describe("The UUID of the step to delete"),
    },
    async ({ id }) => {
      try {
        const siteId = requireSiteContext();

        const existing = (await sql`
          SELECT id, name FROM configurator_steps WHERE id = ${id} AND site_id = ${siteId}
        `) as { id: string; name: string }[];

        if (existing.length === 0) {
          return { content: [{ type: "text" as const, text: `Step with ID "${id}" not found.` }], isError: true };
        }

        await sql`DELETE FROM configurator_steps WHERE id = ${id} AND site_id = ${siteId}`;

        return {
          content: [{ type: "text" as const, text: `Step "${existing[0].name}" (ID: ${id}) deleted successfully.` }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { content: [{ type: "text" as const, text: `Error deleting step: ${message}` }], isError: true };
      }
    }
  );

  // Tool: reorder_configurator_steps
  server.tool(
    "reorder_configurator_steps",
    "Reorder configurator steps by providing an array of step IDs in the desired order.",
    {
      ids: z.array(z.string()).min(1).describe("Array of step IDs in the desired order"),
    },
    async ({ ids }) => {
      try {
        const siteId = requireSiteContext();

        for (let i = 0; i < ids.length; i++) {
          await sql`
            UPDATE configurator_steps
            SET order_rank = ${i}, updated_at = NOW()
            WHERE id = ${ids[i]} AND site_id = ${siteId}
          `;
        }

        return {
          content: [{ type: "text" as const, text: `Successfully reordered ${ids.length} configurator steps.` }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { content: [{ type: "text" as const, text: `Error reordering steps: ${message}` }], isError: true };
      }
    }
  );

  // ========================================
  // Catalogue Tools
  // ========================================

  // Tool: list_catalogue_items
  server.tool(
    "list_catalogue_items",
    "List all price catalogue items for the current site. Optionally filter by category (free text grouping). Returns id, name, category, price_min, price_max, unit, and updated_at for each item.",
    {
      category: z
        .string()
        .optional()
        .describe("Optional category (free text) to filter items by"),
    },
    async ({ category }) => {
      try {
        const siteId = requireSiteContext();

        let items: CatalogueItemListItem[];
        if (category !== undefined) {
          items = (await sql`
            SELECT id, name, category, price_min, price_max, unit, updated_at
            FROM configurator_price_catalogue
            WHERE site_id = ${siteId} AND category = ${category}
            ORDER BY category, name
          `) as CatalogueItemListItem[];
        } else {
          items = (await sql`
            SELECT id, name, category, price_min, price_max, unit, updated_at
            FROM configurator_price_catalogue
            WHERE site_id = ${siteId}
            ORDER BY category, name
          `) as CatalogueItemListItem[];
        }

        if (items.length === 0) {
          const filterMsg = category ? ` in category "${category}"` : "";
          return {
            content: [
              {
                type: "text" as const,
                text: `No price catalogue items found${filterMsg} for the current site.`,
              },
            ],
          };
        }

        const itemList = items
          .map((item) => {
            const unitStr = item.unit ? ` per ${item.unit}` : "";
            const priceRange =
              item.price_min === item.price_max
                ? `${item.price_min / 100}€`
                : `${item.price_min / 100}€ - ${item.price_max / 100}€`;
            return `- ${item.name} (${item.category})\n  ID: ${item.id}\n  Price: ${priceRange}${unitStr}\n  Updated: ${item.updated_at}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `Price catalogue items for current site:\n\n${itemList}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error listing price catalogue items: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: get_catalogue_item
  server.tool(
    "get_catalogue_item",
    "Get a single price catalogue item by ID. Returns the full item object.",
    {
      id: z.string().describe("The UUID of the catalogue item to retrieve"),
    },
    async ({ id }) => {
      try {
        const siteId = requireSiteContext();

        const items = (await sql`
          SELECT id, site_id, name, category, image, price_min, price_max, unit, created_at, updated_at
          FROM configurator_price_catalogue
          WHERE id = ${id} AND site_id = ${siteId}
        `) as CatalogueItem[];

        if (items.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Price catalogue item with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const item = items[0];

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(item, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error getting price catalogue item: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: create_catalogue_item
  server.tool(
    "create_catalogue_item",
    "Create a new price catalogue item. Requires name, category, price_min, and price_max.",
    {
      name: z.string().min(1).describe("The item name (required)"),
      category: z.string().min(1).describe("The item category - free text grouping (required)"),
      price_min: z.number().int().describe("Minimum price in cents (required)"),
      price_max: z.number().int().describe("Maximum price in cents (required)"),
      image: z.string().nullable().optional().describe("Image URL"),
      unit: z.string().nullable().optional().describe("Unit of measurement (e.g., 'm²', 'stuk')"),
    },
    async ({ name, category, price_min, price_max, image, unit }) => {
      try {
        const siteId = requireSiteContext();

        // Insert the item
        const result = (await sql`
          INSERT INTO configurator_price_catalogue (site_id, name, category, image, price_min, price_max, unit)
          VALUES (${siteId}, ${name}, ${category}, ${image ?? null}, ${price_min}, ${price_max}, ${unit ?? null})
          RETURNING id, site_id, name, category, image, price_min, price_max, unit, created_at, updated_at
        `) as CatalogueItem[];

        const item = result[0];

        return {
          content: [
            {
              type: "text" as const,
              text: `Price catalogue item created successfully:\n\n${JSON.stringify(item, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error creating price catalogue item: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: update_catalogue_item
  server.tool(
    "update_catalogue_item",
    "Update an existing price catalogue item. Only provided fields will be updated.",
    {
      id: z.string().describe("The UUID of the catalogue item to update (required)"),
      name: z.string().min(1).optional().describe("The item name"),
      category: z.string().min(1).optional().describe("The item category - free text grouping"),
      price_min: z.number().int().optional().describe("Minimum price in cents"),
      price_max: z.number().int().optional().describe("Maximum price in cents"),
      image: z.string().nullable().optional().describe("Image URL"),
      unit: z.string().nullable().optional().describe("Unit of measurement"),
    },
    async ({ id, name, category, price_min, price_max, image, unit }) => {
      try {
        const siteId = requireSiteContext();

        // Verify item exists in current site
        const existingItems = (await sql`
          SELECT id FROM configurator_price_catalogue WHERE id = ${id} AND site_id = ${siteId}
        `) as { id: string }[];

        if (existingItems.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Price catalogue item with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        // Fetch current item to merge values
        const currentItem = (await sql`
          SELECT name, category, image, price_min, price_max, unit
          FROM configurator_price_catalogue WHERE id = ${id}
        `) as CatalogueItem[];

        const current = currentItem[0];

        const finalName = name !== undefined ? name : current.name;
        const finalCategory = category !== undefined ? category : current.category;
        const finalImage = image !== undefined ? image : current.image;
        const finalPriceMin = price_min !== undefined ? price_min : current.price_min;
        const finalPriceMax = price_max !== undefined ? price_max : current.price_max;
        const finalUnit = unit !== undefined ? unit : current.unit;

        const result = (await sql`
          UPDATE configurator_price_catalogue
          SET
            name = ${finalName},
            category = ${finalCategory},
            image = ${finalImage},
            price_min = ${finalPriceMin},
            price_max = ${finalPriceMax},
            unit = ${finalUnit},
            updated_at = NOW()
          WHERE id = ${id} AND site_id = ${siteId}
          RETURNING id, site_id, name, category, image, price_min, price_max, unit, created_at, updated_at
        `) as CatalogueItem[];

        const item = result[0];

        return {
          content: [
            {
              type: "text" as const,
              text: `Price catalogue item updated successfully:\n\n${JSON.stringify(item, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error updating price catalogue item: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: delete_catalogue_item
  server.tool(
    "delete_catalogue_item",
    "Delete a price catalogue item by ID.",
    {
      id: z.string().describe("The UUID of the catalogue item to delete"),
    },
    async ({ id }) => {
      try {
        const siteId = requireSiteContext();

        // Verify item exists and get its name for the success message
        const existingItems = (await sql`
          SELECT id, name FROM configurator_price_catalogue WHERE id = ${id} AND site_id = ${siteId}
        `) as { id: string; name: string }[];

        if (existingItems.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Price catalogue item with ID "${id}" not found in the current site.`,
              },
            ],
            isError: true,
          };
        }

        const itemName = existingItems[0].name;

        // Delete the item
        await sql`
          DELETE FROM configurator_price_catalogue WHERE id = ${id} AND site_id = ${siteId}
        `;

        return {
          content: [
            {
              type: "text" as const,
              text: `Price catalogue item "${itemName}" (ID: ${id}) has been deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error deleting price catalogue item: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
