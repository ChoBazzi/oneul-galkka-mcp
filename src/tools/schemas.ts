import { z } from "zod";

export const companionSchema = z
  .enum(["solo", "date", "friends", "family", "child", "parents"])
  .describe("동행자 유형: solo, date, friends, family, child, parents");

export const getAreaStatusInputSchema = {
  areaName: z.string().min(1).describe("확인할 서울 권역 이름. 예: 성수, 여의도, 광화문")
};

export const findGoodPlacesNowInputSchema = {
  originArea: z.string().min(1).describe("출발 권역. 예: 성수, 잠실, 광화문"),
  companion: companionSchema,
  durationHours: z.number().min(1).max(8).describe("사용 가능한 외출 시간"),
  avoidCrowd: z.boolean().default(true).describe("혼잡한 장소를 피할지 여부"),
  indoorPreferred: z.boolean().default(false).describe("실내 장소를 우선할지 여부")
};

export const recommendOutingPlanInputSchema = {
  originArea: z.string().min(1).describe("출발 권역. 예: 성수, 잠실, 광화문"),
  targetArea: z.string().min(1).optional().describe("가고 싶은 후보 권역. 없으면 지원 권역 전체에서 추천"),
  companion: companionSchema,
  durationHours: z.number().min(1).max(8).describe("사용 가능한 외출 시간"),
  mood: z.string().optional().describe("원하는 분위기. 예: 조용한, 실내, 데이트, 아이와 함께"),
  constraints: z.array(z.string()).optional().describe("제약 조건. 예: 비, 유모차, 저예산, 덜 붐빔")
};
