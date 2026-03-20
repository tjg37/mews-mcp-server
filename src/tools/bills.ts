import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MewsClient } from "../types/mews.js";

export function registerBillTools(server: McpServer, mews: MewsClient) {
  server.tool(
    "mews_get_bills",
    "Get guest bills and folios from Mews. Filter by bill IDs, customer IDs, or date range. " +
      "Returns bill details including line items, total amount, and payment status.",
    {
      billIds: z
        .array(z.string().uuid())
        .optional()
        .describe("Filter by specific bill UUIDs"),
      customerIds: z
        .array(z.string().uuid())
        .optional()
        .describe("Filter by customer UUIDs"),
      startUtc: z
        .string()
        .optional()
        .describe("Start of date range (ISO 8601 UTC)"),
      endUtc: z
        .string()
        .optional()
        .describe("End of date range (ISO 8601 UTC)"),
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

      if (params.billIds) body.BillIds = params.billIds;
      if (params.customerIds) body.CustomerIds = params.customerIds;
      if (params.startUtc && params.endUtc) {
        body.CreatedUtc = { StartUtc: params.startUtc, EndUtc: params.endUtc };
      }

      const result = await mews.request("bills/getAll", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
