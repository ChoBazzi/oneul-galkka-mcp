export type AreaKey = "seoul-forest" | "hongdae" | "yeouido" | "jamsil" | "gwanghwamun";

export type CrowdLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export type TransitFriction = "LOW" | "MEDIUM" | "HIGH";

export type WeatherCondition = "CLEAR" | "CLOUDY" | "RAIN" | "HEAT" | "COLD";

export type AirQuality = "GOOD" | "NORMAL" | "BAD";

export type Companion = "solo" | "date" | "friends" | "family" | "child" | "parents";

export type PlaceType = "park" | "museum" | "cafe" | "mall" | "walk" | "event" | "heritage";

export interface LiveEvent {
  name: string;
  period?: string;
  place?: string;
  isFree?: boolean;
  url?: string;
}

export interface AreaStatus {
  areaKey: AreaKey;
  areaName: string;
  aliases: string[];
  crowdLevel: CrowdLevel;
  weather: WeatherCondition;
  airQuality: AirQuality;
  transitFriction: TransitFriction;
  liveEventCount: number;
  liveEvents?: LiveEvent[];
  updatedAt: string;
  source: "seed" | "seoul_open_data";
  dataProviderAreaName?: string;
  dataProviderAreaCode?: string;
  statusMessage?: string;
  weatherMessage?: string;
  transitMessage?: string;
}

export interface Place {
  id: string;
  name: string;
  areaKey: AreaKey;
  type: PlaceType;
  isIndoor: boolean;
  goodFor: Companion[];
  minDurationMinutes: number;
  typicalDurationMinutes: number;
  costLevel: "FREE" | "LOW" | "MEDIUM";
  transitFriction: TransitFriction;
  notes: string[];
}

export interface PlaceCandidate {
  place: Place;
  areaStatus: AreaStatus;
  score: number;
  reasons: string[];
  warnings: string[];
}

export interface OutingPlan {
  title: string;
  areaName: string;
  durationMinutes: number;
  score: number;
  summary: string;
  stops: Array<{
    name: string;
    type: PlaceType;
    durationMinutes: number;
    reason: string;
  }>;
  liveEvents?: LiveEvent[];
  reasons: string[];
  warnings: string[];
}

export interface RecommendationInput {
  originArea: string;
  targetArea?: string;
  companion: Companion;
  durationHours: number;
  mood?: string;
  constraints?: string[];
  areaStatuses?: AreaStatus[];
}
