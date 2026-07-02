import type {
  AreaStatus,
  Companion,
  Place,
  PlaceCandidate,
  TransitFriction,
  WeatherCondition
} from "../types.js";

export interface ScoreOptions {
  companion: Companion;
  durationHours: number;
  avoidCrowd: boolean;
  indoorPreferred: boolean;
  constraints?: string[];
}

const crowdPenalty = {
  LOW: 0,
  MEDIUM: 8,
  HIGH: 22,
  VERY_HIGH: 35
} as const;

const transitPenalty: Record<TransitFriction, number> = {
  LOW: 0,
  MEDIUM: 8,
  HIGH: 20
};

function isBadOutdoorWeather(weather: WeatherCondition): boolean {
  return weather === "RAIN" || weather === "HEAT" || weather === "COLD";
}

function includesConstraint(options: ScoreOptions, value: string): boolean {
  return options.constraints?.some((constraint) => constraint.toLowerCase().includes(value)) ?? false;
}

export function scorePlace(place: Place, areaStatus: AreaStatus, options: ScoreOptions): PlaceCandidate {
  let score = 60;
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (place.goodFor.includes(options.companion)) {
    score += 18;
    reasons.push(`${options.companion} 동행 조건에 맞음`);
  } else {
    score -= 18;
    warnings.push("동행자 조건과 완전히 맞지는 않음");
  }

  const availableMinutes = options.durationHours * 60;
  if (place.minDurationMinutes <= availableMinutes) {
    score += 12;
    reasons.push(`${options.durationHours}시간 안에 소화 가능`);
  } else {
    score -= 30;
    warnings.push("요청한 시간보다 오래 걸릴 수 있음");
  }

  if (options.avoidCrowd) {
    const penalty = crowdPenalty[areaStatus.crowdLevel];
    score -= penalty;
    if (areaStatus.crowdLevel === "LOW" || areaStatus.crowdLevel === "MEDIUM") {
      reasons.push(`현재 혼잡도 ${areaStatus.crowdLevel}`);
    } else {
      warnings.push(`현재 혼잡도 ${areaStatus.crowdLevel}`);
    }
  }

  if (options.indoorPreferred || includesConstraint(options, "비") || includesConstraint(options, "rain")) {
    if (place.isIndoor) {
      score += 14;
      reasons.push("실내 중심이라 날씨 영향을 덜 받음");
    } else {
      score -= 18;
      warnings.push("실외 장소라 날씨 영향을 받을 수 있음");
    }
  }

  if (!place.isIndoor && isBadOutdoorWeather(areaStatus.weather)) {
    score -= 25;
    warnings.push(`현재 ${areaStatus.weather} 조건에서는 실외 체류 리스크가 있음`);
  }

  if (areaStatus.airQuality === "GOOD") {
    score += 5;
    reasons.push("대기질이 좋음");
  } else if (areaStatus.airQuality === "BAD" && !place.isIndoor) {
    score -= 15;
    warnings.push("대기질이 나빠 실외 활동 만족도가 낮을 수 있음");
  }

  score -= transitPenalty[place.transitFriction];
  score -= transitPenalty[areaStatus.transitFriction] / 2;

  if (place.transitFriction === "LOW" && areaStatus.transitFriction === "LOW") {
    score += 10;
    reasons.push("대중교통 이동 부담이 낮음");
  } else if (place.transitFriction === "HIGH" || areaStatus.transitFriction === "HIGH") {
    warnings.push("대중교통 이동 부담이 큼");
  }

  if (areaStatus.liveEventCount > 0) {
    score += Math.min(areaStatus.liveEventCount, 5);
    reasons.push("주변 문화/행사 후보가 있음");
  }

  return {
    place,
    areaStatus,
    score: Math.max(0, Math.round(score)),
    reasons,
    warnings
  };
}
