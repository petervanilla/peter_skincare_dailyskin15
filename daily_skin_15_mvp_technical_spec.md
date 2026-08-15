# DailySkin 15 — iPhone 기반 15일 셀프 스킨케어 MVP 기술 명세서

> 프로젝트 가칭: **DailySkin 15**  
> 핵심 테마: **“15일 동안 내 피부가 어떻게 달라지는지, 매일 같은 조건으로 기록하고 비교한다.”**  
> 타깃: 피부관리에 관심이 높은 **14–29세 여성** 중심의 iPhone 사용자  
> 목적: 의료 진단이 아닌 **셀프 스킨케어용 피부 변화 트래킹 + 루틴 가이드 + 제품 탐색** MVP

---

## 0. Executive Summary

이 앱의 본질은 “정확한 피부병 진단기”가 아니라 **매일 같은 조건으로 얼굴을 촬영하고, 동일한 기준으로 변화량을 보여주는 15일 트래커**다.

MVP에서 가장 중요한 것은 AI 모델의 절대 정확도보다 다음 3가지다.

1. **촬영 조건의 표준화** — 같은 거리, 같은 각도, 같은 조명, 같은 표정
2. **지표의 상대 변화 추적** — 오늘의 절대값보다 Day 1 대비 증감
3. **행동 연결** — 분석 → 오늘 할 케어 → 기록 → 15일 결과

### 가장 중요한 기술 수정

초기 아이디어의 “iPhone LiDAR 피부 스캔”은 기술적으로 그대로 가져가기보다 아래 구조로 바꾸는 것이 적절하다.

- **주 스캔:** 전면 RGB 카메라 + Vision/Core ML
- **보조 스캔:** 지원 기기에서 TrueDepth 기반 얼굴 pose/depth 정보
- **LiDAR:** 후면 LiDAR 탑재 기기에서만 scene depth 사용 가능하므로 셀피형 피부 분석의 핵심 기술로 두지 않음

즉, 소비자 메시지는 “AI Face Scan” 또는 “Depth-assisted Skin Scan”으로 가져가고, 내부 기술은 **RGB + Face Landmark + TrueDepth(optional)** 구조가 MVP에 가장 현실적이다.

---

# 1. 사용자 의도 분석

## 1-1. 사용자가 원하는 경험

사용자는 병원처럼 복잡한 진단을 원하는 것이 아니다.

> “내 피부가 어제보다 좋아졌는지, 지금 하고 있는 스킨케어가 효과가 있는지를 매일 눈으로 확인하고 싶다.”

따라서 제품의 핵심 경험은 다음과 같이 정의할 수 있다.

**SCAN → SCORE → CARE → RECORD → COMPARE → SHARE**

| 단계 | 사용자 질문 | 앱의 역할 |
|---|---|---|
| Scan | 오늘 내 피부는 어때? | 표준화된 얼굴 촬영 |
| Score | 어디가 문제야? | 4개 피부 지표 시각화 |
| Care | 그래서 뭘 해야 해? | 오늘의 스킨케어/페이스 요가 |
| Record | 좋아지고 있나? | Day 1–15 히스토리 저장 |
| Compare | 진짜 변했어? | Before/After split 비교 |
| Share | 친구랑 비교하면? | Skin Score 공유/챌린지 |

---

# 2. 제1원칙 관점에서 MVP 범위 재설계

## 버려야 할 가정

### 가정 A. LiDAR가 있어야 피부를 정확히 분석할 수 있다
**판단:** X

피부의 트러블, 색소성 얼룩, 주근깨 등은 대부분 RGB 이미지의 색/텍스처 정보가 더 중요하다. 깊이 정보는 얼굴 pose 보정과 주름 형태 보조 분석에 유용하지만 핵심은 아니다.

### 가정 B. 첫 버전부터 피부과 수준으로 진단해야 한다
**판단:** X

MVP에서는 의료 진단 정확도를 주장하지 않고, **동일 사용자의 상대적 변화 추적**에 집중하면 훨씬 빠르게 개발 가능하다.

### 가정 C. 제품 추천, 병원 추천, 친구 대결까지 모두 있어야 한다
**판단:** 부분적으로 X

