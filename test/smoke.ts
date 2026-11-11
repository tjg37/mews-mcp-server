import { createMewsClient } from "../src/mews-client.js";

const mews = createMewsClient({
  platformUrl: process.env.MEWS_PLATFORM_URL || "https://api.mews-demo.com",
  clientToken:
    process.env.MEWS_CLIENT_TOKEN ||
    "E0D439EE522F44368DC78E1BFB03710C-D24FB11DBE31D4621C4817E028D9E1D",
  accessToken:
    process.env.MEWS_ACCESS_TOKEN ||
    "4D6C7ABE0E6A4681B0AFB16900AE5D86-DF50CBC89E1D4FF5859DDF021649ED5",
  clientName: process.env.MEWS_CLIENT_NAME || "MewsMCP/1.0.0",
});

async function main() {
  console.log("Testing Mews API connection...\n");

  try {
    const config = await mews.request("configuration/get");
    console.log("configuration/get — Success");
    console.log(`  Property: ${(config as any).Enterprise?.Name}`);
    console.log(`  Timezone: ${(config as any).Enterprise?.TimeZoneIdentifier}\n`);
  } catch (e) {
    console.error("configuration/get — Failed:", (e as Error).message);
    process.exit(1);
  }

  try {
    const customers = await mews.request("customers/search", {
      Name: "Smith",
      Limitation: { Count: 3 },
    });
    console.log("customers/search — Success");
    console.log(`  Results: ${(customers as any).Results?.length ?? 0} customers\n`);
  } catch (e) {
    console.error("customers/search — Failed:", (e as Error).message);
  }

  console.log("Smoke test complete.");
}

main();
