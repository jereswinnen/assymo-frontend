import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sql } from "../db.js";
import { requireSiteContext } from "../context.js";

// Types
interface SiteParameters {
  id: number;
  site_id: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  vat_number: string | null;
  updated_at: string;
}

export function registerParameterTools(server: McpServer): void {
  // Tool: get_parameters
  server.tool(
    "get_parameters",
    "Get site parameters (contact info, social links, etc.) for the current site.",
    {},
    async () => {
      try {
        const siteId = requireSiteContext();

        const params = (await sql`
          SELECT id, site_id, address, phone, email, instagram, facebook, vat_number, updated_at
          FROM site_parameters
          WHERE site_id = ${siteId}
        `) as SiteParameters[];

        if (params.length === 0) {
          // Return empty/null values if no row exists
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    site_id: siteId,
                    address: null,
                    phone: null,
                    email: null,
                    instagram: null,
                    facebook: null,
                    vat_number: null,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(params[0], null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error getting parameters: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool: update_parameters
  server.tool(
    "update_parameters",
    "Update site parameters (contact info, social links, etc.) for the current site. Uses upsert behavior - creates row if it doesn't exist.",
    {
      address: z.string().nullable().optional().describe("Physical address"),
      phone: z.string().nullable().optional().describe("Phone number"),
      email: z.string().nullable().optional().describe("Email address"),
      instagram: z
        .string()
        .nullable()
        .optional()
        .describe("Instagram URL or handle"),
      facebook: z
        .string()
        .nullable()
        .optional()
        .describe("Facebook URL or handle"),
      vat_number: z
        .string()
        .nullable()
        .optional()
        .describe("VAT/BTW number"),
    },
    async ({ address, phone, email, instagram, facebook, vat_number }) => {
      try {
        const siteId = requireSiteContext();

        // Check if row exists
        const existing = (await sql`
          SELECT id, address, phone, email, instagram, facebook, vat_number
          FROM site_parameters
          WHERE site_id = ${siteId}
        `) as SiteParameters[];

        let result: SiteParameters[];

        if (existing.length === 0) {
          // Insert new row
          result = (await sql`
            INSERT INTO site_parameters (site_id, address, phone, email, instagram, facebook, vat_number)
            VALUES (
              ${siteId},
              ${address ?? null},
              ${phone ?? null},
              ${email ?? null},
              ${instagram ?? null},
              ${facebook ?? null},
              ${vat_number ?? null}
            )
            RETURNING id, site_id, address, phone, email, instagram, facebook, vat_number, updated_at
          `) as SiteParameters[];
        } else {
          // Update existing row - merge provided values with existing
          const current = existing[0];

          const finalAddress = address !== undefined ? address : current.address;
          const finalPhone = phone !== undefined ? phone : current.phone;
          const finalEmail = email !== undefined ? email : current.email;
          const finalInstagram =
            instagram !== undefined ? instagram : current.instagram;
          const finalFacebook =
            facebook !== undefined ? facebook : current.facebook;
          const finalVatNumber =
            vat_number !== undefined ? vat_number : current.vat_number;

          result = (await sql`
            UPDATE site_parameters
            SET
              address = ${finalAddress},
              phone = ${finalPhone},
              email = ${finalEmail},
              instagram = ${finalInstagram},
              facebook = ${finalFacebook},
              vat_number = ${finalVatNumber},
              updated_at = NOW()
            WHERE site_id = ${siteId}
            RETURNING id, site_id, address, phone, email, instagram, facebook, vat_number, updated_at
          `) as SiteParameters[];
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Parameters updated successfully:\n\n${JSON.stringify(result[0], null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text" as const,
              text: `Error updating parameters: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