제품 추천과 병원 매칭은 monetization 확장 기능이다. 1차 MVP는 “15일 피부 변화 경험”이 재미있는지 검증해야 한다.

---

# 3. MVP 정의

## MVP에서 반드시 구현할 기능 — P0

1. 온보딩 + 짧은 피부 설문
2. 얼굴 5방향 촬영 가이드
3. 사진 품질 검사
4. 피부 4대 지표 분석
5. Daily Skin Score / Cosmetic Skin Age Index
6. Day 1–15 캘린더 기록
7. Before / After Split View
8. 오늘의 관리 액션 1–3개
9. 로컬 또는 계정 기반 사진 히스토리 저장

## P1 — MVP 이후 빠르게 붙일 기능

- 페이스 요가 영상/가이드
- AI 제품 추천
- 친구 Skin Score 챌린지
- 15일 결과 카드 공유

## P2 — 사업 확장

- 피부과/병원 매칭
- 전문가 상담
- 제품 affiliate / commerce
- 화장품 브랜드 협찬 루틴
- 장기 30/60/90일 프로그램

---

# 4. 15일 사용자 Journey

## Day 0 — Onboarding

### 화면 01. Hero

**카피 예시**

> 15일 뒤, 내 피부는 얼마나 달라질까?

CTA: `15일 피부 챌린지 시작하기`

보조 문구:

> 하루 30초. 같은 얼굴을 기록하면 변화가 보입니다.

---

## Day 0 — Mini Survey

5–7문항 이내.

- 가장 신경 쓰이는 피부 고민은?
  - 트러블
  - 붉은기
  - 잡티/주근깨
  - 피부결
  - 주름
  - 탄력
- 피부 타입
  - 건성 / 지성 / 복합 / 잘 모르겠음
- 최근 피부 컨디션
  - 매우 좋음 / 보통 / 예민함
- 최근 야외활동
- 현재 사용하는 주요 제품
- 수면 상태(optional)

설문 결과는 진단이 아니라 **맞춤 루틴 추천의 입력 데이터**로 사용한다.

---

# 5. 얼굴 스캔 UX 기술 명세

## 5-1. Capture Flow

촬영 UI는 “사진 찍기”보다 **게임처럼 얼굴을 가이드에 맞추는 경험**이어야 한다.

### 5개의 촬영 가이드

1. **Front** — 정면, 무표정
2. **Left 30°** — 왼쪽 볼/턱선
3. **Right 30°** — 오른쪽 볼/턱선
4. **Chin Up +15°** — 턱/팔자/목 경계 확인
5. **Chin Down -10°** — 이마/미간/전면 텍스처 확인

### 자동 촬영 조건

사용자가 셔터를 누르지 않아도 아래 조건이 모두 만족되면 자동 capture.

- 얼굴 중심 오차 ±5%
- 얼굴 회전 범위 가이드 내
- 눈 뜸 감지
- blur threshold 통과
- 과노출/저노출 통과
- 얼굴 가림 최소화
- 머리카락이 주요 분석 영역을 과도하게 가리지 않음
- 카메라와 얼굴 거리 범위 충족

### UX Feedback

- “조금 더 가까이”
- “빛을 정면으로 받아주세요”
- “머리카락을 이마에서 치워주세요”
- “고개를 왼쪽으로 천천히 돌려주세요”
- “좋아요. 그대로 1초만!”

촬영 성공 시 원형 링이 100% 완성되고 가벼운 haptic feedback.

---

# 6. 피부 분석 4대 지표

## 지표 A. Trouble Index

### MVP 정의

Visible blemish / red spot estimate.

분석 대상:

- 붉은 트러블 후보
- 여드름성 돌기 후보
- 국소 홍조 후보

### 출력

- Trouble Count Estimate
- Trouble Area Ratio
- Day 1 대비 증감

예:

> Visible Trouble 18 → 12  
> **-33%**

※ “여드름 진단”이 아니라 “visible trouble estimate”로 표현.

---

## 지표 B. Spot & Freckle Index

분석 대상:

- 색소성 spot
- 주근깨 형태의 작은 점
- 톤 불균형

