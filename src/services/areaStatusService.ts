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
  },
  gangnam: {
    providerAreaName: "강남역"
  },
  myeongdong: {
    providerAreaName: "명동 관광특구"
  },
  ddp: {
    providerAreaName: "DDP(동대문디자인플라자)"
  },
  "seoul-station": {
    providerAreaName: "서울역"
  },
  itaewon: {
    providerAreaName: "이태원 관광특구"
  },
  bukchon: {
    providerAreaName: "북촌한옥마을"
  },
  coex: {
    providerAreaName: "강남 MICE 관광특구"
  },
  namsan: {
    providerAreaName: "남산공원"
  },
  geondae: {
    providerAreaName: "건대입구역"
  },
  "express-bus-terminal": {
    providerAreaName: "고속터미널역"
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

export type ResolveLiveAreaStatusesResult =
  | {
      ok: true;
      statuses: AreaStatus[];
    }
  | {
      ok: false;
      code: "LIVE_DATA_API_KEY_MISSING" | "LIVE_DATA_REQUEST_FAILED";
      message: string;
      retryable: boolean;
      statuses: AreaStatus[];
    };

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

export async function resolveLiveAreaStatuses(
  areaNames?: string[],
  options: ResolveAreaStatusOptions = {}
): Promise<ResolveLiveAreaStatusesResult> {
  const seeds = (areaNames?.length ? areaNames : listSupportedAreaNames())
    .map((areaName) => findAreaStatus(areaName))
    .filter((status): status is AreaStatus => Boolean(status));
  const client = options.client ?? new SeoulOpenDataClient();

  if (!client.hasApiKey) {
    return {
      ok: false,
      code: "LIVE_DATA_API_KEY_MISSING",
      message: "실시간 행사 목록을 조회하려면 서울 열린데이터 API 키가 필요합니다.",
      retryable: false,
      statuses: seeds
    };
  }

  try {
    const statuses = await Promise.all(
      seeds.map((seed) => client.fetchAreaStatus(seed, seoulCityDataAreas[seed.areaKey]))
    );

    return {
      ok: true,
      statuses
    };
  } catch (error) {
    console.error("Seoul live event data request failed:", error);
    return {
      ok: false,
      code: "LIVE_DATA_REQUEST_FAILED",
      message: "서울 열린데이터 API 연결에 실패했습니다. 지금은 실시간 행사 목록을 제공할 수 없으니 잠시 후 다시 시도해 주세요.",
      retryable: true,
      statuses: seeds
    };
  }
}
