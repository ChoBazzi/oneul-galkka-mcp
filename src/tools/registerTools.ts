import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  checkOutingRiskInputSchema,
  findEventsNowInputSchema,
  findGoodPlacesNowInputSchema,
  getAreaStatusInputSchema,
  recommendOutingPlanInputSchema
} from "./schemas.js";
import {
  handleCheckOutingRisk,
  handleFindEventsNow,
  handleFindGoodPlacesNow,
  handleGetAreaStatus,
  handleRecommendOutingPlan
} from "./handlers.js";

const readOnlyLiveContextAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true
} as const;

export function registerTools(server: McpServer) {
  server.registerTool(
    "get_area_status",
    {
      description:
        "오늘갈까: 서울 주요 권역의 현재 외출 컨디션을 확인합니다. 혼잡도, 날씨/대기질, 대중교통 부담, 행사 후보를 반환합니다.",
      inputSchema: getAreaStatusInputSchema,
      annotations: readOnlyLiveContextAnnotations
    },
    async (input) => handleGetAreaStatus(input)
  );

  server.registerTool(
    "check_outing_risk",
    {
      description:
        "오늘갈까: 서울 권역의 현재 혼잡도, 날씨, 대기질, 대중교통 부담을 종합해 지금 가도 되는지 GO, CAUTION, AVOID로 판단합니다.",
      inputSchema: checkOutingRiskInputSchema,
      annotations: readOnlyLiveContextAnnotations
    },
    async (input) => handleCheckOutingRisk(input)
  );

  server.registerTool(
    "find_events_now",
    {
      description:
        "오늘갈까: 서울 주요 권역의 실시간 문화행사를 찾습니다. 권역, 무료 여부, 반환 개수를 기준으로 현재 확인 가능한 행사 상세를 반환합니다.",
      inputSchema: findEventsNowInputSchema,
      annotations: readOnlyLiveContextAnnotations
    },
    async (input) => handleFindEventsNow(input)
  );

  server.registerTool(
    "find_good_places_now",
    {
      description:
        "오늘갈까: 출발 권역, 동행자, 시간, 혼잡 회피/실내 선호 조건에 맞춰 지금 가기 좋은 서울 장소 후보를 찾습니다.",
      inputSchema: findGoodPlacesNowInputSchema,
      annotations: readOnlyLiveContextAnnotations
    },
    async (input) => handleFindGoodPlacesNow(input)
  );

  server.registerTool(
    "recommend_outing_plan",
    {
      description:
        "오늘갈까: 사용자의 출발지와 조건을 바탕으로 오늘 바로 실행 가능한 서울 외출 코스를 추천합니다. 지도 경로 탐색이 아니라 혼잡도, 날씨, 대중교통 부담을 반영한 의사결정 도구입니다.",
      inputSchema: recommendOutingPlanInputSchema,
      annotations: readOnlyLiveContextAnnotations
    },
    async (input) => handleRecommendOutingPlan(input)
  );
}