### 출력

- Visible Spot Estimate
- Spot Density
- 좌/우 볼 분포 Heatmap
- Day 1 대비 변화

조명 변화에 민감하므로 **촬영 조건 표준화가 핵심**.

---

## 지표 C. Nasolabial Fold Index

분석 대상:

- 코 옆 → 입가 영역 라인
- 좌/우 대칭
- line contrast
- geometry depth 보조치

### 출력 예

> Smile Line Score 62 / 100  
> 지난주 대비 +4

MVP는 실제 주름 깊이 mm 측정이 아니라 **visual wrinkle prominence index**로 표현.

---

## 지표 D. Forehead Line Index

분석 대상:

- 이마 horizontal line
- 미간 vertical line(optional)
- line density
- contrast

### 출력

- Forehead Line Score
- Estimated visible line count
- Day 1 대비 변화

---

# 7. 종합 피부 점수

## 7-1. Daily Skin Score

0–100점.

예시 MVP 가중치:

```text
Daily Skin Score
= Trouble 30%
+ Spot/Freckle 25%
+ Nasolabial 20%
+ Forehead Line 15%
+ Capture consistency 10%
```

단, 실제 운영 시 사용자 연령/피부 타입별 normalization 필요.

---

## 7-2. Skin Age

사용자에게 재미있는 결과이지만 의료적 오해가 생길 수 있다.

따라서 정식 명칭은 다음을 추천한다.

### 권장

**Skin Age Index**  
또는  
**Visual Skin Age**

카피:

> 사진에서 보이는 피부 컨디션을 기준으로 계산한 참고용 지표예요.

절대 생물학적 피부나이 또는 의료적 진단으로 표현하지 않는다.

---

# 8. 15일 Tracking UX

## Main Dashboard

상단:

**DAY 7 / 15**

> 오늘도 피부를 기록할까요?

중앙:

- 오늘의 Skin Score
- Day 1 대비 변화
- 가장 좋아진 지표
- 오늘 관리가 필요한 지표

하단:

- `오늘 얼굴 스캔`
- `오늘의 3분 케어`

### Streak

`● ● ● ● ● ○ ○ ○ ○ ○ ○ ○ ○ ○ ○`

연속 기록의 의미를 강화.

---

# 9. Before / After 핵심 인터랙션

이 앱에서 가장 바이럴 가능성이 높은 화면.

## Split Comparison

- 화면 중앙에 vertical slider
- 왼쪽 = Day 1
- 오른쪽 = Today
- 얼굴 landmark 기준으로 두 사진 자동 정렬
- scale / eye position / rotation 자동 보정

### 비교 모드

- RGB original
- Trouble map
- Spot map
- Wrinkle map

### 반드시 필요한 원칙

Before/After는 두 사진의 조명과 얼굴 크기가 최대한 같아야 한다.

그래서 촬영 UX 자체가 “비교 가능한 사진을 만드는 시스템”이어야 한다.

---

# 10. 오늘의 셀프 케어

## Recommendation Rule

분석 결과 → 1개의 핵심 행동으로 연결.

예:

### Trouble Index 악화

> 오늘은 자극을 줄이는 날

- 진정 중심 루틴
- 강한 exfoliation 피하기
- 얼굴 만지지 않기

### Forehead Line 악화

> 오늘은 이마 긴장을 풀어주세요

- 3분 forehead relaxation
- hydration reminder

### Sun exposure 입력 + Spot 증가

> 오늘은 UV 케어가 우선이에요

- 자외선 차단
- 진정 루틴

※ 질환 치료/처방 표현은 사용하지 않는다.

---

# 11. Face Yoga MVP

페이스 요가는 실제 효과를 과도하게 약속하지 않고 **relaxation / routine 콘텐츠**로 정의.

예시 콘텐츠:

- Forehead Relax — 2 min
- Jaw Release — 3 min
- Cheek Lift Routine — 2 min
- Eye Area Relax — 2 min

화면 구성:

- 큰 인물 영상
- 남은 시간
- 따라 할 위치 overlay
- “오늘 완료” 체크

---

# 12. AI 제품 추천 — MVP 설계

