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
