import { describe, expect, it } from "vitest";
import { findGoodPlacesNow, recommendOutingPlans } from "../src/recommendation/planBuilder.js";

describe("outing recommendations", () => {
  it("prioritizes low-crowd indoor plans when the user wants to avoid crowds in rain", () => {
    const plans = recommendOutingPlans({
      originArea: "성수",
      companion: "date",
      durationHours: 2,
      mood: "조용한 실내 데이트",
      constraints: ["비", "덜 붐빔"]
    });

    expect(plans.length).toBeGreaterThan(0);
    expect(plans[0].areaName).toBe("광화문/종로");
    expect(plans[0].stops[0].name).toContain("전시");
    expect(plans[0].reasons.join(" ")).toContain("실내");
  });

  it("returns target-area candidates even when the target is crowded", () => {
    const candidates = findGoodPlacesNow({
      originArea: "성수",
      targetArea: "여의도",
      companion: "family",
      durationHours: 3,
      avoidCrowd: true,
      indoorPreferred: true,
      constraints: ["비"]
    });

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every((candidate) => candidate.areaStatus.areaName === "여의도")).toBe(true);
    expect(candidates[0].place.isIndoor).toBe(true);
    expect(candidates[0].warnings.join(" ")).toContain("혼잡도");
  });

  it("keeps recommendations within the requested duration", () => {
    const plans = recommendOutingPlans({
      originArea: "잠실",
      companion: "child",
      durationHours: 2,
      constraints: ["유모차"]
    });

    expect(plans[0].durationMinutes).toBeLessThanOrEqual(120);
  });

  it("uses origin area as a scoring signal", () => {
    const nearOrigin = findGoodPlacesNow({
      originArea: "성수",
      targetArea: "성수",
      companion: "child",
      durationHours: 3,
      avoidCrowd: true,
      indoorPreferred: false
    });
    const farOrigin = findGoodPlacesNow({
      originArea: "잠실",
      targetArea: "성수",
      companion: "child",
      durationHours: 3,
      avoidCrowd: true,
      indoorPreferred: false
    });

    expect(nearOrigin[0].score).toBeGreaterThan(farOrigin[0].score);
    expect(nearOrigin[0].reasons.join(" ")).toContain("출발 권역");
  });
});
