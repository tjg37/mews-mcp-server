import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MewsClient } from "../types/mews.js";

export function registerConfigurationTools(server: McpServer, mews: MewsClient) {
  server.tool(
    "mews_get_configuration",
    "Get the property configuration from Mews, including property details, services, timezone, " +
      "pricing model, accepted currencies, and address. This is typically the first call to make " +
      "to understand the property setup.",
    {},
    async () => {
      const result = await mews.request("configuration/get");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
