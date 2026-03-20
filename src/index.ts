import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMewsClient } from "./mews-client.js";
import { registerConfigurationTools } from "./tools/configuration.js";
import { registerReservationTools } from "./tools/reservations.js";
import { registerCustomerTools } from "./tools/customers.js";
import { registerCompanyTools } from "./tools/companies.js";
import { registerResourceTools } from "./tools/resources.js";
import { registerServiceTools } from "./tools/services.js";
import { registerAccountingTools } from "./tools/accounting.js";
import { registerPaymentTools } from "./tools/payments.js";
import { registerBillTools } from "./tools/bills.js";
import { registerEnterpriseTools } from "./tools/enterprises.js";
import { registerTaskTools } from "./tools/tasks.js";

const requiredEnvVars = ["MEWS_CLIENT_TOKEN", "MEWS_ACCESS_TOKEN"] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const mews = createMewsClient({
  platformUrl: process.env.MEWS_PLATFORM_URL || "https://api.mews.com",
  clientToken: process.env.MEWS_CLIENT_TOKEN!,
  accessToken: process.env.MEWS_ACCESS_TOKEN!,
  clientName: process.env.MEWS_CLIENT_NAME || "MewsMCP/1.0.0",
});

const server = new McpServer({
  name: "mews-connector",
  version: "0.1.0",
});

registerConfigurationTools(server, mews);
registerEnterpriseTools(server, mews);
registerReservationTools(server, mews);
registerCustomerTools(server, mews);
registerCompanyTools(server, mews);
registerResourceTools(server, mews);
registerServiceTools(server, mews);
registerAccountingTools(server, mews);
registerPaymentTools(server, mews);
registerBillTools(server, mews);
registerTaskTools(server, mews);

const transport = new StdioServerTransport();
await server.connect(transport);
