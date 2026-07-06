import { beforeEach, describe, expect, it } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "../src/tools/registerTools.js";
import { SeoulOpenDataClient } from "../src/services/seoulOpenDataClient.js";
import { resolveLiveAreaStatuses } from "../src/services/areaStatusService.js";
import {
  handleCheckOutingRisk,
  handleFindEventsNow,
  handleGetAreaStatus,
  handleRecommendOutingPlan
} from "../src/tools/handlers.js";

async function parseToolText(result: Promise<{ content: Array<{ type: "text"; text: string }> }>) {
  const resolved = await result;

  return JSON.parse(resolved.content[0].text) as Record<string, unknown>;
}

describe("tool handlers", () => {
  beforeEach(() => {
    delete process.env.SEOUL_OPEN_DATA_API_KEY;
  });

  it("returns a structured unsupported-area response", async () => {
    const result = await parseToolText(handleGetAreaStatus({ areaName: "부산" }));

    expect(result.ok).toBe(false);
    expect(result.supportedAreas).toContain("성수/서울숲");
    expect(result.supportedAreas).toContain("강남역");
    expect(result.supportedAreas).toContain("DDP/동대문");
  });

  it("supports expanded Seoul areas", async () => {
    const statusResult = await parseToolText(handleGetAreaStatus({ areaName: "강남" }));
    const planResult = await parseToolText(
      handleRecommendOutingPlan({
        originArea: "서울역",
        targetArea: "DDP",
        companion: "friends",
        durationHours: 3,
        mood: "전시"
      })
    );

    expect(statusResult.ok).toBe(true);
    expect((statusResult.status as { areaName?: string }).areaName).toBe("강남역");
    expect(planResult.ok).toBe(true);
    expect((planResult.recommendation as { areaName?: string }).areaName).toBe("DDP/동대문");
  });

  it("returns a primary recommendation and alternatives", async () => {
    const result = await parseToolText(
      handleRecommendOutingPlan({
        originArea: "성수",
        companion: "date",
        durationHours: 2,
        constraints: ["덜 붐빔"]
      })
    );

    expect(result.ok).toBe(true);
    expect(result.recommendation).toBeTruthy();
    expect(Array.isArray(result.alternatives)).toBe(true);
  });

  it("rejects unsupported origin areas for recommendations", async () => {
    const result = await parseToolText(
      handleRecommendOutingPlan({
        originArea: "부산",
        companion: "date",
        durationHours: 2
      })
    );

    expect(result.ok).toBe(false);
    expect(result.code).toBe("UNSUPPORTED_AREA");
    expect(result.field).toBe("originArea");
  });

  it("rejects unsupported target areas instead of falling back to all areas", async () => {
    const result = await parseToolText(
      handleRecommendOutingPlan({
        originArea: "성수",
        targetArea: "부산",
        companion: "date",
        durationHours: 2
      })
    );

    expect(result.ok).toBe(false);
    expect(result.code).toBe("UNSUPPORTED_AREA");
    expect(result.field).toBe("targetArea");
  });

  it("returns event lookup results for a supported area", async () => {
    const result = await parseToolText(handleFindEventsNow({ areaName: "광화문", freeOnly: false, limit: 5 }));

    expect(result.ok).toBe(false);
    expect(result.code).toBe("LIVE_DATA_API_KEY_MISSING");
    expect(result.areaName).toBe("광화문");
    expect(Array.isArray(result.events)).toBe(true);
    expect(result.requiresLiveData).toBe(true);
    expect(result.retryable).toBe(false);
    expect(result.message).toContain("실시간 행사 목록");
    expect(result.message).toContain("API 키");
  });

  it("rejects unsupported areas for event lookup", async () => {
    const result = await parseToolText(handleFindEventsNow({ areaName: "부산" }));

    expect(result.ok).toBe(false);
    expect(result.code).toBe("UNSUPPORTED_AREA");
    expect(result.field).toBe("areaName");
  });

  it("explains live event connection failures without falling back to mock events", async () => {
    const result = await resolveLiveAreaStatuses(["광화문"], {
      client: new SeoulOpenDataClient({
        apiKey: "test-key",
        fetchImpl: async () => {
          throw new Error("network down");
        }
      })
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("LIVE_DATA_REQUEST_FAILED");
      expect(result.retryable).toBe(true);
      expect(result.message).toContain("잠시 후 다시 시도");
      expect(result.statuses[0].source).toBe("seed");
    }
  });

  it("returns an outing risk decision for a supported area", async () => {
    const result = await parseToolText(handleCheckOutingRisk({ areaName: "여의도" }));

    expect(result.ok).toBe(true);
    expect(result.areaName).toBe("여의도");
    expect(["GO", "CAUTION", "AVOID"]).toContain(result.decision);
    expect(typeof result.riskScore).toBe("number");
    expect(Array.isArray(result.reasons)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(Array.isArray(result.alternatives)).toBe(true);
  });

  it("rejects unsupported areas for risk checks", async () => {
    const result = await parseToolText(handleCheckOutingRisk({ areaName: "부산" }));

    expect(result.ok).toBe(false);
    expect(result.code).toBe("UNSUPPORTED_AREA");
    expect(result.field).toBe("areaName");
  });
});

describe("tool metadata", () => {
  it("defines PlayMCP-compatible descriptions and annotations", () => {
    const registeredTools: Array<{
      name: string;
      config: {
        description?: string;
        annotations?: Record<string, unknown>;
      };
    }> = [];

    const server = {
      registerTool(name: string, config: { description?: string; annotations?: Record<string, unknown> }) {
        registeredTools.push({ name, config });
      }
    } as unknown as McpServer;

    registerTools(server);

    expect(registeredTools.map((tool) => tool.name)).toEqual([
      "get_area_status",
      "check_outing_risk",
      "find_events_now",
      "find_good_places_now",
      "recommend_outing_plan"
    ]);

    for (const tool of registeredTools) {
      expect(tool.config.description).toContain("오늘갈까");
      expect(tool.config.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      });
    }
  });
});
