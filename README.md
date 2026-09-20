# DailySkin 15

15일 동안 같은 얼굴을 기록해 피부 변화를 눈으로 확인하는 모바일 웹앱.

- 디자인 원본: Stitch 프로젝트 **DailySkin 15 AI Diary** (`design/` 에 화면 HTML·스크린샷·DESIGN.md 보관)
- 기능 명세: `daily_skin_15_mvp_technical_spec.md`
- 배색·타이포·spacing: `design/DESIGN.md` ("Soft Lab")의 토큰을 `src/app/globals.css` 에 그대로 이식

## 실행

```bash
npm run dev
```

```bash
npm test
```

`npm test` 는 픽셀 분석 파이프라인·점수 엔진·Skin Coach 인사이트 엔진을 합성 데이터로 검증합니다 (카메라·브라우저 불필요).

### 데모 (Live Demo)

빈 상태 대신 15일 기록이 채워진 앱을 바로 보려면:

- `http://localhost:3000/?demo=12` — 12일차 진행 중 (Coach · Response Graph · 체크인)
- `http://localhost:3000/?demo=15` — 15일 완주 (완주 리포트 · 다음 15일 실험 시작)

프로필 화면 하단 "데모 · 개발자" 버튼으로도 불러올 수 있습니다. 데모 수치는 실제 점수 엔진과 같은 경로로 생성됩니다 (`src/lib/demo.ts`).

제품 카탈로그는 Open Beauty Facts 스냅샷입니다. 갱신: `node scripts/fetch-products.mjs && python3 scripts/cutout-products.py` (배경 누끼 · 라이선스: `public/products/ATTRIBUTION.md`).

디벨롭 방향과 Mobbin 레퍼런스는 `docs/DEVELOP_PLAN.md`, 화면 캡처는 `docs/SCREENS.md` 에 있습니다.

## 화면 연결도

```
[/ 로딩 15day]
      │ 2초
      ├─ 기존 사용자 ─────────────────────────────> [/today]
      ▼
[/ 히어로]
      ▼
[/onboarding/survey]  5단계 설문
      ▼
[/scan]  5방향 가이드 촬영 (자동 캡처)
      ▼
[/analysis/vision]  AI Vision Analysis (2.8초)
      ▼
[/analysis]  4대 지표 결과
      ▼
┌──────────────── [/today] 대시보드 (허브) ────────────────┐
│  bottom nav: Today / Progress / Routine / Profile        │
└──┬────────────┬──────────────┬─────────────┬────────────┘
   ▼            ▼              ▼             ▼
[/progress]  [/routine]   [/shop]       [/leaderboard]
   │            │                            │
   ▼            ▼                            ▼
[/compare]  [/face-yoga]              [/challenge]  초대코드 · 결과 카드
   │
   ▼
[/report]  Day-N / 15일 완주 리포트 ─▶ 다음 15일 실험 시작 (사이클 아카이브)

[/experiment]  이번 15일의 실험 — 변수 1개 설정 (Today에서 진입)
```

| 라우트 | Stitch 원본 화면 |
| --- | --- |
| `/` (splash) | A minimalist and premium loading screen |
| `/` (hero) | 15일의 여정 진입 + lifestyle 배경 |
| `/onboarding/survey` | Skin Survey - Concerns |
| `/scan` | AI Face Scan |
| `/analysis/vision` | AI 피부 분석 기술 시각화 |
| `/analysis` | AI 피부 분석 결과 (고도화 시각화) |
| `/today` | Hero & Dashboard |
| `/progress` | 15일의 여정 - 7일차 기록 |
| `/compare` | Before & After Comparison |
| `/routine` | 오늘의 스킨케어 루틴 |
| `/face-yoga` | 오늘의 3분 페이스 요가 |
| `/products` | 나를 위한 맞춤 제품 추천 |
| `/challenge` | 친구와 함께하는 챌린지 랭킹 |
| `/leaderboard` | 학교/반별 챌린지 랭킹 |
| `/experiment` | (v2) 이번 15일의 실험 — 변수 1개 |
| `/report` | (v2) Day-N / 15일 완주 리포트 · AI Coach · 다음 15일 |

## 구조

```
src/
  app/            라우트 (App Router)
  components/     BottomNav, TopAppBar, ScoreRing, StoredPhoto, Icon
  lib/
    analysis.ts   픽셀 분석 파이프라인 (ROI → 4대 지표 + 촬영 품질)
    scoring.ts    명세 §7-1 가중치 점수 · Visual Skin Age Index
    insights.ts   Skin Coach 규칙 엔진 (Day-1 델타 · 실험 반응 창 · 루틴 분리 · 습관)
    demo.ts       결정적 데모 시드 (/?demo=N)
    shareCard.ts  얼굴 없는 결과 카드 PNG 렌더 · 공유
    products.ts   제품 카탈로그 (Open Beauty Facts + K-뷰티 큐레이션)
    matching.ts   피부 지표 × 성분 매칭 → 제품 추천 (이유·주의 포함)
    recommendations.ts  룰 기반 케어/제품 추천
    store.tsx     localStorage 기반 앱 상태
    photoStore.ts IndexedDB 사진 저장
    assets.ts     Stitch 이미지 매핑 (public/design)
public/design/    Stitch에서 내려받은 이미지 31장 + MANIFEST.txt
```

## 데이터·표현 원칙 (명세 준수)

- 모든 수치는 **"보이는 추정치(visible estimate)"** 이며 진단이 아님
- 피부 나이는 **Visual Skin Age Index** 로만 표기, 생물학적/의학적 나이로 표현하지 않음
- Before/After 는 **보정 없이** 원본만 표시, 촬영 조건 차이가 크면 경고 표시
- 챌린지 순위는 절대 점수가 아니라 **개선량** 기준
- 사진과 기록은 기기에만 저장 (localStorage + IndexedDB), 서버 전송 없음

## 웹 MVP의 한계

명세는 iOS 네이티브(TrueDepth · Vision · Core ML)를 전제합니다. 웹 버전에서는:

- 랜드마크 모델이 없어 ROI는 촬영 가이드 타원 기준 **고정 비율**로 잡음 → 매일 같은 프레임에 맞추는 것이 전제이며, 그래서 "촬영 일관성"을 점수화해 노출
- 자동 촬영 조건 중 **노출·흔들림·피사체 존재**만 실제 검사 (얼굴 중심/회전/눈 뜸/가림은 미구현)
- 깊이 정보 없음
