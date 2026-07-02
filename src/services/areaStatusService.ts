import { areaStatuses } from "../data/areas.js";
import type { AreaStatus } from "../types.js";

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
