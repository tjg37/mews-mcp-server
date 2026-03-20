# mews-mcp-server

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP_SDK-1.12+-purple.svg)](https://modelcontextprotocol.io/)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that connects Claude to the [Mews Connector API](https://docs.mews.com/connector-api) — the property management system used by thousands of hotels worldwide.

Ask Claude to look up reservations, search guests, check room availability, pull accounting data, and more — all through natural conversation.

## What is this?

This is a **local MCP server** that runs on your machine and acts as a bridge between Claude (via Claude Desktop or Claude Code) and the Mews hospitality platform. It exposes Mews API operations as MCP tools that Claude can call during conversation.

**Example interactions:**
- "Show me all check-ins for next week"
- "Find the reservation for John Smith"
- "What rooms are available in the Deluxe category?"
- "Pull the accounting items for March"

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- A Mews account with API credentials ([demo credentials](#demo-credentials) available for testing)
- [Claude Desktop](https://claude.ai/download) or [Claude Code](https://docs.anthropic.com/en/docs/claude-code)

### Install

```bash
git clone https://github.com/tjg37/mews-mcp-server.git
cd mews-mcp-server
npm install
npm run build
```

### Configure Claude Desktop

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mews": {
      "command": "node",
      "args": ["/absolute/path/to/mews-mcp-server/dist/index.js"],
      "env": {
        "MEWS_CLIENT_TOKEN": "your-client-token",
        "MEWS_ACCESS_TOKEN": "your-access-token",
        "MEWS_CLIENT_NAME": "YourApp/1.0.0",
        "MEWS_PLATFORM_URL": "https://api.mews.com"
      }
    }
  }
}
```

Restart Claude Desktop. You should see a MCP indicator in the conversation input area.

### Configure Claude Code

```bash
claude mcp add mews \
  -e MEWS_CLIENT_TOKEN=your-client-token \
  -e MEWS_ACCESS_TOKEN=your-access-token \
  -e MEWS_CLIENT_NAME=YourApp/1.0.0 \
  -e MEWS_PLATFORM_URL=https://api.mews.com \
  -- node /absolute/path/to/mews-mcp-server/dist/index.js
```

### Development mode (no build step)

For local development, use `tsx` to run TypeScript directly:

```json
{
  "mcpServers": {
    "mews": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/mews-mcp-server/src/index.ts"],
      "env": { "..." : "..." }
    }
  }
}
```

## Demo Credentials

Mews provides shared demo properties for development. Copy `.env.example` to `.env` — it includes working demo tokens for the **Net Pricing** test property.

```bash
cp .env.example .env
```

> **Note**: Demo tokens are shared across all developers and subject to rate limits. If you get `429` responses, try the Gross Pricing demo property or wait a few minutes. See [Mews demo environments](https://docs.mews.com/connector-api/guidelines/environments) for all available test properties.

## Authentication

Mews uses static token authentication (no OAuth). Every API request includes two tokens in the request body:

| Credential | Source | Purpose |
|-----------|--------|---------|
| `ClientToken` | Issued by Mews when you register as an integration partner | Identifies your application |
| `AccessToken` | Issued per-property by the property admin in Mews Operations | Identifies which hotel/property to connect to |
| `Client` | You choose it | A name + version string for your application |

**To get production credentials:**
1. Register as a [Mews integration partner](https://www.mews.com/en/products/api)
2. Mews issues your `ClientToken`
3. Each property you want to connect provides their `AccessToken`

**Multi-property setups:** Run separate instances with different `MEWS_ACCESS_TOKEN` values, or use a [Portfolio Access Token](https://docs.mews.com/connector-api/concepts/multi-property) and pass `EnterpriseId` per tool call.

## Available Tools

### Configuration
| Tool | Description |
|------|-------------|
| `mews_get_configuration` | Get property details, services, timezone, and pricing model |
| `mews_get_enterprises` | List all linked properties (multi-property support) |

### Reservations
| Tool | Description |
|------|-------------|
| `mews_get_reservations` | List reservations filtered by dates, states, customer IDs |
| `mews_add_reservations` | Create new reservations |
| `mews_update_reservation` | Modify an existing reservation |
| `mews_cancel_reservation` | Cancel a reservation |

### Customers
| Tool | Description |
|------|-------------|
| `mews_get_customers` | List customers by IDs, emails, or date range |
| `mews_search_customers` | Full-text search for active customers |
| `mews_add_customer` | Create a new customer profile |
| `mews_update_customer` | Update customer details |

### Companies
| Tool | Description |
|------|-------------|
| `mews_get_companies` | List company profiles |
| `mews_add_company` | Create a new company |

### Resources (Rooms & Spaces)
| Tool | Description |
|------|-------------|
| `mews_get_resources` | Get rooms/spaces with state and assignments |
| `mews_get_resource_categories` | Get room types and categories |

### Services & Rates
| Tool | Description |
|------|-------------|
| `mews_get_services` | List all services (Accommodation, etc.) |
| `mews_get_rates` | Get rate plans |
| `mews_get_rate_pricing` | Get actual pricing for date ranges |

### Accounting & Billing
| Tool | Description |
|------|-------------|
| `mews_get_accounting_items` | Revenue items and charges |
| `mews_get_payments` | Payment records |
| `mews_get_bills` | Guest bills and folios |

### Tasks
| Tool | Description |
|------|-------------|
| `mews_get_tasks` | List tasks (housekeeping, maintenance, etc.) |
| `mews_add_task` | Create a new task |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MEWS_CLIENT_TOKEN` | Yes | — | Your Mews integration client token |
| `MEWS_ACCESS_TOKEN` | Yes | — | Property-specific access token |
| `MEWS_CLIENT_NAME` | No | `MewsMCP/1.0.0` | Application name sent with requests |
| `MEWS_PLATFORM_URL` | No | `https://api.mews.com` | Mews API base URL |

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run smoke test against demo API
npm run test:smoke

# Lint
npm run lint

# Format
npm run format
```

## Architecture

```
Claude Desktop / Claude Code
       |
       | stdio (JSON-RPC)
       v
  +-------------+
  |  MCP Server  |  <- @modelcontextprotocol/sdk
  |  (index.ts)  |
  +------+-------+
         |  registers tools
         v
  +-------------+
  |  Tool files  |  <- src/tools/*.ts (one per domain)
  +------+-------+
         |  calls
         v
  +-------------+
  | Mews Client  |  <- src/mews-client.ts (auth injection, error handling, pagination)
  +------+-------+
         |  HTTPS POST
         v
  +-------------+
  |  Mews API   |  <- https://api.mews.com/api/connector/v1/*
  +-------------+
```

All Mews API operations are **POST** requests with authentication tokens in the JSON body (not headers). The Mews client layer handles injecting credentials, error mapping, and cursor-based pagination.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)

## Disclaimer

This project is not affiliated with, endorsed by, or officially connected to [Mews Systems](https://www.mews.com/). "Mews" is a trademark of Mews Systems. This is an independent, community-built integration.
