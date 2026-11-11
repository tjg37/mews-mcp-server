# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Demo setup: `.env.example` and the smoke test now use Mews's current Net Pricing demo access token (the old one returns `401`) and the demo environment, `https://api.mews-demo.com`, which the demo tokens require.

## [0.1.0] - 2026-XX-XX

### Added
- Initial release with 20+ MCP tools covering core Mews Connector API operations
- Configuration, reservations, customers, companies, resources, services, rates, accounting, payments, bills, enterprises, and tasks
- Shared Mews HTTP client with auth injection, error handling, and cursor-based pagination
- Claude Desktop and Claude Code configuration support
- Demo credentials for immediate testing
