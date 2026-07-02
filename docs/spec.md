# Spec: Oneul Galkka MCP

## Objective

Build a TypeScript MCP server for the AGENTIC PLAYER 10 submission. The server helps everyday Kakao Tools users decide where to go in Seoul right now by combining area context, crowd avoidance, weather sensitivity, companion type, and transit friction.

Working product name: `오늘갈까 MCP`.

## MVP User Stories

- As a user in Seoul, I can ask whether a target area is a good idea right now.
- As a user with limited time, I can ask for a 1-4 hour outing plan from a starting area.
- As a user avoiding crowds or rain, I can receive alternatives with explicit reasons.

## Tech Stack

- Node.js 20+
- TypeScript
- `@modelcontextprotocol/sdk` v1.x
- Zod v3 for tool input validation
- Vitest for unit tests

## Commands

- Install: `npm install`
- Build: `npm run build`
- Test: `npm test`
- Typecheck: `npm run typecheck`
- Dev STDIO MCP server: `npm --silent run dev`
- Dev HTTP MCP server: `npm run dev:http`
- Start built STDIO server: `node build/server.js`
- Start built HTTP server: `npm run start:http`

## Project Structure

- `src/server.ts` - STDIO MCP server entrypoint.
- `src/httpServer.ts` - Streamable HTTP MCP endpoint for remote deployment.
- `src/mcpServer.ts` - Shared MCP server factory.
- `src/tools/` - Tool registration and tool handlers.
- `src/recommendation/` - Pure scoring and plan-building logic.
- `src/services/` - Public-data adapter boundaries.
- `src/data/` - MVP seed data for Seoul areas and places.
- `tests/` - Unit tests for recommendation behavior and tool handlers.
- `docs/` - Product and submission notes.

## MCP Tools

### `get_area_status`

Returns current-ish area status for one supported Seoul area.

Inputs:
- `areaName`: Seoul area name or alias.

Output:
- Structured JSON text containing crowd level, weather, air quality, transit friction, recommended use cases, and data freshness.

### `find_good_places_now`

Returns places or areas that match a starting area and constraints.

Inputs:
- `originArea`
- `companion`: `solo`, `date`, `friends`, `family`, `child`, `parents`
- `durationHours`: 1-8
- `avoidCrowd`: boolean
- `indoorPreferred`: boolean

Output:
- Ranked candidates with score, travel effort, and reason codes.

### `recommend_outing_plan`

Returns 1-3 concise outing plans.

Inputs:
- `originArea`
- `targetArea` optional
- `companion`
- `durationHours`
- `mood` optional
- `constraints` optional string list

Output:
- Recommended plans, why they were chosen, warnings, and alternatives to avoid.

## Boundaries

- Always: validate tool inputs, keep recommendation logic deterministic, return reasons with every recommendation.
- Ask first: adding paid APIs, storing personal data, requiring user identity/authentication.
- Never: commit API keys, claim real-time accuracy when using seed fallback data, write logs to stdout in STDIO mode.

## Success Criteria

- `npm test` passes.
- `npm run build` passes.
- MCP server exposes the three MVP tools.
- Recommendations explain crowd/weather/transit tradeoffs in Korean-friendly plain text.
- The server works without external API keys using seed fallback data.

## Public Data Plan

Phase 1 uses seed data shaped like public data responses. Phase 2 should connect adapters to Seoul Open Data Plaza APIs, especially Seoul Real-time City Data, which provides major-place crowd, transport, weather/environment, and event context.
