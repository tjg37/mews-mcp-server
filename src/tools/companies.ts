import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MewsClient } from "../types/mews.js";

export function registerCompanyTools(server: McpServer, mews: MewsClient) {
  server.tool(
    "mews_get_companies",
    "Get company profiles from Mews. Filter by company IDs or retrieve all companies. " +
      "Returns company name, contact details, billing info, and tax ID.",
    {
      companyIds: z
        .array(z.string().uuid())
        .optional()
        .describe("Filter by specific company UUIDs"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(1000)
        .optional()
        .default(100)
        .describe("Max results per page (default 100)"),
      cursor: z
        .string()
        .optional()
        .describe("Pagination cursor from a previous response"),
    },
    async (params) => {
      const body: Record<string, unknown> = {
        Limitation: {
          Count: params.limit,
          ...(params.cursor ? { Cursor: params.cursor } : {}),
        },
      };

      if (params.companyIds) body.CompanyIds = params.companyIds;

      const result = await mews.request("companies/getAll", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "mews_add_company",
    "Create a new company profile in Mews. Provide the company name and optionally " +
      "tax ID, billing address, and contact details.",
    {
      name: z.string().describe("Company name (required)"),
      taxIdentifier: z.string().optional().describe("Tax identification number (e.g., VAT number)"),
      email: z.string().optional().describe("Company email address"),
      phone: z.string().optional().describe("Company phone number"),
      notes: z.string().optional().describe("Notes about the company"),
    },
    async (params) => {
      const body: Record<string, unknown> = {
        Name: params.name,
      };

      if (params.taxIdentifier) body.TaxIdentifier = params.taxIdentifier;
      if (params.email) body.Email = params.email;
      if (params.phone) body.Phone = params.phone;
      if (params.notes) body.Notes = params.notes;

      const result = await mews.request("companies/add", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
