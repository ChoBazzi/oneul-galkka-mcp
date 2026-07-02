import {
  findAreaStatus,
  listSupportedAreaNames,
  resolveAreaStatus,
  resolveAreaStatuses
} from "../services/areaStatusService.js";
import { findGoodPlacesNow, recommendOutingPlans, type FindCandidatesInput } from "../recommendation/planBuilder.js";
import type { RecommendationInput } from "../types.js";

function asTextJson(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

function unsupportedAreaResponse(areaName: string, field: "areaName" | "originArea" | "targetArea") {
  return asTextJson({
    ok: false,
    code: "UNSUPPORTED_AREA",
    field,
    areaName,
    message: "지원하지 않는 서울 권역입니다.",
    supportedAreas: listSupportedAreaNames()
  });
}

export async function handleGetAreaStatus(input: { areaName: string }) {
  const status = await resolveAreaStatus(input.areaName);

  if (!status) {
    return unsupportedAreaResponse(input.areaName, "areaName");
  }

  return asTextJson({
    ok: true,
    status,
    note:
      status.source === "seed"
        ? "현재 응답은 seed fallback 데이터입니다. 서울 열린데이터광장 API 연결 후 실시간 값으로 교체됩니다."
        : "서울 열린데이터광장 기반 상태입니다."
  });
}

export async function handleFindGoodPlacesNow(input: FindCandidatesInput) {
  if (!findAreaStatus(input.originArea)) {
    return unsupportedAreaResponse(input.originArea, "originArea");
  }

  if (input.targetArea && !findAreaStatus(input.targetArea)) {
    return unsupportedAreaResponse(input.targetArea, "targetArea");
  }

  const liveStatuses = await resolveAreaStatuses(input.targetArea ? [input.targetArea] : undefined);
  const candidates = findGoodPlacesNow({
    ...input,
    areaStatuses: liveStatuses
  }).map((candidate) => ({
    name: candidate.place.name,
    areaName: candidate.areaStatus.areaName,
    score: candidate.score,
    isIndoor: candidate.place.isIndoor,
    type: candidate.place.type,
    costLevel: candidate.place.costLevel,
    crowdLevel: candidate.areaStatus.crowdLevel,
    transitFriction: candidate.areaStatus.transitFriction,
    source: candidate.areaStatus.source,
    updatedAt: candidate.areaStatus.updatedAt,
    reasons: candidate.reasons,
    warnings: candidate.warnings
  }));

  return asTextJson({
    ok: true,
    originArea: input.originArea,
    candidates
  });
}

export async function handleRecommendOutingPlan(input: RecommendationInput) {
  if (!findAreaStatus(input.originArea)) {
    return unsupportedAreaResponse(input.originArea, "originArea");
  }

  if (input.targetArea && !findAreaStatus(input.targetArea)) {
    return unsupportedAreaResponse(input.targetArea, "targetArea");
  }

  const liveStatuses = await resolveAreaStatuses(input.targetArea ? [input.targetArea] : undefined);
  const plans = recommendOutingPlans({
    ...input,
    areaStatuses: liveStatuses
  });

  return asTextJson({
    ok: true,
    request: input,
    recommendation: plans[0] ?? null,
    alternatives: plans.slice(1),
    disclaimer: "운영시간, 예약 가능 여부, 실시간 교통은 방문 전 최종 확인이 필요합니다."
  });
}