초기부터 무제한 생성형 AI 추천을 사용하지 말고 다음 구조가 안전하고 설명 가능하다.

```text
사용자 설문
+ 오늘 Skin Index
+ 제품 DB의 ingredient/tag
↓
Rule-based 후보 필터
↓
AI가 이유를 자연어로 설명
```

### 예

Skin state:

- Trouble ↑
- Sensitivity ↑

Recommendation category:

- mild cleanser
- soothing moisturizer
- non-comedogenic sunscreen

AI 역할:

> “왜 이 제품 유형이 현재 상태와 맞는지” 설명

AI가 의료적 치료효과를 단정하지 않는다.

---

# 13. 친구와 Skin Score Challenge

## 방향

“누가 피부가 더 좋나”만 강조하면 외모 평가/열등감 문제를 만들 수 있다.

따라서 경쟁 지표는 **절대 피부 점수보다 개선량**이 좋다.

예:

> 7-Day Glow Challenge

- Peter: +8
- Mina: +11

승리 기준:

**누가 더 좋아졌는가?**

공유 카드:

> DAY 1 → DAY 15  
> +14 SKIN SCORE

얼굴 원본 공개는 사용자가 별도로 선택.

---

# 14. 병원/피부과 매칭

MVP에서는 제외(P2 권장).

추후 조건:

- 사용자가 직접 “전문가 상담” 선택
- 위치 기반 피부과 검색
- 일반 정보 제공과 광고/제휴 표시 구분
- 의료적 긴급/진단 시스템처럼 보이지 않게 구성

---

# 15. 시스템 Architecture

```text
┌───────────────────────────────┐
│           iOS App             │
│ SwiftUI                       │
├───────────────────────────────┤
│ Camera / Scan Layer           │
│ AVFoundation                  │
│ ARKit / TrueDepth(optional)   │
│ Vision Face Landmark          │
├───────────────────────────────┤
│ Skin Analysis Layer           │
│ Core ML / Image Pipeline      │
│ Segmentation / Classification │
│ Feature Extraction            │
├───────────────────────────────┤
│ Skin Score Engine             │
│ Normalization                 │
│ Day-to-Day Comparison         │
├───────────────────────────────┤
│ Local Data / Cloud            │
│ SwiftData / CloudKit          │
├───────────────────────────────┤
│ Recommendation Engine         │
│ Rule + AI Explanation         │
└───────────────────────────────┘
```

---

# 16. iPhone 기술 Stack

## Front-end

- SwiftUI
- iOS 18+ 권장
- NavigationStack
- Charts
- PhotosUI

## Capture

- AVFoundation
- ARKit Face Tracking
- Vision Face Landmarks
- Vision Face Capture Quality

## ML

- Core ML
- Vision + custom Core ML model
- optional server inference for early experimentation

## Depth

### Primary

TrueDepth-supported face capture on compatible devices.

### Fallback

RGB-only camera + facial landmark normalization.

### LiDAR

후면 LiDAR는 셀프 얼굴 스캔의 핵심 경로에서 제외. 필요한 연구 모드 또는 특정 accessory workflow에서만 별도 검토.

---

# 17. AI / Computer Vision MVP Pipeline

```text
Photo
↓
Face Detection
↓
Landmark Detection
↓
Pose / Scale Normalization
↓
Skin ROI Mask
├─ forehead
├─ left cheek
├─ right cheek
├─ nose
├─ chin
└─ nasolabial region
↓
Color Normalization
↓
4 Feature Models
↓
Confidence Check
↓
Daily Score
↓
Compare with Day 1 / previous day
```

---

# 18. 데이터 모델 예시

```json
{
  "userId": "uuid",
  "challengeId": "uuid",
  "day": 7,
  "capturedAt": "2026-08-14T08:30:00+09:00",
  "captureQuality": 0.94,
  "scores": {
    "trouble": 72,
    "spot": 81,
    "nasolabial": 66,
    "forehead": 74,
    "overall": 74
  },
  "estimatedVisibleSkinAge": 23,
  "deltaFromDay1": 8,
  "recommendationIds": ["routine_003", "care_008"]
}
```

