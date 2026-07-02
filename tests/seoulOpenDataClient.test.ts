import { describe, expect, it } from "vitest";
import { areaStatuses } from "../src/data/areas.js";
import { mapCityDataToAreaStatus } from "../src/services/seoulOpenDataClient.js";

describe("Seoul Open Data mapping", () => {
  it("maps live city data into internal area status", () => {
    const status = mapCityDataToAreaStatus(areaStatuses[4], "광화문·덕수궁", {
      RESULT: {
        "RESULT.CODE": "INFO-000",
        "RESULT.MESSAGE": "정상 처리되었습니다."
      },
      CITYDATA: {
        AREA_NM: "광화문·덕수궁",
        AREA_CD: "POI009",
        LIVE_PPLTN_STTS: [
          {
            AREA_CONGEST_LVL: "붐빔",
            AREA_CONGEST_MSG: "많이 붐빕니다.",
            PPLTN_TIME: "2026-07-02 17:40"
          }
        ],
        ROAD_TRAFFIC_STTS: {
          AVG_ROAD_DATA: {
            ROAD_TRAFFIC_IDX: "정체",
            ROAD_TRAFFIC_TIME: "2026-07-02 18:10",
            ROAD_MSG: "진입 시간이 오래 걸릴 수 있어요."
          }
        },
        WEATHER_STTS: [
          {
            WEATHER_TIME: "2026-07-02 18:11",
            TEMP: "26.3",
            PRECPT_TYPE: "소나기",
            PCP_MSG: "소나기 가능성이 있어요.",
            AIR_IDX: "나쁨",
            PM10_INDEX: "좋음",
            PM25_INDEX: "보통"
          }
        ],
        EVENT_STTS: [{ EVENT_NM: "전시" }, { EVENT_NM: "공연" }]
      }
    });

    expect(status.source).toBe("seoul_open_data");
    expect(status.crowdLevel).toBe("VERY_HIGH");
    expect(status.weather).toBe("RAIN");
    expect(status.airQuality).toBe("BAD");
    expect(status.transitFriction).toBe("HIGH");
    expect(status.liveEventCount).toBe(2);
    expect(status.updatedAt).toBe("2026-07-02 18:11");
    expect(status.dataProviderAreaCode).toBe("POI009");
  });

  it("maps live event details for recommendation context", () => {
    const status = mapCityDataToAreaStatus(areaStatuses[4], "광화문·덕수궁", {
      RESULT: {
        "RESULT.CODE": "INFO-000",
        "RESULT.MESSAGE": "정상 처리되었습니다."
      },
      CITYDATA: {
        AREA_NM: "광화문·덕수궁",
        EVENT_STTS: [
          {
            EVENT_NM: "서울 문화의 밤",
            EVENT_PERIOD: "2026-07-02~2026-07-05",
            EVENT_PLACE: "세종문화회관",
            PAY_YN: "N",
            URL: "https://example.com/event"
          },
          {
            EVENT_PERIOD: "이름 없는 행사는 제외"
          }
        ]
      }
    });

    expect(status.liveEvents).toEqual([
      {
        name: "서울 문화의 밤",
        period: "2026-07-02~2026-07-05",
        place: "세종문화회관",
        isFree: true,
        url: "https://example.com/event"
      }
    ]);
  });
});
