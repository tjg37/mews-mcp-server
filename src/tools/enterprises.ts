import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MewsClient } from "../types/mews.js";

export function registerEnterpriseTools(server: McpServer, mews: MewsClient) {
  server.tool(
    "mews_get_enterprises",
    "List all enterprises (properties) linked to the current access token. " +
      "Useful for multi-property setups to discover available properties and their IDs.",
    {},
    async () => {
      const result = await mews.request("enterprises/getAll");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
