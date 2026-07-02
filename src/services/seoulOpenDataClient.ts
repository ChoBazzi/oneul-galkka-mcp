import type { AirQuality, AreaStatus, CrowdLevel, TransitFriction, WeatherCondition } from "../types.js";

interface SeoulCityDataResponse {
  RESULT?: {
    "RESULT.CODE"?: string;
    "RESULT.MESSAGE"?: string;
  };
  CITYDATA?: {
    AREA_NM?: string;
    AREA_CD?: string;
    LIVE_PPLTN_STTS?: Array<{
      AREA_CONGEST_LVL?: string;
      AREA_CONGEST_MSG?: string;
      PPLTN_TIME?: string;
    }>;
    ROAD_TRAFFIC_STTS?: {
      AVG_ROAD_DATA?: {
        ROAD_MSG?: string;
        ROAD_TRAFFIC_IDX?: string;
        ROAD_TRAFFIC_TIME?: string;
      };
    };
    WEATHER_STTS?: Array<{
      WEATHER_TIME?: string;
      TEMP?: string;
      PRECPT_TYPE?: string;
      PCP_MSG?: string;
      SKY_STTS?: string;
      PM25_INDEX?: string;
      PM10_INDEX?: string;
      AIR_IDX?: string;
      AIR_MSG?: string;
    }>;
    EVENT_STTS?: unknown[];
  };
}

export interface SeoulOpenDataConfig {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface SeoulCityDataArea {
  providerAreaName: string;
  providerAreaCode?: string;
}

function encodePathSegment(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "%20");
}

function mapCrowdLevel(value: string | undefined): CrowdLevel {
  switch (value) {
    case "여유":
      return "LOW";
    case "보통":
      return "MEDIUM";
    case "약간 붐빔":
      return "HIGH";
    case "붐빔":
      return "VERY_HIGH";
    default:
      return "MEDIUM";
  }
}

function mapTransitFriction(value: string | undefined): TransitFriction {
  switch (value) {
    case "원활":
      return "LOW";
    case "서행":
      return "MEDIUM";
    case "정체":
      return "HIGH";
    default:
      return "MEDIUM";
  }
}

function mapWeather(value: {
  PRECPT_TYPE?: string;
  SKY_STTS?: string;
  TEMP?: string;
}): WeatherCondition {
  const temp = Number(value.TEMP);

  if (value.PRECPT_TYPE && value.PRECPT_TYPE !== "없음") {
    return "RAIN";
  }

  if (Number.isFinite(temp) && temp >= 32) {
    return "HEAT";
  }

  if (Number.isFinite(temp) && temp <= 0) {
    return "COLD";
  }

  if (value.SKY_STTS === "맑음") {
    return "CLEAR";
  }

  return "CLOUDY";
}

function mapAirQuality(value: {
  AIR_IDX?: string;
  PM10_INDEX?: string;
  PM25_INDEX?: string;
}): AirQuality {
  const levels = [value.AIR_IDX, value.PM10_INDEX, value.PM25_INDEX].filter(Boolean);

  if (levels.some((level) => level === "나쁨" || level === "매우나쁨")) {
    return "BAD";
  }

  if (levels.some((level) => level === "보통")) {
    return "NORMAL";
  }

  return "GOOD";
}

function latestUpdatedAt(
  populationTime: string | undefined,
  roadTime: string | undefined,
  weatherTime: string | undefined
): string {
  return weatherTime ?? roadTime ?? populationTime ?? new Date().toISOString();
}

export class SeoulOpenDataClient {
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(config: SeoulOpenDataConfig = {}) {
    this.apiKey = config.apiKey ?? process.env.SEOUL_OPEN_DATA_API_KEY;
    this.baseUrl = (config.baseUrl ?? process.env.SEOUL_OPEN_DATA_BASE_URL ?? "http://openapi.seoul.go.kr:8088").replace(
      /\/$/,
      ""
    );
    this.timeoutMs = config.timeoutMs ?? Number(process.env.SEOUL_OPEN_DATA_TIMEOUT_MS ?? 3000);
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  get hasApiKey(): boolean {
    return Boolean(this.apiKey);
  }

  async fetchAreaStatus(seed: AreaStatus, area: SeoulCityDataArea): Promise<AreaStatus> {
    if (!this.apiKey) {
      throw new Error("SEOUL_OPEN_DATA_API_KEY is not configured.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const lookupValue = area.providerAreaCode ?? area.providerAreaName;
    const url = `${this.baseUrl}/${this.apiKey}/json/citydata/1/5/${encodePathSegment(lookupValue)}`;

    try {
      const response = await this.fetchImpl(url, {
        signal: controller.signal,
        headers: {
          accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Seoul Open Data request failed with HTTP ${response.status}.`);
      }

      const body = (await response.json()) as SeoulCityDataResponse;
      const resultCode = body.RESULT?.["RESULT.CODE"];
      if (resultCode && resultCode !== "INFO-000") {
        throw new Error(body.RESULT?.["RESULT.MESSAGE"] ?? `Seoul Open Data result code ${resultCode}.`);
      }

      return mapCityDataToAreaStatus(seed, area.providerAreaName, body);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function mapCityDataToAreaStatus(
  seed: AreaStatus,
  providerAreaName: string,
  response: SeoulCityDataResponse
): AreaStatus {
  const cityData = response.CITYDATA;
  if (!cityData) {
    throw new Error("Seoul Open Data response did not include CITYDATA.");
  }

  const population = cityData.LIVE_PPLTN_STTS?.[0];
  const road = cityData.ROAD_TRAFFIC_STTS?.AVG_ROAD_DATA;
  const weather = cityData.WEATHER_STTS?.[0] ?? {};

  return {
    ...seed,
    crowdLevel: mapCrowdLevel(population?.AREA_CONGEST_LVL),
    weather: mapWeather(weather),
    airQuality: mapAirQuality(weather),
    transitFriction: mapTransitFriction(road?.ROAD_TRAFFIC_IDX),
    liveEventCount: cityData.EVENT_STTS?.length ?? 0,
    updatedAt: latestUpdatedAt(population?.PPLTN_TIME, road?.ROAD_TRAFFIC_TIME, weather.WEATHER_TIME),
    source: "seoul_open_data",
    dataProviderAreaName: cityData.AREA_NM ?? providerAreaName,
    dataProviderAreaCode: cityData.AREA_CD,
    statusMessage: population?.AREA_CONGEST_MSG,
    weatherMessage: weather.PCP_MSG ?? weather.AIR_MSG,
    transitMessage: road?.ROAD_MSG
  };
}