원본 얼굴 사진은 별도 secure asset storage로 분리하고 score JSON과 결합한다.

---

# 19. 개인정보 및 안전 설계

얼굴 사진은 민감도가 높은 사용자 데이터다.

## MVP 원칙

1. 가능한 분석은 **on-device 우선**
2. 얼굴 원본 사진 cloud upload는 별도 동의
3. 공유는 기본 OFF
4. 친구 기능에서 원본 얼굴 대신 score card 공유 기본값
5. 사용자가 사진과 기록을 쉽게 삭제 가능
6. 분석 결과는 “진단”이 아니라 “셀프 케어 참고 정보”임을 명확히 표시

### 10대 타깃 주의

한국 개인정보 보호법상 만 14세 미만 아동의 개인정보 처리에 동의가 필요한 경우 법정대리인 동의와 확인이 요구된다.

따라서 MVP는 개발 복잡도를 줄이기 위해 **14세 이상 가입**으로 시작하는 것을 권장한다.

---

# 20. 의료기기 규제 관점

제품 포지셔닝을 아래처럼 잡으면 초기 MVP의 규제 리스크를 낮출 수 있다.

## 피해야 하는 문구

- 피부병을 진단합니다
- 여드름을 치료합니다
- 피부질환을 발견합니다
- 주름 깊이를 의학적으로 측정합니다
- 피부과 진단 정확도 95%

## 권장 문구

- 눈에 보이는 피부 변화를 기록합니다
- 사진 기반 피부 컨디션을 비교합니다
- 15일 동안의 변화를 추적합니다
- 셀프 스킨케어 참고용 정보를 제공합니다

향후 “질병의 진단·예측·치료” 성격으로 기능을 확장하면 디지털의료기기 관련 검토가 필요하다.

---

# 21. 첨부 레퍼런스 이미지 톤앤매너 분석

첨부된 두 레퍼런스는 공통적으로 **Clinical Tech + Beauty Lifestyle**의 중간 톤이다.

## Reference A에서 가져올 요소

- dark presentation background 위에 light phone UI
- lavender / violet accent
- AI 분석을 어렵지 않게 보이게 하는 카드 UI
- selfie scan을 중심으로 한 큰 인물 이미지
- “95% fit”처럼 한눈에 이해되는 score chip
- progress와 recommendation이 같은 정보 위계에 존재

## Reference B에서 가져올 요소

- cream / off-white background
- sage green accent
- editorial beauty magazine 분위기
- 큰 serif/soft headline + rounded UI
- facial region cards
- diary/progress 중심 경험
- wellness 느낌을 주는 calm visual

---

# 22. DailySkin 15 제안 Visual Direction

두 레퍼런스를 그대로 복제하지 않고 아래처럼 합치는 것을 추천한다.

## Concept

**“Soft Lab”**

> 피부과의 신뢰감 + 뷰티 다이어리의 친근함

### Primary Palette

- Warm Ivory — `#F7F6F2`
- Soft Mint — `#CFE8DC`
- Deep Green — `#1F5B50`
- Lavender — `#B8A8FF`
- Graphite — `#202026`
- White — `#FFFFFF`

### UI Style

- corner radius 20–28px
- 큰 facial image
- 얇은 stroke
- soft shadow
- 숫자는 bold
- 설명은 짧게
- chart는 1–2개의 선만

### Typography

- Korean: Pretendard / SUIT
- English: SF Pro
- editorial accent headline이 필요하면 serif 1종을 제한적으로 사용

---

# 23. 화면별 Front-end Reference Spec

## Screen 01 — Hero / 15 Day Challenge

**구성**

- 상단 logo
- headline
- 15-day circular progress preview
- large portrait
- CTA

카피:

> **15일 뒤, 내 피부를 만나보세요.**
>
> 하루 30초 피부 기록

---

## Screen 02 — Skin Survey

- 1 question / screen
- progress `2 / 6`
- pill selection
- 다음 버튼

---

## Screen 03 — Face Scan

- fullscreen camera
- face oval guide
- head direction indicator
- circular progress `3 / 5`
- auto capture

Main message:

> 얼굴을 원 안에 맞춰주세요

