# Mews MCP Server — Project Plan (Open Source)

> **Purpose**: Build and open-source a local stdio MCP server in Node.js/TypeScript that exposes the Mews Connector API as tools for Claude Desktop and Claude Code.
>
> **Hand this file to Claude Code** in a fresh repo to scaffold the entire project, including all open-source files.

---

## 1. Project Structure

```
mews-mcp-server/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── index.ts              # Entry point — create McpServer, register tools, start stdio transport
│   ├── mews-client.ts        # Shared HTTP client: injects auth tokens, handles errors & pagination
│   ├── tools/
│   │   ├── configuration.ts  # mews_get_configuration
│   │   ├── reservations.ts   # mews_get_reservations, mews_add_reservations, mews_update_reservation, mews_cancel_reservation
│   │   ├── customers.ts      # mews_get_customers, mews_search_customers, mews_add_customer, mews_update_customer
│   │   ├── companies.ts      # mews_get_companies, mews_add_company
│   │   ├── resources.ts      # mews_get_resources (rooms/spaces), mews_get_resource_categories
│   │   ├── services.ts       # mews_get_services, mews_get_rates, mews_get_rate_pricing
│   │   ├── accounting.ts     # mews_get_accounting_items, mews_get_accounting_categories
│   │   ├── payments.ts       # mews_get_payments
│   │   ├── bills.ts          # mews_get_bills
│   │   ├── availability.ts   # mews_get_rate_pricing, mews_get_availability_blocks
│   │   ├── enterprises.ts    # mews_get_enterprises
│   │   └── tasks.ts          # mews_get_tasks, mews_add_task
│   └── types/
│       └── mews.ts           # Shared TypeScript interfaces (MewsResponse, Pagination, etc.)
├── test/
│   └── smoke.ts              # Standalone smoke test (calls mews_get_configuration against demo)
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── .prettierrc
├── LICENSE                   # MIT
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── CHANGELOG.md
```

---

## 2. README.md

Write a polished README with the following structure and content. Use clear, developer-friendly language. This is the public face of the project.

````markdown
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

