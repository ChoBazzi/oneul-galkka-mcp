# Oneul Galkka MCP

`오늘갈까 MCP` is a TypeScript MCP server for recommending low-friction Seoul outing plans.

It is designed for Kakao Tools / PlayMCP style agent usage: the AI asks this server whether an outing is a good idea right now, and the server returns structured recommendations with crowd, weather, transit, and companion-fit reasons.

## 한국어 요약

`오늘갈까 MCP`는 사용자가 카카오 AI에게 “지금 어디 갈까?”라고 물었을 때, 서울 주요 권역의 혼잡도, 날씨, 대중교통 부담, 동행자 조건을 바탕으로 외출 코스를 추천하는 MCP 서버입니다.

지도 앱처럼 최단 경로를 찾는 서비스가 아니라, **지금 이 외출을 해도 괜찮은지** 판단하는 생활형 도구입니다.

## Current MVP

- Supports five Seoul areas:
  - 성수/서울숲
  - 홍대/연남
  - 여의도
  - 잠실
  - 광화문/종로
- Works without API keys using seed fallback data.
- Exposes both:
  - STDIO MCP server for local client testing
  - Streamable HTTP MCP endpoint for remote deployment

## Quick Start

```bash
npm install
npm test
npm run build
```

Run local STDIO MCP mode:

```bash
npm run build
node build/server.js
```

Run Streamable HTTP mode:

```bash
npm run dev:http
```

Default HTTP endpoints:

```text
POST /mcp
GET /health
```

## Tools

### `get_area_status`

Checks outing conditions for a supported Seoul area.

Example intent:

```text
지금 여의도 가도 괜찮아?
```

### `find_good_places_now`

Finds places that match starting area, companion, duration, crowd avoidance, and indoor preference.

Example intent:

```text
성수에서 출발해서 2시간 안에 덜 붐비는 실내 데이트 장소 찾아줘
```

### `recommend_outing_plan`

Recommends 1-3 actionable outing plans with reasons, warnings, and alternatives.

Example intent:

```text
비 오는데 아이랑 갈 만한 덜 붐비는 서울 코스 추천해줘
```

## Scripts

```bash
npm install
npm test
npm run typecheck
npm run build
```

Run STDIO mode:

```bash
node build/server.js
```

Run HTTP mode:

```bash
npm run dev:http
```

The HTTP endpoint defaults to:

```text
POST /mcp
GET /health
```

Configure deployment:

```bash
PORT=8080 MCP_HOST=0.0.0.0 MCP_ENDPOINT_PATH=/mcp npm run start:http
```

Restrict accepted Host headers when deploying behind a known domain:

```bash
MCP_ALLOWED_HOSTS=oneul.example.com,localhost npm run start:http
```

## Docker

```bash
docker build -t oneul-galkka-mcp:local .
docker run --rm -p 8080:8080 oneul-galkka-mcp:local
```

Health check:

```bash
curl http://localhost:8080/health
```

## Public Data Roadmap

The MVP currently uses seed data shaped like public data responses. The next implementation slice should connect:

- Seoul Real-time City Data: crowd, transport, weather/environment, events
- Seoul cultural event data
- Optional weather/air-quality fallback APIs

The recommendation engine is already isolated from data adapters, so live API integration should replace `src/services/areaStatusService.ts` and add event/place adapter services without changing MCP tool contracts.

## Safety Notes

- No personal data is stored.
- API keys must be provided through environment variables only.
- STDIO mode writes server errors to stderr, not stdout, so JSON-RPC messages are not corrupted.
- Use `node build/server.js` or the package binary in MCP client config. Avoid plain `npm run dev` in STDIO client config because npm can print lifecycle banners to stdout.
- Seed fallback responses include a note that they are not live data.