---

## Screen 04 — Analysis Loading

불필요한 fake medical animation 대신 실제 pipeline을 시각적으로 표현.

- Aligning face…
- Checking visible spots…
- Comparing skin texture…
- Building your Daily Skin Score…

---

## Screen 05 — Skin Result

Top:

> Today’s Skin Score 74

4 cards:

- Trouble 72
- Spots 81
- Smile Line 66
- Forehead 74

아래:

> 오늘 가장 관리가 필요한 부분  
> **Smile Line**

CTA:

`오늘의 3분 케어 보기`

---

## Screen 06 — Daily Dashboard

- DAY 7 / 15
- streak
- today score
- line graph
- biggest improvement
- scan CTA

---

## Screen 07 — Before / After

- Day 1 / Day 15
- face split slider
- score delta
- metric filter tabs

카피:

> 15일 동안 이렇게 달라졌어요.

---

## Screen 08 — Care Routine

- 3 min video
- facial area overlay
- simple instructions
- complete button

---

## Screen 09 — Product Discovery

- “Today’s focus: Calm & Protect”
- category card 3개
- product card
- `Why it fits` 설명

---

## Screen 10 — Challenge Share

- Day 1 → Today
- +12 points
- streak
- 얼굴 공개 ON/OFF
- share CTA

---

# 24. Front-end 이미지 생성용 Master Prompt

아래 프롬프트는 Figma reference image 또는 AI UI concept image 생성용이다.

```text
Design a premium iPhone skincare tracking app called “DailySkin 15”, a 15-day AI-assisted self skincare challenge for young women aged 14–29.

Visual concept: “Soft Lab” — a balance between clinical skincare technology and a calm beauty diary.

Use a warm ivory background, soft mint green, muted lavender accent, deep forest green typography, white rounded cards, subtle soft shadows, generous spacing, minimal elegant charts, premium editorial beauty photography.

Create a cohesive mobile UI system with:
1. 15-day challenge dashboard
2. guided face scanning interface with an oval facial alignment frame
3. five-step face scan progress indicator
4. AI skin analysis result with four metrics: visible trouble, spots/freckles, smile line, forehead lines
5. Daily Skin Score
6. day-by-day progress chart
7. before-and-after split face comparison slider
8. 3-minute face care routine
9. AI skincare product recommendation with “why it fits” card
10. shareable 15-day progress card

The interface should feel friendly, youthful, trustworthy, not medical or intimidating.
Avoid hospital blue, dense dashboards, excessive text, and futuristic sci-fi effects.

Use large facial photography as the visual hero element.
Use leading lines in the UI composition to guide the eye from the user’s face → score → recommended action → 15-day progress.

Apple-like high-end mobile UI, realistic iPhone proportions, clean SwiftUI aesthetic, high fidelity product design, soft natural studio lighting, skincare editorial art direction.
```

---

# 25. 화면 이미지 생성용 Prompt A — Scan Screen

```text
High-fidelity iPhone UI concept for “DailySkin 15”, an AI skincare diary.
Fullscreen front camera portrait of a young woman, natural skin texture, soft daylight.
A thin oval face alignment guide precisely follows the face.
Five-step scan progress indicator at the top: Front, Left, Right, Up, Down.
Current step 1 of 5.
Minimal instruction: “얼굴을 원 안에 맞춰주세요”.
Large soft lavender circular scan button at bottom.
Warm ivory and translucent glass UI overlays, muted mint and lavender accents, premium skincare app aesthetic.
Leading lines from the facial oval toward the scan progress and CTA.
No medical instruments, no sci-fi holograms, no excessive labels.
```

---

# 26. 화면 이미지 생성용 Prompt B — Result Dashboard

```text
High-fidelity iPhone skincare analysis dashboard for “DailySkin 15”.
Headline: “Today’s Skin Score 74”.
Large clean face portrait at top with subtle facial region overlays.
Four rounded metric cards: Trouble 72, Spots 81, Smile Line 66, Forehead 74.
A small label says “Day 7 / 15”.
Show a simple progress line chart and a highlighted insight card: “오늘 가장 관리가 필요한 부분: Smile Line”.
CTA button: “오늘의 3분 케어 보기”.
Warm ivory background, soft mint green, muted lavender, deep green text, white cards, subtle shadows.
Youthful Korean beauty-tech aesthetic, calm and trustworthy.
Use leading lines from score to problem area to CTA.
```

