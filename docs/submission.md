# Submission Notes: 오늘갈까 MCP

## One-liner

실시간 혼잡도, 날씨, 대중교통 컨디션을 바탕으로 지금 바로 가기 좋은 서울 외출 코스를 추천하는 생활형 MCP 서비스.

## Problem

지도 앱은 목적지까지 가는 길은 잘 알려주지만, 사용자가 실제로 궁금한 질문은 종종 다릅니다.

- 지금 가면 너무 붐비지 않을까?
- 비 오는데 실외 코스를 가도 괜찮을까?
- 아이/부모님/데이트 조건에 맞을까?
- 2시간 안에 다녀올 만한 대체 장소가 있을까?

`오늘갈까 MCP`는 경로 탐색을 대체하지 않고, 외출 결정을 돕는 도구로 포지셔닝합니다.

## Target Users

- 퇴근 후 짧은 외출을 고민하는 사용자
- 비/더위/혼잡을 피하고 싶은 사용자
- 아이, 부모님, 연인, 친구와 갈 장소를 빠르게 정해야 하는 사용자

## Example Questions

```text
지금 성수에서 여의도 가도 괜찮아?
비 오는데 아이랑 갈 만한 덜 붐비는 곳 추천해줘
퇴근 후 2시간 정도 사람 덜 많은 데이트 코스 알려줘
오늘 잠실 사람 많으면 대체 장소 추천해줘
```

## MVP Tool Set

- `get_area_status`: 권역별 혼잡도/날씨/대기질/대중교통 부담 조회
- `find_good_places_now`: 조건에 맞는 장소 후보 랭킹
- `recommend_outing_plan`: 실행 가능한 외출 코스 추천

## Judging Fit

- Creativity: 단순 장소 추천이 아니라 "지금 가도 괜찮은지"를 판단합니다.
- Convenience: 사용자는 카카오톡에서 자연어로 물어보고 바로 결정할 수 있습니다.
- Stability: 추천 로직은 deterministic scoring이며, 모든 추천에는 이유와 경고를 포함합니다.

## Current Implementation Status

- TypeScript MCP server implemented.
- STDIO and Streamable HTTP modes implemented.
- Seoul Open Data live adapter implemented with seed fallback for five Seoul areas.
- Unit tests cover scoring behavior, tool handlers, and HTTP route surface.
- Unsupported areas return explicit `UNSUPPORTED_AREA` responses instead of unrelated fallback recommendations.

## Next Work

1. Add richer live event details into recommendations.
2. Add Docker/KakaoCloud deployment configuration values.
3. Run PlayMCP registration smoke test.
4. Expand supported Seoul areas after validating official place names/codes.
