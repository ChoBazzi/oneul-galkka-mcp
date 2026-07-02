import { describe, expect, it } from "vitest";
import { handleGetAreaStatus, handleRecommendOutingPlan } from "../src/tools/handlers.js";

function parseToolText(result: { content: Array<{ type: "text"; text: string }> }) {
  return JSON.parse(result.content[0].text) as Record<string, unknown>;
}

describe("tool handlers", () => {
  it("returns a structured unsupported-area response", () => {
    const result = parseToolText(handleGetAreaStatus({ areaName: "부산" }));

    expect(result.ok).toBe(false);
    expect(result.supportedAreas).toContain("성수/서울숲");
  });

  it("returns a primary recommendation and alternatives", () => {
    const result = parseToolText(
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

  it("rejects unsupported origin areas for recommendations", () => {
    const result = parseToolText(
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

  it("rejects unsupported target areas instead of falling back to all areas", () => {
    const result = parseToolText(
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
