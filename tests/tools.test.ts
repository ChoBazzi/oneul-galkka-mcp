import { beforeEach, describe, expect, it } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "../src/tools/registerTools.js";
import { handleGetAreaStatus, handleRecommendOutingPlan } from "../src/tools/handlers.js";

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