Restart Claude Desktop. You should see a 🔌 MCP indicator in the conversation input area.

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
      "env": { ... }
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
       │
       │ stdio (JSON-RPC)
       ▼
  ┌─────────────┐
  │  MCP Server  │  ← @modelcontextprotocol/sdk
  │  (index.ts)  │
  └──────┬───────┘
         │  registers tools
         ▼
  ┌─────────────┐
  │  Tool files  │  ← src/tools/*.ts (one per domain)
  └──────┬───────┘
         │  calls
         ▼
  ┌─────────────┐
  │ Mews Client  │  ← src/mews-client.ts (auth injection, error handling, pagination)
  └──────┬───────┘
         │  HTTPS POST
         ▼
  ┌─────────────┐
  │  Mews API   │  ← https://api.mews.com/api/connector/v1/*
  └─────────────┘
```

All Mews API operations are **POST** requests with authentication tokens in the JSON body (not headers). The Mews client layer handles injecting credentials, error mapping, and cursor-based pagination.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)

## Disclaimer

This project is not affiliated with, endorsed by, or officially connected to [Mews Systems](https://www.mews.com/). "Mews" is a trademark of Mews Systems. This is an independent, community-built integration.
````

---

## 3. Open-Source Files

### LICENSE (MIT)

```
MIT License

Copyright (c) 2026 Terence Goldberg

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### CONTRIBUTING.md

```markdown
# Contributing to mews-mcp-server

Thanks for your interest in contributing! This project aims to be a high-quality, community-maintained MCP server for the Mews hospitality platform.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/tjg37/mews-mcp-server.git`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` (demo credentials are pre-filled)
5. Run in dev mode: `npm run dev`

## Adding a New Tool

The most common contribution is adding support for more Mews API endpoints. Here's how:

1. **Pick an endpoint** from the [Mews API Operations](https://docs.mews.com/connector-api/operations) page.
2. **Create or extend a tool file** in `src/tools/`. Group by domain (e.g., reservations, customers).
3. **Follow the existing pattern**: use Zod for input validation, include rich descriptions on the tool and every parameter, and return raw JSON from Mews.
4. **Register the tool** in `src/index.ts`.
5. **Test against the demo API** using `npm run test:smoke` or by connecting to Claude Desktop.
6. **Update the README** tools table.

### Tool naming convention

All tools are prefixed with `mews_` and use snake_case: `mews_get_reservations`, `mews_add_customer`, etc.

### Tool description guidelines

The tool description is what Claude reads to decide when and how to call it. Include:
- What the endpoint does
- What filters/parameters are available
- Valid enum values (e.g., reservation states)
- Any important caveats (pagination, date format, etc.)

## Pull Request Process

1. Create a feature branch: `git checkout -b feature/add-voucher-tools`
2. Make your changes
3. Run `npm run lint` and `npm run build` — both must pass
4. Write a clear PR description explaining what you added and why
5. Reference any related GitHub issues

## Code Style

- TypeScript strict mode
- Prettier for formatting (run `npm run format`)
- Prefer explicit types over `any`
- Use `z.describe()` on every Zod schema field

## Reporting Bugs

Please use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:
- Which tool you were calling
- The input parameters
- The error message or unexpected output
- Whether you're using demo or production credentials

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).
```

### CODE_OF_CONDUCT.md

Use the standard **Contributor Covenant v2.1** — generate the full text from https://www.contributor-covenant.org/version/2/1/code_of_conduct/ with contact method set to GitHub Issues.

### CHANGELOG.md

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-XX-XX

### Added
- Initial release with 20+ MCP tools covering core Mews Connector API operations
- Configuration, reservations, customers, companies, resources, services, rates, accounting, payments, bills, enterprises, and tasks
- Shared Mews HTTP client with auth injection, error handling, and cursor-based pagination
- Claude Desktop and Claude Code configuration support
- Demo credentials for immediate testing
```

---

## 4. GitHub Templates

### .github/ISSUE_TEMPLATE/bug_report.md

```markdown
---
name: Bug Report
about: Report a problem with the MCP server
title: "[Bug] "
labels: bug
assignees: ''
---

**Tool name**
Which MCP tool were you calling? (e.g., `mews_get_reservations`)

**Input parameters**
\```json
{
  "startUtc": "...",
  "endUtc": "..."
}
\```

**Expected behavior**
What should have happened?

**Actual behavior**
What happened instead? Include any error messages.

**Environment**
- OS: [e.g., macOS 15.2]
- Node.js version: [e.g., 22.1.0]
- Claude client: [e.g., Claude Desktop 1.x / Claude Code]
- Mews environment: [Demo / Production]

**Additional context**
Any other relevant information.
```

### .github/ISSUE_TEMPLATE/feature_request.md

```markdown
---
name: Feature Request
about: Suggest a new tool or improvement
title: "[Feature] "
labels: enhancement
assignees: ''
---

**Mews API endpoint**
Link to the endpoint in [Mews docs](https://docs.mews.com/connector-api/operations) (if applicable).

**Use case**
What would you use this tool for? What question would you ask Claude?

**Proposed tool name**
e.g., `mews_get_vouchers`

**Additional context**
Any other relevant details.
```

### .github/PULL_REQUEST_TEMPLATE.md

```markdown
## What does this PR do?

<!-- Brief description of changes -->

## Checklist

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] New tools follow the naming convention (`mews_` prefix, snake_case)
- [ ] Tool descriptions include parameter documentation
- [ ] README tools table is updated (if adding new tools)
- [ ] CHANGELOG.md is updated
```

---

## 5. CI Workflow

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20, 22]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

---

## 6. Additional Config Files

### .gitignore

```
node_modules/
dist/
.env
*.tgz
.DS_Store
```

### .prettierrc

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### .env.example

```bash
# Mews Connector API credentials
# These are the shared DEMO tokens (Net Pricing test property).
# See: https://docs.mews.com/connector-api/getting-started

MEWS_CLIENT_TOKEN=E0D439EE522F44368DC78E1BFB03710C-D24FB11DBE31D4621C4817E028D9E1D
MEWS_ACCESS_TOKEN=7059D2C25BF64EA681ACAB3A00B859CC-D91BFF2B1E3047A3E0DEC1D57BE1382
MEWS_CLIENT_NAME=MewsMCP/1.0.0

# Mews API base URL (same for demo and production)
MEWS_PLATFORM_URL=https://api.mews.com
```

---

## 7. package.json (Full)

```json
{
  "name": "mews-mcp-server",
  "version": "0.1.0",
  "description": "MCP server for the Mews Connector API — connect Claude to hotel property management",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts",
    "test:smoke": "tsx test/smoke.ts",
    "lint": "tsc --noEmit",
    "format": "prettier --write 'src/**/*.ts'",
    "format:check": "prettier --check 'src/**/*.ts'"
  },
  "keywords": [
    "mcp",
    "model-context-protocol",
    "mews",
    "hospitality",
    "pms",
    "hotel",
    "claude",
    "anthropic",
    "ai"
  ],
  "author": "Terence Goldberg",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/tjg37/mews-mcp-server"
  },
  "engines": {
    "node": ">=20.0.0"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "prettier": "^3.3.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

---

## 8. Mews HTTP Client (`src/mews-client.ts`)

All Mews API operations are **POST** requests with auth tokens in the JSON body. Build a shared client that:

1. **Injects credentials** — reads `MEWS_CLIENT_TOKEN`, `MEWS_ACCESS_TOKEN`, `MEWS_CLIENT_NAME` from `process.env` and merges them into every request body as `ClientToken`, `AccessToken`, `Client`.
2. **Constructs URLs** — `${MEWS_PLATFORM_URL}/api/connector/v1/{operationPath}`.
3. **Handles errors** — Mews returns structured errors. Map HTTP status codes:
   - `400` → client/request error
   - `401` → invalid tokens
   - `403` → business logic violation
   - `408` → request timeout (batch smaller)
   - `429` → rate limited (respect `Retry-After` header)
   - `500` → Mews server error
4. **Supports pagination** — Many Mews endpoints use cursor-based pagination with `Limitation: { Cursor, Count }`. Expose cursor as a pass-through; don't auto-paginate (let Claude decide).
5. **All dates in UTC** — Mews uses ISO 8601 UTC strings.

### Skeleton

```typescript
export interface MewsClientConfig {
  platformUrl: string;
  clientToken: string;
  accessToken: string;
  clientName: string;
}

export interface MewsClient {
  request<T = unknown>(path: string, body?: Record<string, unknown>): Promise<T>;
}

export function createMewsClient(config: MewsClientConfig): MewsClient {
  async function request<T = unknown>(
    path: string,
    body: Record<string, unknown> = {},
  ): Promise<T> {
    const url = `${config.platformUrl}/api/connector/v1/${path}`;
    const fullBody = {
      ClientToken: config.clientToken,
      AccessToken: config.accessToken,
      Client: config.clientName,
      ...body,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Mews API error ${response.status} on ${path}: ${JSON.stringify(error)}`,
      );
    }

    return response.json() as Promise<T>;
  }

  return { request };
}
```

---

## 9. Tool Definitions — Phase 1 (~20 tools)

Each tool is registered via `server.tool(name, description, schema, handler)`. Group by domain file. Use `zod` for input validation with `.describe()` on every field.

### Tool List

| Tool | Mews Endpoint | File |
|------|--------------|------|
| `mews_get_configuration` | `configuration/get` | `configuration.ts` |
| `mews_get_enterprises` | `enterprises/getAll` | `enterprises.ts` |
| `mews_get_reservations` | `reservations/getAll` | `reservations.ts` |
| `mews_add_reservations` | `reservations/add` | `reservations.ts` |
| `mews_update_reservation` | `reservations/update` | `reservations.ts` |
| `mews_cancel_reservation` | `reservations/cancel` | `reservations.ts` |
| `mews_get_customers` | `customers/getAll` | `customers.ts` |
| `mews_search_customers` | `customers/search` | `customers.ts` |
| `mews_add_customer` | `customers/add` | `customers.ts` |
| `mews_update_customer` | `customers/update` | `customers.ts` |
| `mews_get_companies` | `companies/getAll` | `companies.ts` |
| `mews_add_company` | `companies/add` | `companies.ts` |
| `mews_get_resources` | `resources/getAll` | `resources.ts` |
| `mews_get_resource_categories` | `resourceCategories/getAll` | `resources.ts` |
| `mews_get_services` | `services/getAll` | `services.ts` |
| `mews_get_rates` | `rates/getAll` | `services.ts` |
| `mews_get_rate_pricing` | `rates/getPricing` | `services.ts` |
| `mews_get_accounting_items` | `accountingItems/getAll` | `accounting.ts` |
| `mews_get_payments` | `payments/getAll` | `payments.ts` |
| `mews_get_bills` | `bills/getAll` | `bills.ts` |
| `mews_get_tasks` | `tasks/getAll` | `tasks.ts` |
| `mews_add_task` | `tasks/add` | `tasks.ts` |

### Implementation Pattern

Every tool follows the same pattern. Full example for `mews_get_reservations`:

```typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MewsClient } from "../mews-client.js";

