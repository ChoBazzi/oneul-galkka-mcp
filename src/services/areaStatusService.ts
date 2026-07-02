import { areaStatuses } from "../data/areas.js";
import type { AreaKey, AreaStatus } from "../types.js";
import { SeoulOpenDataClient, type SeoulCityDataArea } from "./seoulOpenDataClient.js";

export const seoulCityDataAreas: Record<AreaKey, SeoulCityDataArea> = {
  "seoul-forest": {
    providerAreaName: "서울숲공원"
  },
  hongdae: {
    providerAreaName: "홍대 관광특구"
  },
  yeouido: {
    providerAreaName: "여의도한강공원"
  },
  jamsil: {
    providerAreaName: "잠실 관광특구"
  },
  gwanghwamun: {
    providerAreaName: "광화문·덕수궁"
  }
};

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function findAreaStatus(areaName: string): AreaStatus | undefined {
  const normalized = normalize(areaName);

  return areaStatuses.find((area) => {
    if (normalize(area.areaName).includes(normalized)) {
      return true;
    }

    return area.aliases.some((alias) => normalize(alias) === normalized);
  });
}

export function listAreaStatuses(): AreaStatus[] {
  return [...areaStatuses];
}

export function listSupportedAreaNames(): string[] {
  return areaStatuses.map((area) => area.areaName);
}

export function listSeoulCityDataAreas(): Array<AreaStatus & SeoulCityDataArea> {
  return areaStatuses.map((area) => ({
    ...area,
    ...seoulCityDataAreas[area.areaKey]
  }));
}

export interface ResolveAreaStatusOptions {
  client?: SeoulOpenDataClient;
}

export async function resolveAreaStatus(
  areaName: string,
  options: ResolveAreaStatusOptions = {}
): Promise<AreaStatus | undefined> {
  const seed = findAreaStatus(areaName);
  if (!seed) {
    return undefined;
  }

  const client = options.client ?? new SeoulOpenDataClient();
  if (!client.hasApiKey) {
    return seed;
  }

  try {
    return await client.fetchAreaStatus(seed, seoulCityDataAreas[seed.areaKey]);
  } catch (error) {
    console.error(`Falling back to seed area status for ${seed.areaName}:`, error);
    return {
      ...seed,
      statusMessage: "서울 실시간 도시데이터 호출에 실패해 seed fallback 데이터를 사용했습니다."
    };
  }
}

export async function resolveAreaStatuses(
  areaNames?: string[],
  options: ResolveAreaStatusOptions = {}
): Promise<AreaStatus[]> {
  const targets = areaNames?.length ? areaNames : listSupportedAreaNames();
  const statuses = await Promise.all(targets.map((areaName) => resolveAreaStatus(areaName, options)));

  return statuses.filter((status): status is AreaStatus => Boolean(status));
}
