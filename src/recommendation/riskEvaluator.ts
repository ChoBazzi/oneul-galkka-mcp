import type { AreaStatus } from "../types.js";

export type OutingRiskDecision = "GO" | "CAUTION" | "AVOID";

export interface OutingRiskResult {
  areaName: string;
  decision: OutingRiskDecision;
  riskScore: number;
  reasons: string[];
  warnings: string[];
  suggestedActions: string[];
  alternatives: Array<{
    areaName: string;
    decision: OutingRiskDecision;
    riskScore: number;
    reasons: string[];
  }>;
  status: Pick<
    AreaStatus,
    "crowdLevel" | "weather" | "airQuality" | "transitFriction" | "liveEventCount" | "source" | "updatedAt"
  >;
}

const crowdRisk = {
  LOW: 0,
  MEDIUM: 12,
  HIGH: 30,
  VERY_HIGH: 45
} as const;

const weatherRisk = {
  CLEAR: 0,
  CLOUDY: 4,
  RAIN: 24,
  HEAT: 26,
  COLD: 22
} as const;

const airRisk = {
  GOOD: 0,
  NORMAL: 6,
  BAD: 20
} as const;

const transitRisk = {
  LOW: 0,
  MEDIUM: 8,
  HIGH: 20
} as const;

function decisionFromScore(score: number): OutingRiskDecision {
  if (score >= 60) {
    return "AVOID";
  }

  if (score >= 25) {
    return "CAUTION";
  }

  return "GO";
}

function riskScore(status: AreaStatus): number {
  const rawScore =
    crowdRisk[status.crowdLevel] +
    weatherRisk[status.weather] +
    airRisk[status.airQuality] +
    transitRisk[status.transitFriction] -
    Math.min(status.liveEventCount, 5);

  return Math.max(0, Math.min(100, rawScore));
}

function buildReasons(status: AreaStatus): string[] {
  return [
    `혼잡도 ${status.crowdLevel}`,
    `날씨 ${status.weather}`,
    `대기질 ${status.airQuality}`,
    `대중교통 부담 ${status.transitFriction}`,
    ...(status.liveEventCount > 0 ? [`실시간 문화행사 ${status.liveEventCount}개 확인`] : [])
  ];
}

function buildWarnings(status: AreaStatus): string[] {
  const warnings: string[] = [];

  if (status.crowdLevel === "HIGH" || status.crowdLevel === "VERY_HIGH") {
    warnings.push(`현재 혼잡도 ${status.crowdLevel}`);
  }

  if (status.weather === "RAIN" || status.weather === "HEAT" || status.weather === "COLD") {
    warnings.push(`현재 ${status.weather} 조건`);
  }

  if (status.airQuality === "BAD") {
    warnings.push("대기질이 나쁨");
  }

  if (status.transitFriction === "HIGH") {
    warnings.push("대중교통 이동 부담이 큼");
  }

  return warnings;
}

function buildSuggestedActions(decision: OutingRiskDecision, warnings: string[]): string[] {
  if (decision === "GO") {
    return ["지금 방문해도 무리가 적습니다.", "운영시간과 예약 가능 여부만 마지막으로 확인하세요."];
  }

  if (decision === "CAUTION") {
    return ["실내 장소를 우선하고 이동 시간을 여유 있게 잡으세요.", ...warnings.slice(0, 2)];
  }

  return ["지금은 방문을 미루거나 대안 권역을 검토하세요.", "실내 중심 코스나 덜 붐비는 권역을 우선하세요."];
}

export function evaluateOutingRisk(status: AreaStatus, allStatuses: AreaStatus[] = []): OutingRiskResult {
  const score = riskScore(status);
  const decision = decisionFromScore(score);
  const warnings = buildWarnings(status);
  const alternatives = allStatuses
    .filter((candidate) => candidate.areaKey !== status.areaKey)
    .map((candidate) => ({
      areaName: candidate.areaName,
      decision: decisionFromScore(riskScore(candidate)),
      riskScore: riskScore(candidate),
      reasons: buildReasons(candidate).slice(0, 3)
    }))
    .filter((candidate) => candidate.riskScore < score)
    .sort((a, b) => a.riskScore - b.riskScore)
    .slice(0, 3);

  return {
    areaName: status.areaName,
    decision,
    riskScore: score,
    reasons: buildReasons(status),
    warnings,
    suggestedActions: buildSuggestedActions(decision, warnings),
    alternatives,
    status: {
      crowdLevel: status.crowdLevel,
      weather: status.weather,
      airQuality: status.airQuality,
      transitFriction: status.transitFriction,
      liveEventCount: status.liveEventCount,
      source: status.source,
      updatedAt: status.updatedAt
    }
  };
}
