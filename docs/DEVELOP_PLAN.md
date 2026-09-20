# DailySkin 15 — 디벨롭 플랜 (v2, 2026-09-20)

IR 덱(`DailySkin15_IR_Deck_20260918_peter.pdf`)과 현재 MVP 코드를 대조해 뽑은 제품·디자인 디벨롭 방향.
Mobbin에서 찾은 레퍼런스 화면을 각 항목에 붙였다. 링크는 Mobbin 화면 페이지.

## 0. 한 줄 진단

덱은 **"Skin Analyzer가 아니라 Skin Experiment Platform"** 을 팔고 있는데, 코드는 아직 Analyzer(스캔→점수→케어)까지만 있다.
덱의 코어 루프 `SCAN → SCORE → CARE → COMPARE → LEARN → NEXT 15 DAYS` 중 **LEARN**(AI Coach)과 **NEXT 15 DAYS**(반복 실험·Skin Memory)가 비어 있고, "제품 × 루틴 × 피부 반응"을 이어주는 **Response Graph**의 입력(루틴/제품 체크인)이 없다.
90일 검증 게이트(Day-15 완주율 ≥30%, 반복 챌린지 ≥25%)를 측정하려면 이 두 단계가 제품 안에 있어야 한다.

## 1. 덱 ↔ 코드 갭

| 덱 슬라이드 | 약속 | 코드 현황 (v1) | v2에서 한 것 |
| --- | --- | --- | --- |
| 5 · Category Reset | Response Graph = 제품 × 루틴 × 피부 반응 | 루틴/제품 사용 기록 없음 | 일일 체크인 3종(루틴/실험 변수/얼굴 안 만짐) + 그래프 마커 |
| 8 · User Value | AI Coach 3줄 인사이트 ("저자극 루틴 날 안정", "도입 후 3일 악화면 제외", "다음은 1개만 변경") | 없음 | 규칙 기반 Skin Coach 엔진 (`lib/insights.ts`) |
| 9 · Moat #2 | Skin Memory — 사이클이 쌓이는 개인 반응 기록 | 15일 후 멈춤 (`nextDay` 15에서 clamp) | Cycle 아카이브 + 다음 실험 시작 |
| 10 · Solution | 코어 루프의 LEARN / NEXT 15 DAYS | 없음 | `/report` (Day-15 리포트) + `startNextCycle` |
| 11 · Moat #1 | Visual Continuity Engine (LIGHT/DISTANCE/ANGLE/MOTION/QUALITY) | 노출·초점·피사체만 체크, 텍스트 1줄 | 5-시그널 스트립 + Day 1 고스트 오버레이 |
| 12 · Growth Loop | 15-Day Glow / Routine Streak / No-Touch / Friends 함께 완주 4종 타일 | Streak·Score 2타일 | 덱과 동일한 4타일 |
| 18 · GTM | 초대코드로 동일 프로토콜 참여 → 결과 카드 UGC | 공유 카드가 텍스트 박스, 코드 없음 | 초대코드 + PNG 결과 카드(얼굴 미포함) 저장/공유 |
| 19 · Live MVP | "Live demo exists today" | 빈 상태로 열리면 아무것도 안 보임 | `/?demo=12`, `/?demo=15` 데모 시드 |

## 2. 우선순위 (다음 90일)

### P0 — 검증 게이트를 측정 가능하게
1. **실험 1변수 원칙을 제품에 박기** — 사이클마다 "무엇을 바꾸는가"를 하나만 선언(`/experiment`). 두 개 바꾸면 원인을 못 찾는다는 메시지를 UI가 반복.
2. **Day-15 리포트 → 다음 실험** — 완주 순간이 곧 재진입 순간. 리포트 하단 CTA 하나로 다음 사이클을 시작해야 "반복 챌린지 ≥25%"가 나온다.
3. **체크인 30초** — 촬영 직후 3토글. 이게 없으면 Response Graph는 그림일 뿐이다.
4. **데모 시드** — 투자자·브랜드 미팅에서 빈 앱을 보여주지 않기.