export function registerReservationTools(server: McpServer, mews: MewsClient) {
  server.tool(
    "mews_get_reservations",
    "Get reservations from Mews, filtered by date range, state, customer IDs, or reservation IDs. " +
      "Returns reservation details including dates, state, assigned room, rate, and customer. " +
      "Use startUtc/endUtc for the reservation interval (check-in to check-out overlap). " +
      "States: Enquired, Requested, Optional, Confirmed, Started, Processed, Canceled.",
    {
      reservationIds: z
        .array(z.string().uuid())
        .optional()
        .describe("Filter by specific reservation UUIDs"),
      customerIds: z
        .array(z.string().uuid())
        .optional()
        .describe("Filter by customer UUIDs"),
      startUtc: z
        .string()
        .optional()
        .describe("Start of date range (ISO 8601 UTC). Reservations overlapping this range are returned."),
      endUtc: z
        .string()
        .optional()
        .describe("End of date range (ISO 8601 UTC)"),
      states: z
        .array(
          z.enum([
            "Enquired", "Requested", "Optional", "Confirmed",
            "Started", "Processed", "Canceled",
          ]),
        )
        .optional()
        .describe("Filter by reservation states"),
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

      if (params.reservationIds) body.ReservationIds = params.reservationIds;
      if (params.customerIds) body.CustomerIds = params.customerIds;
      if (params.states) body.States = params.states;
      if (params.startUtc && params.endUtc) {
        body.Interval = { StartUtc: params.startUtc, EndUtc: params.endUtc };
      }

      const result = await mews.request("reservations/getAll", body);

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ... mews_add_reservations, mews_update_reservation, mews_cancel_reservation
}
```

### Key implementation rules

1. **Rich descriptions** — The tool description is what Claude reads to decide when and how to call it. Include endpoint purpose, available filters, and valid enum values.
2. **Zod schemas with `.describe()`** — Every parameter needs a description. This is the schema Claude sees.
3. **Sensible defaults** — Default pagination limit to 100, omit optional params when not provided.
4. **Return raw JSON** — Let Claude interpret the full Mews response. Don't over-filter.
5. **Pagination cursor** — Always expose `cursor` as optional input and include the response cursor so Claude can paginate.
6. **Mews body key casing** — Mews uses PascalCase (`ReservationIds`, `StartUtc`). Tool params use camelCase. Map in the handler.

---

## 10. Entry Point (`src/index.ts`)

```typescript
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

// Register all tool groups
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
```

---

## 11. Smoke Test (`test/smoke.ts`)

```typescript
import { createMewsClient } from "../src/mews-client.js";

const mews = createMewsClient({
  platformUrl: process.env.MEWS_PLATFORM_URL || "https://api.mews.com",
  clientToken:
    process.env.MEWS_CLIENT_TOKEN ||
    "E0D439EE522F44368DC78E1BFB03710C-D24FB11DBE31D4621C4817E028D9E1D",
  accessToken:
    process.env.MEWS_ACCESS_TOKEN ||
    "7059D2C25BF64EA681ACAB3A00B859CC-D91BFF2B1E3047A3E0DEC1D57BE1382",
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
```

---

## 12. Phase 2 Expansion (Future)

Once Phase 1 is stable, natural additions:

| Domain | Tools | Use Case |
|--------|-------|----------|
| Availability | `mews_get_availability`, `mews_update_availability` | Revenue management |
| Outlet/POS | `mews_get_outlet_items`, `mews_get_outlets` | F&B and POS data |
| Messages | `mews_get_messages`, `mews_add_message` | Guest messaging |
| Exports | `mews_export_data` | Bulk data export |
| Vouchers | `mews_get_vouchers`, `mews_add_voucher` | Promo/discount codes |
| Loyalty | `mews_get_loyalty_memberships` | Loyalty program data |
| Identity Docs | `mews_get_identity_documents` | Check-in documentation |
| Source Assignments | `mews_get_source_assignments` | Booking source tracking |
| Availability Blocks | `mews_get_availability_blocks`, `mews_add_availability_block` | Group/allotment blocks |

---

## 13. OpenAPI Spec Reference

The full OpenAPI 3.0.4 spec is at:

```
https://api.mews.com/Swagger/connector/swagger.yaml
```

Use for verifying request/response schemas, auto-generating TypeScript types, and validating tool input schemas.

### Optional: Generate types from spec

```bash
npx openapi-typescript https://api.mews.com/Swagger/connector/swagger.yaml -o src/types/mews-api.d.ts
```

---

## 14. Testing Checklist

Before first release:

- [ ] `npm run build` compiles cleanly
- [ ] `npm run lint` passes
- [ ] `npm run test:smoke` succeeds against demo API
- [ ] Claude Desktop shows MCP indicator after restart
- [ ] `mews_get_configuration` returns property details
- [ ] `mews_get_reservations` with date range returns data
- [ ] `mews_search_customers` with a name returns results
- [ ] All 20+ tools are visible in Claude's tool list
- [ ] README accurately reflects all available tools
- [ ] GitHub Actions CI passes on push
- [ ] `.env.example` has correct demo tokens
- [ ] No secrets committed to the repo
