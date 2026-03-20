import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MewsClient } from "../types/mews.js";

export function registerPaymentTools(server: McpServer, mews: MewsClient) {
  server.tool(
    "mews_get_payments",
    "Get payment records from Mews. Filter by date range or specific payment IDs. " +
      "Returns payment details including amount, currency, type (CreditCard, Cash, Invoice, etc.), " +
      "and associated bill/customer.",
    {
      startUtc: z
        .string()
        .optional()
        .describe("Start of date range (ISO 8601 UTC)"),
      endUtc: z
        .string()
        .optional()
        .describe("End of date range (ISO 8601 UTC)"),
      paymentIds: z
        .array(z.string().uuid())
        .optional()
        .describe("Filter by specific payment UUIDs"),
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

      if (params.paymentIds) body.PaymentIds = params.paymentIds;
      if (params.startUtc && params.endUtc) {
        body.CreatedUtc = { StartUtc: params.startUtc, EndUtc: params.endUtc };
      }

      const result = await mews.request("payments/getAll", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