### P1 — 완주율을 올리는 UX
5. **고스트 오버레이** — Day 1 사진을 35% 투명도로 카메라 위에 겹쳐 같은 위치에 맞추게 함. "같은 빛·거리·각도"의 가장 싼 구현.
6. **Coach 카드가 Today 상단에** — 점수 숫자보다 "왜 움직였는지" 한 줄이 리텐션에 더 기여(Withings/Oura 패턴).
7. **결과 카드 공유** — 얼굴 없이 점수 델타·실험명·초대코드만. Story 규격(1080×1350).
8. **Friends: 등수보다 완주** — "함께 완주하기 n/5". 순위표는 학교/반 평균 개선량만 유지.

### P2 — 사업 확장 준비
9. Brand Challenge 템플릿 — 초대코드가 브랜드 캠페인 코드 역할(같은 제품, 같은 15일 프로토콜).
10. 익명·동의 기반 인사이트 내보내기 — 사이클 단위 집계(JSON) → B2B 대시보드 원천.
11. Native iOS(TrueDepth) — 거리·각도 시그널을 실측으로 교체.

## 3. Mobbin 레퍼런스 → 적용

| 우리 화면 | 레퍼런스 | 가져온 것 |
| --- | --- | --- |
| Today · Coach 카드 | [Withings Health Mate — Health Improvement Score](https://mobbin.com/screens/3defe666-ccc4-4f4c-b7c8-9f648bb736c3) | "이번 주 +1점" 식의 변화량 헤드라인 + 하위 지표 칩 |
| Today · Coach 카드 | [Visible — Morning Stability 요약](https://mobbin.com/screens/3f60710a-3d4e-4892-a146-05dc3a432fc9) | 점수 아래 3줄 요약(각 줄에 추세 아이콘) — Coach 인사이트 행 포맷 |
| Today · Coach 카드 | [Strava — Athlete Intelligence](https://mobbin.com/screens/f6b18597-ed12-4014-98bb-7da449d3ad85) | "당신의 기록 기준" 1문단 코멘트 톤 |
| Report · 점수 게이지 | [Oura — Readiness Score 첫 소개](https://mobbin.com/screens/5a37255c-77fd-4e23-884b-5d9af68a0a38) | 큰 숫자 + 세리프 헤드라인 + 설명 1문단의 위계 |
| Progress · 습관 타일 | [Duolingo — Streak (Personal/Friends)](https://mobbin.com/screens/1755644a-3b98-4a8e-906f-0ef606e166eb) | 개인/친구 탭, 스트릭 보호 개념(추후 "하루 쉬어가기" 검토) |
| Progress · 습관 타일 | [Finch — 목표 체크 캘린더](https://mobbin.com/screens/f27d0b5d-3f66-4c2a-8538-95ef33f779e9) | 목표별 "n회 연속" 라벨 — No-Touch 스트릭 문구 |
| Progress · 캘린더 | [Noom — 5-day streak 캘린더](https://mobbin.com/screens/5c506133-1cc8-470f-b791-468980acda12) | 완료일 채움 + 오늘 강조 + 스트릭 프리즈 안내 |
| Compare | [Photoroom — Before/After 슬라이더](https://mobbin.com/screens/581c0f2a-743c-4464-bb1a-c5ac3c2c2625) | 하단 BEFORE/AFTER 토글 슬라이더 — 현재 드래그 핸들의 대안(P2) |
| Compare | [Hers — Month 0 / Month 6 비교](https://mobbin.com/screens/dc7b6682-eff4-4591-be82-a6d5d9fd6f62) | 두 사진에 같은 ROI 폴리곤 오버레이 — "같은 부위" 강조(P2) |
| Challenge · 초대 | [Tempo — Compete with friends (코드 복사/초대/공유)](https://mobbin.com/screens/100bdd97-2a82-4fb5-adf3-bd5db8f2b1dc) | 코드 카드 + Copy + Invite + Share 3버튼 |
| Challenge · 순위 | [Runbuds — 팀 러닝 챌린지](https://mobbin.com/screens/f4349f17-72fe-4f67-ba92-a323e23128c8) | 목표·남은 일수·팀 진행률을 한 카드에 |
| Share card | [Runna — 결과 카드 저장/공유](https://mobbin.com/screens/5e9a9149-03be-4f87-85e4-ea2baaee23e3) | 카드 미리보기 + Story/iMessage 채널 + 기기 저장 |
| Share card | [Future Pro — Share to (Guest Pass)](https://mobbin.com/screens/bf2ae115-910c-4564-8758-e3860b24459c) | 카드 안에 초대 링크 — 초대코드를 카드에 넣은 이유 |
| Share card | [Hevy — 첫 운동 완료 카드](https://mobbin.com/screens/db9dd20e-1263-4da0-88ef-4fdca528cc6a) | 완료 순간의 컨페티 + 공유 — Day-15 완주 리포트 |
| Scan | [Noom — 얼굴 프레임 + Lighting quality 5점](https://mobbin.com/screens/c895a2bc-8a1c-4064-961b-604669bead68) | 조명 품질을 도트로 — 5-시그널 스트립 |
| Scan | [MoonPay — Auto capture on](https://mobbin.com/screens/0b529724-9dc3-45c1-971f-c94123dfa0e2) | "Auto capture on" 상태 표기 — 자동 촬영 신뢰감 |

## 4. 디자인 원칙 (Soft Lab 유지 + 추가)

- **숫자보다 문장** — 점수 옆에는 항상 "왜"가 한 줄 붙는다(Coach).
- **경고는 노란색, 빨강 금지** — 피부 지표 하락은 실패가 아니라 관찰 대상. `error` 토큰은 촬영 실패·삭제에만.
- **얼굴은 절대 밖으로 안 나간다** — 공유 카드·리더보드·초대 화면 어디에도 사진 없음.
- **한 번에 한 변수** — 실험 설정 화면은 복수 선택을 허용하지 않는다.
- **추정치 표기** — 모든 지표 문구에 "사진에서 보이는 추정치" 계열 문장 유지. 진단/치료/처방 단어 금지(테스트로 검사).

## 5. 이번 브랜치(feature/ux-develop-v2)에서 구현한 것

- `lib/types.ts` — Experiment / CompletedCycle / 체크인 필드
- `lib/store.tsx` — setExperiment · setCheckIn · setInviteCode · startNextCycle · loadDemo · cycleComplete
- `lib/insights.ts` — Skin Coach 규칙 엔진 + 실험 판정 + 다음 실험 제안
- `lib/demo.ts` — 결정적 데모 시드 (점수 엔진과 동일 경로로 생성)
- `/experiment` — 실험 1변수 설정
- `/today` — 체크인 시트, Coach 카드, 실험 상태, 완주 시 리포트 CTA
- `/progress` — 습관 4타일, 반응 그래프(실험 시작선·루틴 점), Coach 탭
- `/report` — Day-N/15 리포트, 스텝 차트, 실험 판정, 다음 15일 시작
- `/challenge` — 초대코드, 함께 완주 진행률, PNG 결과 카드
- `/scan` — 5-시그널 스트립, Day 1 고스트 오버레이
- `/profile` — Skin Memory(사이클 기록), 데모 시드 버튼

## 6. 아직 안 한 것 (다음 브랜치)

- 서버 없음: 초대코드는 로컬 저장만. 친구 진행률은 데모 값.
- 거리/각도 실측 없음(가이드 기반). TrueDepth는 Native iOS 단계.
- 사이클 아카이브의 사진은 IndexedDB에 남지만 리포트에서 이전 사이클 비교 UI는 미구현.
- 알림(같은 시간 촬영 리마인더) 미구현 — 완주율에 직접 영향, 다음 우선.
