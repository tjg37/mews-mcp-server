import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MewsClient } from "../types/mews.js";

export function registerAccountingTools(server: McpServer, mews: MewsClient) {
  server.tool(
    "mews_get_accounting_items",
    "Get accounting items (revenue charges, payments, etc.) from Mews. " +
      "Filter by date range to see charges posted during a period. " +
      "Returns item details including amount, currency, type, and associated bill/customer.",
    {
      startUtc: z
        .string()
        .describe("Start of date range for posted charges (ISO 8601 UTC)"),
      endUtc: z
        .string()
        .describe("End of date range for posted charges (ISO 8601 UTC)"),
      accountingItemIds: z
        .array(z.string().uuid())
        .optional()
        .describe("Filter by specific accounting item UUIDs"),
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
        ConsumedUtc: {
          StartUtc: params.startUtc,
          EndUtc: params.endUtc,
        },
      };

      if (params.accountingItemIds) body.AccountingItemIds = params.accountingItemIds;

      const result = await mews.request("accountingItems/getAll", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
