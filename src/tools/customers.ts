import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MewsClient } from "../types/mews.js";

export function registerCustomerTools(server: McpServer, mews: MewsClient) {
  server.tool(
    "mews_get_customers",
    "Get customers from Mews by IDs, emails, or date range. " +
      "Returns customer profiles with contact info, nationality, and loyalty details. " +
      "Use customerIds for specific lookups or a date range to find recently created/updated customers.",
    {
      customerIds: z
        .array(z.string().uuid())
        .optional()
        .describe("Filter by specific customer UUIDs"),
      emails: z
        .array(z.string())
        .optional()
        .describe("Filter by email addresses"),
      startUtc: z
        .string()
        .optional()
        .describe("Start of creation/update date range (ISO 8601 UTC)"),
      endUtc: z
        .string()
        .optional()
        .describe("End of creation/update date range (ISO 8601 UTC)"),
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

      if (params.customerIds) body.CustomerIds = params.customerIds;
      if (params.emails) body.Emails = params.emails;
      if (params.startUtc && params.endUtc) {
        body.CreatedUtc = { StartUtc: params.startUtc, EndUtc: params.endUtc };
      }

      const result = await mews.request("customers/getAll", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "mews_search_customers",
    "Full-text search for customers by name, email, or other details. " +
      "Returns matching customer profiles. Best for finding a customer when you only have partial info.",
    {
      name: z
        .string()
        .optional()
        .describe("Search by customer name (first, last, or full)"),
      email: z
        .string()
        .optional()
        .describe("Search by email address"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(1000)
        .optional()
        .default(100)
        .describe("Max results (default 100)"),
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

      if (params.name) body.Name = params.name;
      if (params.email) body.Email = params.email;

      const result = await mews.request("customers/search", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "mews_add_customer",
    "Create a new customer profile in Mews. At minimum, provide a last name. " +
      "Optionally include first name, email, phone, nationality, and more.",
    {
      lastName: z.string().describe("Customer last name (required)"),
      firstName: z.string().optional().describe("Customer first name"),
      email: z.string().optional().describe("Customer email address"),
      phone: z.string().optional().describe("Customer phone number"),
      nationalityCode: z
        .string()
        .optional()
        .describe("ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB', 'DE')"),
      notes: z.string().optional().describe("Notes about the customer"),
    },
    async (params) => {
      const body: Record<string, unknown> = {
        LastName: params.lastName,
      };

      if (params.firstName) body.FirstName = params.firstName;
      if (params.email) body.Email = params.email;
      if (params.phone) body.Phone = params.phone;
      if (params.nationalityCode) body.NationalityCode = params.nationalityCode;
      if (params.notes) body.Notes = params.notes;

      const result = await mews.request("customers/add", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "mews_update_customer",
    "Update an existing customer profile in Mews. Only provided fields are updated.",
    {
      customerId: z.string().uuid().describe("The customer UUID to update"),
      lastName: z.string().optional().describe("Updated last name"),
      firstName: z.string().optional().describe("Updated first name"),
      email: z.string().optional().describe("Updated email address"),
      phone: z.string().optional().describe("Updated phone number"),
      nationalityCode: z
        .string()
        .optional()
        .describe("Updated ISO 3166-1 alpha-2 country code"),
      notes: z.string().optional().describe("Updated notes"),
    },
    async (params) => {
      const body: Record<string, unknown> = {
        CustomerId: params.customerId,
      };

      if (params.lastName) body.LastName = { Value: params.lastName };
      if (params.firstName) body.FirstName = { Value: params.firstName };
      if (params.email) body.Email = { Value: params.email };
      if (params.phone) body.Phone = { Value: params.phone };
      if (params.nationalityCode) body.NationalityCode = { Value: params.nationalityCode };
      if (params.notes !== undefined) body.Notes = { Value: params.notes };

      const result = await mews.request("customers/update", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
