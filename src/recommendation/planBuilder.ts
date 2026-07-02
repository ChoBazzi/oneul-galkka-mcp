import { places } from "../data/places.js";
import { findAreaStatus, listAreaStatuses } from "../services/areaStatusService.js";
import type { AreaStatus, Companion, OutingPlan, PlaceCandidate, RecommendationInput } from "../types.js";
import { scorePlace, type ScoreOptions } from "./scoring.js";

export interface FindCandidatesInput {
  originArea: string;
  companion: Companion;
  durationHours: number;
  avoidCrowd: boolean;
  indoorPreferred: boolean;
  targetArea?: string;
  constraints?: string[];
  areaStatuses?: AreaStatus[];
}

const travelPenaltyByOrigin: Record<string, Partial<Record<string, number>>> = {
  "seoul-forest": {
    "seoul-forest": 0,
    hongdae: 10,
    yeouido: 18,
    jamsil: 12,
    gwanghwamun: 8
  },
  hongdae: {
    hongdae: 0,
    yeouido: 10,
    gwanghwamun: 12,
    "seoul-forest": 14,
    jamsil: 22
  },
  yeouido: {
    yeouido: 0,
    hongdae: 10,
    gwanghwamun: 14,
    "seoul-forest": 18,
    jamsil: 24
  },
  jamsil: {
    jamsil: 0,
    "seoul-forest": 12,
    gwanghwamun: 18,
    yeouido: 24,
    hongdae: 24
  },
  gwanghwamun: {
    gwanghwamun: 0,
    "seoul-forest": 8,
    hongdae: 12,
    yeouido: 14,
    jamsil: 18
  }
};

function applyOriginAdjustment(candidate: PlaceCandidate, originArea: string): PlaceCandidate {
  const originStatus = findAreaStatus(originArea);
  if (!originStatus) {
    return candidate;
  }

  const penalty = travelPenaltyByOrigin[originStatus.areaKey]?.[candidate.areaStatus.areaKey] ?? 16;
  const reasons = [...candidate.reasons];
  const warnings = [...candidate.warnings];

  if (penalty === 0) {
    reasons.push("출발 권역 안에서 이동 부담이 가장 낮음");
  } else if (penalty <= 10) {
    reasons.push(`${originStatus.areaName} 출발 기준 이동 부담이 낮음`);
  } else if (penalty >= 20) {
    warnings.push(`${originStatus.areaName} 출발 기준 이동 부담이 큼`);
  }

  return {
    ...candidate,
    score: Math.max(0, candidate.score - penalty),
    reasons,
    warnings
  };
}

function buildCandidatePool(input: FindCandidatesInput): PlaceCandidate[] {
  const targetStatus = input.targetArea ? findAreaStatus(input.targetArea) : undefined;
  const availableStatuses = input.areaStatuses ?? listAreaStatuses();
  const statuses = targetStatus
    ? availableStatuses.filter((status) => status.areaKey === targetStatus.areaKey)
    : availableStatuses;
  const statusByKey = new Map(statuses.map((status) => [status.areaKey, status]));

  const options: ScoreOptions = {
    companion: input.companion,
    durationHours: input.durationHours,
    avoidCrowd: input.avoidCrowd,
    indoorPreferred: input.indoorPreferred,
    constraints: input.constraints
  };

  return places
    .filter((place) => statusByKey.has(place.areaKey))
    .map((place) => scorePlace(place, statusByKey.get(place.areaKey)!, options))
    .map((candidate) => applyOriginAdjustment(candidate, input.originArea))
    .sort((a, b) => b.score - a.score);
}

export function findGoodPlacesNow(input: FindCandidatesInput): PlaceCandidate[] {
  return buildCandidatePool(input).slice(0, 6);
}

function toStop(candidate: PlaceCandidate) {
  const bestReason = candidate.reasons[0] ?? "조건에 맞는 후보";

  return {
    name: candidate.place.name,
    type: candidate.place.type,
    durationMinutes: candidate.place.typicalDurationMinutes,
    reason: bestReason
  };
}

function liveEventReason(areaStatus: AreaStatus): string | undefined {
  if (areaStatus.liveEventCount <= 0) {
    return undefined;
  }

  return `실시간 문화행사 ${areaStatus.liveEventCount}개 확인`;
}

export function recommendOutingPlans(input: RecommendationInput): OutingPlan[] {
  const constraints = input.constraints ?? [];
  const wantsIndoor =
    constraints.some((constraint) => constraint.includes("비") || constraint.toLowerCase().includes("indoor")) ||
    input.mood?.includes("실내") ||
    false;

  const candidates = findGoodPlacesNow({
    originArea: input.originArea,
    targetArea: input.targetArea,
    companion: input.companion,
    durationHours: input.durationHours,
    avoidCrowd: true,
    indoorPreferred: wantsIndoor,
    constraints,
    areaStatuses: input.areaStatuses
  });

  const grouped = new Map<string, PlaceCandidate[]>();
  for (const candidate of candidates) {
    const existing = grouped.get(candidate.areaStatus.areaKey) ?? [];
    existing.push(candidate);
    grouped.set(candidate.areaStatus.areaKey, existing);
  }

  return [...grouped.values()]
    .map((areaCandidates) => {
      const primary = areaCandidates[0];
      const secondary = areaCandidates[1];
      const stops = [primary, secondary].filter(Boolean).map(toStop);
      const durationMinutes = Math.min(
        input.durationHours * 60,
        stops.reduce((sum, stop) => sum + stop.durationMinutes, 0)
      );

      const warnings = [...new Set(areaCandidates.flatMap((candidate) => candidate.warnings))].slice(0, 4);
      const eventReason = liveEventReason(primary.areaStatus);
      const reasonCandidates = [
        ...(eventReason ? [eventReason] : []),
        ...areaCandidates.flatMap((candidate) => candidate.reasons)
      ];
      const reasons = [...new Set(reasonCandidates)].slice(0, 5);
      const liveEvents = primary.areaStatus.liveEvents?.slice(0, 3);

      return {
        title: `${primary.areaStatus.areaName} ${primary.place.isIndoor ? "실내 중심" : "가벼운 외출"} 코스`,
        areaName: primary.areaStatus.areaName,
        durationMinutes,
        score: Math.round(areaCandidates.reduce((sum, candidate) => sum + candidate.score, 0) / areaCandidates.length),
        summary: `${primary.areaStatus.areaName}은 현재 혼잡도 ${primary.areaStatus.crowdLevel}, 대중교통 부담 ${primary.areaStatus.transitFriction}입니다.`,
        stops,
        liveEvents,
        reasons,
        warnings
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
