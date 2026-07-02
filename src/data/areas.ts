import type { AreaStatus } from "../types.js";

export const areaStatuses: AreaStatus[] = [
  {
    areaKey: "seoul-forest",
    areaName: "성수/서울숲",
    aliases: ["성수", "성수동", "서울숲", "뚝섬"],
    crowdLevel: "MEDIUM",
    weather: "CLOUDY",
    airQuality: "NORMAL",
    transitFriction: "LOW",
    liveEventCount: 2,
    updatedAt: "seed",
    source: "seed"
  },
  {
    areaKey: "hongdae",
    areaName: "홍대/연남",
    aliases: ["홍대", "연남", "연남동", "합정", "상수"],
    crowdLevel: "HIGH",
    weather: "CLOUDY",
    airQuality: "NORMAL",
    transitFriction: "MEDIUM",
    liveEventCount: 4,
    updatedAt: "seed",
    source: "seed"
  },
  {
    areaKey: "yeouido",
    areaName: "여의도",
    aliases: ["여의도", "여의나루", "한강공원", "더현대"],
    crowdLevel: "VERY_HIGH",
    weather: "RAIN",
    airQuality: "NORMAL",
    transitFriction: "HIGH",
    liveEventCount: 3,
    updatedAt: "seed",
    source: "seed"
  },
  {
    areaKey: "jamsil",
    areaName: "잠실",
    aliases: ["잠실", "롯데월드", "석촌호수", "송파"],
    crowdLevel: "HIGH",
    weather: "CLOUDY",
    airQuality: "NORMAL",
    transitFriction: "MEDIUM",
    liveEventCount: 5,
    updatedAt: "seed",
    source: "seed"
  },
  {
    areaKey: "gwanghwamun",
    areaName: "광화문/종로",
    aliases: ["광화문", "종로", "경복궁", "청계천", "시청"],
    crowdLevel: "LOW",
    weather: "CLOUDY",
    airQuality: "GOOD",
    transitFriction: "LOW",
    liveEventCount: 6,
    updatedAt: "seed",
    source: "seed"
  }
];
