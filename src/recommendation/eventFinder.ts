import { findAreaStatus, listAreaStatuses } from "../services/areaStatusService.js";
import type { AreaStatus, LiveEvent } from "../types.js";

export interface FindEventsInput {
  areaName?: string;
  freeOnly?: boolean;
  limit?: number;
  areaStatuses?: AreaStatus[];
}

export interface EventCandidate extends LiveEvent {
  areaName: string;
  source: AreaStatus["source"];
  updatedAt: string;
  reasons: string[];
}

export function findEventsNow(input: FindEventsInput): EventCandidate[] {
  const limit = input.limit ?? 5;
  const availableStatuses = input.areaStatuses ?? listAreaStatuses();
  const targetStatus = input.areaName ? findAreaStatus(input.areaName) : undefined;
  const statuses = targetStatus
    ? availableStatuses.filter((status) => status.areaKey === targetStatus.areaKey)
    : availableStatuses;

  return statuses
    .flatMap((status) =>
      (status.liveEvents ?? []).map((event) => ({
        ...event,
        areaName: status.areaName,
        source: status.source,
        updatedAt: status.updatedAt,
        reasons: [
          `${status.areaName} 실시간 행사`,
          ...(event.isFree === true ? ["무료 행사"] : []),
          ...(event.place ? [`장소: ${event.place}`] : [])
        ]
      }))
    )
    .filter((event) => !input.freeOnly || event.isFree === true)
    .slice(0, limit);
}
