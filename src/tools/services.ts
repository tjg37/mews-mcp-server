import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MewsClient } from "../types/mews.js";

export function registerServiceTools(server: McpServer, mews: MewsClient) {
  server.tool(
    "mews_get_services",
    "Get all services offered by the property (e.g., Accommodation, Spa, F&B). " +
      "The Accommodation service ID is needed for creating reservations and looking up rates.",
    {
      serviceIds: z
        .array(z.string().uuid())
        .optional()
        .describe("Filter by specific service UUIDs"),
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

      if (params.serviceIds) body.ServiceIds = params.serviceIds;

      const result = await mews.request("services/getAll", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "mews_get_rates",
    "Get rate plans for a service. Returns rate names, pricing type, and whether the rate " +
      "is public or private. Use the rate ID when creating reservations.",
    {
      serviceId: z
        .string()
        .uuid()
        .optional()
        .describe("Filter rates by service ID"),
      rateIds: z
        .array(z.string().uuid())
        .optional()
        .describe("Filter by specific rate UUIDs"),
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

      if (params.serviceId) body.ServiceId = params.serviceId;
      if (params.rateIds) body.RateIds = params.rateIds;

      const result = await mews.request("rates/getAll", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "mews_get_rate_pricing",
    "Get actual pricing for a rate plan over a date range. Returns per-night prices " +
      "by room category. Useful for quoting rates to guests or checking availability pricing.",
    {
      rateId: z
        .string()
        .uuid()
        .describe("The rate plan UUID to get pricing for"),
      startUtc: z
        .string()
        .describe("Start date for pricing (ISO 8601 UTC)"),
      endUtc: z
        .string()
        .describe("End date for pricing (ISO 8601 UTC)"),
    },
    async (params) => {
      const body: Record<string, unknown> = {
        RateId: params.rateId,
        Interval: {
          StartUtc: params.startUtc,
          EndUtc: params.endUtc,
        },
      };

      const result = await mews.request("rates/getPricing", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
