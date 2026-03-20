import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MewsClient } from "../types/mews.js";

export function registerResourceTools(server: McpServer, mews: MewsClient) {
  server.tool(
    "mews_get_resources",
    "Get rooms, spaces, and other bookable resources from Mews. " +
      "Returns resource details including name, state (Dirty, Clean, Inspected, OutOfService, OutOfOrder), " +
      "current assignments, and resource category. Useful for checking room status and availability.",
    {
      resourceIds: z
        .array(z.string().uuid())
        .optional()
        .describe("Filter by specific resource UUIDs"),
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

      if (params.resourceIds) body.ResourceIds = params.resourceIds;

      const result = await mews.request("resources/getAll", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "mews_get_resource_categories",
    "Get room types and resource categories from Mews. " +
      "Returns category names (e.g., 'Deluxe Double', 'Standard Twin'), capacity, and pricing details. " +
      "Use to understand what room types are available at the property.",
    {
      resourceCategoryIds: z
        .array(z.string().uuid())
        .optional()
        .describe("Filter by specific resource category UUIDs"),
      serviceId: z
        .string()
        .uuid()
        .optional()
        .describe("Filter by service ID (e.g., Accommodation service)"),
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

      if (params.resourceCategoryIds) body.ResourceCategoryIds = params.resourceCategoryIds;
      if (params.serviceId) body.ServiceId = params.serviceId;

      const result = await mews.request("resourceCategories/getAll", body);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