---

# 27. 화면 이미지 생성용 Prompt C — Before / After

```text
Premium iPhone UI for “DailySkin 15” showing a Day 1 versus Day 15 before-and-after skincare comparison.
A large centered female face is aligned perfectly across both images.
Use a vertical split slider through the center of the face, left label “DAY 1”, right label “DAY 15”.
Below the image show “+12 Skin Score” and four small improvement indicators.
Tabs: Original / Trouble / Spots / Lines.
Warm ivory UI, pale mint accents, subtle lavender progress elements, soft rounded cards.
Natural realistic skin, same lighting and same head position for both images.
Leading line created by the central split bar directing attention to the progress score below.
Minimal Apple-like skincare app UI.
```

---

# 28. MVP 개발 로드맵

## Phase 0 — 3–5일

- Figma clickable prototype
- Scan flow
- 4 metric result UI
- 15-day dashboard
- Before/After interaction prototype

### 성공 조건

5명 이상에게 보여줬을 때 “15일 동안 해보고 싶다” 반응 확인.

---

## Phase 1 — 1–2주

**Camera MVP**

- SwiftUI app shell
- AVFoundation camera
- Vision face detection
- face alignment guide
- 5-step capture
- photo save

목표:

**매일 비교 가능한 사진을 안정적으로 만드는 것.**

---

## Phase 2 — 2–4주

**Skin Analysis MVP**

- ROI extraction
- image normalization
- 4 metric prototype
- score calculation
- Day comparison

초기에는 정확한 AI 모델이 없어도 heuristic + open dataset research + manual validation으로 interface 검증 가능.

---

## Phase 3 — 1–2주

**15 Day Experience**

- calendar
- streak
- graph
- before-after split
- 15-day completion summary

---

## Phase 4

- AI skincare explanation
- product catalog
- face yoga
- sharing/challenge

---

# 29. MVP 성공 지표

앱의 첫 성공은 “AI 정확도”가 아니다.

## Activation

- Onboarding → 첫 scan 완료율 > 65%

## Habit

- Day 2 재방문 > 40%
- Day 7 유지율 > 20%

## Core Value

- Before/After 화면 조회율 > 60%
- Day 15 완주율 > 10–15%

## Viral

- 결과 카드 공유율 > 5%

이 데이터를 먼저 확인한 뒤 AI 분석 고도화에 비용을 투입하는 것이 합리적이다.

---

# 30. 최종 제안

이 프로젝트의 핵심 경쟁력은 “LiDAR 기술” 그 자체가 아니다.

**정확히 같은 조건에서 얼굴을 반복 촬영하게 만드는 UX + 변화량을 쉽게 보여주는 시각화 + 오늘 바로 할 수 있는 작은 행동**이 결합될 때 제품 가치가 생긴다.

따라서 MVP의 한 문장 정의는 다음과 같다.

> **DailySkin 15는 매일 30초 얼굴을 기록하고, 15일 동안 피부 변화가 실제로 보이게 만드는 AI 스킨케어 다이어리다.**

첫 번째 개발 목표는 피부과 수준의 진단기가 아니라 **“15일 동안 계속 열어보고 싶은 피부 기록 경험”**을 만드는 것이다.

---

# 31. 기술·규제 검토에 참고한 공식 자료

- Apple Developer Documentation — Tracking and visualizing faces / ARFaceTrackingConfiguration
- Apple Developer Documentation — Vision framework / Face Landmarks / Face Capture Quality / Core ML integration
- Apple Developer Documentation — sceneDepth / LiDAR-capable devices
- 식품의약품안전처 — 디지털의료기기소프트웨어 허가·심사 가이드라인 (2025)
- 식품의약품안전처 — 의료기기와 개인용 건강관리(웰니스)제품 판단기준
- 국가법령정보센터 — 개인정보 보호법 제22조의2(아동의 개인정보 보호)

