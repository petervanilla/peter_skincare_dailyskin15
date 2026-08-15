import { countDelta, previousRecord } from "./scoring.ts";
import type { DayRecord, Survey } from "./types.ts";

/**
 * Rule-based daily care (spec §10) and product categories (spec §12).
 *
 * Copy rules from the spec that these strings must keep honouring:
 *  - no treatment/prescription language, no disease claims
 *  - "visible estimate" framing, never diagnosis
 *  - face yoga is relaxation/routine content, not a promised outcome
 */

export interface CareAction {
  id: string;
  title: string;
  detail: string;
  icon: string;
  minutes?: number;
}

export interface CarePlan {
  headline: string;
  rationale: string;
  actions: CareAction[];
}

const CALM_ROUTINE: CarePlan = {
  headline: "오늘은 자극을 줄이는 날",
  rationale: "어제보다 붉은 기와 트러블 추정치가 늘었어요. 오늘은 진정에 집중해요.",
  actions: [
    {
      id: "gentle-cleanse",
      title: "진정 중심 루틴",
      detail: "미온수 세안 후 자극이 적은 진정 토너와 보습제로 마무리해요.",
      icon: "spa",
      minutes: 5,
    },
    {
      id: "skip-exfoliation",
      title: "강한 각질 제거 피하기",
      detail: "스크럽·고농도 산성 제품은 오늘 하루 쉬어가요.",
      icon: "do_not_touch",
    },
    {
      id: "hands-off",
      title: "얼굴 만지지 않기",
      detail: "손이 얼굴에 닿는 횟수를 줄이면 자극이 줄어들어요.",
      icon: "back_hand",
    },
  ],
};

const FOREHEAD_RELAX: CarePlan = {
  headline: "오늘은 이마 긴장을 풀어주세요",
  rationale: "이마 라인이 어제보다 도드라져 보여요. 긴장을 푸는 데 집중해요.",
  actions: [
    {
      id: "forehead-relax",
      title: "3분 이마 이완",
      detail: "눈썹 위를 부드럽게 쓸어올리며 이마 근육의 긴장을 풀어요.",
      icon: "favorite",
      minutes: 3,
    },
    {
      id: "hydration",
      title: "수분 채우기",
      detail: "물 한 잔과 함께 수분 세럼을 한 겹 더 올려주세요.",
      icon: "water_drop",
    },
  ],
};

const UV_CARE: CarePlan = {
  headline: "오늘은 UV 케어가 우선이에요",
  rationale: "야외활동을 기록한 날이고 잡티 추정치도 늘었어요. 자외선 관리부터 챙겨요.",
  actions: [
    {
      id: "sunscreen",
      title: "자외선 차단",
      detail: "외출 20분 전에 바르고, 실외에 오래 머문다면 한 번 더 덧발라요.",
      icon: "wb_sunny",
    },
    {
      id: "soothing",
      title: "진정 루틴",
      detail: "열감이 남아 있다면 시원한 진정 팩으로 마무리해요.",
      icon: "spa",
      minutes: 10,
    },
  ],
};

const MAINTAIN: CarePlan = {
  headline: "오늘은 리듬을 지키는 날",
  // The break is authored, not left to the wrapper, so the card reads evenly.
  rationale: "지표가 안정적이에요. 지금 하고 있는 루틴을\n그대로 이어가세요.",
  actions: [
    {
      id: "keep-routine",
      title: "기본 루틴 유지",
      detail: "세안 · 보습 · 자외선 차단 3단계를 같은 시간에 반복해요.",
      icon: "check_circle",
      minutes: 5,
    },
    {
      id: "face-yoga",
      title: "3분 페이스 요가",
      detail: "턱선 이완 루틴으로 하루를 가볍게 마무리해요.",
      icon: "favorite",
      minutes: 3,
    },
  ],
};

/**
 * Rules are evaluated in priority order, which is what makes the output a
 * single clear action rather than a pile of advice (spec §10).
 */
export function buildCarePlan(
  records: DayRecord[],
  today: DayRecord | null,
): CarePlan {
  if (!today) return MAINTAIN;
  const prev = previousRecord(records, today.day);
  if (!prev) return MAINTAIN;

  const troubleChange = countDelta(today.metrics.troubleCount, prev.metrics.troubleCount);
  const spotChange = countDelta(today.metrics.spotCount, prev.metrics.spotCount);
  const foreheadWorse = today.subScores.forehead < prev.subScores.forehead - 3;

  if (today.sunExposure && spotChange && !spotChange.improved) return UV_CARE;
  if (troubleChange && !troubleChange.improved && troubleChange.value > 0) return CALM_ROUTINE;
  if (foreheadWorse) return FOREHEAD_RELAX;
  return MAINTAIN;
}

export interface FaceYogaRoutine {
  id: string;
  title: string;
  minutes: number;
  focus: string;
  steps: string[];
}

/** Spec §11 — relaxation/routine content, no efficacy promises. */
export const FACE_YOGA_ROUTINES: FaceYogaRoutine[] = [
  {
    id: "forehead-relax",
    title: "Forehead Relax",
    minutes: 2,
    focus: "이마 · 미간",
    steps: [
      "손가락 세 개를 눈썹 위에 올리고 가볍게 눌러요.",
      "천천히 위로 쓸어올리며 5초간 유지해요.",
      "미간을 좌우로 부드럽게 풀어줘요.",
    ],
  },
  {
    id: "jaw-release",
    title: "Jaw Release",
    minutes: 3,
    focus: "턱선 · 광대 아래",
    steps: [
      "턱 끝에서 귀 방향으로 천천히 쓸어올려요.",
      "어금니를 살짝 벌린 채 10초간 힘을 빼요.",
      "양쪽 각각 10회씩 반복해요.",
    ],
  },
  {
    id: "cheek-lift",
    title: "Cheek Lift Routine",
    minutes: 2,
    focus: "볼 · 팔자 주변",
    steps: [
      "입꼬리를 살짝 올린 채 5초 유지해요.",
      "볼 안쪽에 공기를 채워 좌우로 굴려요.",
      "손바닥으로 광대 아래를 감싸 올려요.",
    ],
  },
  {
    id: "eye-relax",
    title: "Eye Area Relax",
    minutes: 2,
    focus: "눈가",
    steps: [
      "눈을 감고 관자놀이를 원을 그리며 눌러요.",
      "약지로 눈 밑을 안쪽에서 바깥으로 쓸어요.",
      "먼 곳을 20초간 바라보며 마무리해요.",
    ],
  },
];

export interface ProductCategory {
  id: string;
  category: string;
  tags: string[];
  why: string;
}

/**
 * Spec §12 — rule-based candidate filter first, explanation second.
 * Categories, not brand-name prescriptions.
 */
export function recommendProductCategories(
  survey: Survey | null,
  today: DayRecord | null,
): ProductCategory[] {
  const out: ProductCategory[] = [];
  const sensitive = survey?.condition === "sensitive";
  const troubleLow = (today?.subScores.trouble ?? 100) < 65;
  const spotLow = (today?.subScores.spot ?? 100) < 65;
  const linesLow =
    Math.min(today?.subScores.forehead ?? 100, today?.subScores.nasolabial ?? 100) < 65;

  if (troubleLow || sensitive) {
    out.push({
      id: "mild-cleanser",
      category: "저자극 클렌저",
      tags: ["약산성", "무향", "논코메도제닉"],
      why: "트러블 추정치가 높게 나온 날에는 세정력이 강한 제품보다 자극이 적은 쪽이 피부 부담을 줄여줘요.",
    });
    out.push({
      id: "soothing-moisturizer",
      category: "진정 보습제",
      tags: ["판테놀", "센텔라", "세라마이드"],
      why: "붉은 기가 보일 때는 유분보다 진정과 장벽 보습에 집중하는 편이 잘 맞아요.",
    });
  }

  if (spotLow || survey?.outdoor === "heavy" || today?.sunExposure) {
    out.push({
      id: "sunscreen",
      category: "논코메도제닉 자외선 차단제",
      tags: ["SPF50+", "PA++++", "무기자차"],
      why: "잡티 추정치는 자외선 노출에 민감하게 반응해요. 매일 같은 시간에 바르는 것이 기록의 일관성에도 도움이 돼요.",
    });
  }

  if (linesLow) {
    out.push({
      id: "hydrating-serum",
      category: "수분 세럼",
      tags: ["히알루론산", "글리세린"],
      why: "건조할 때 잔주름이 더 도드라져 보여요. 수분을 채우면 라인이 완만해 보이는 데 도움이 될 수 있어요.",
    });
  }

  if (survey?.skinType === "dry") {
    out.push({
      id: "barrier-cream",
      category: "장벽 강화 크림",
      tags: ["세라마이드", "콜레스테롤"],
      why: "건성 타입은 수분이 날아가는 속도가 빨라, 마지막에 유분으로 덮어주는 단계가 필요해요.",
    });
  } else if (survey?.skinType === "oily") {
    out.push({
      id: "light-gel",
      category: "가벼운 젤 보습제",
      tags: ["오일프리", "논코메도제닉"],
      why: "지성 타입은 무거운 제형보다 가벼운 젤 타입이 모공 부담을 덜어줘요.",
    });
  }

  if (!out.length) {
    out.push({
      id: "keep-current",
      category: "지금 루틴 유지",
      tags: ["변화 없음"],
      why: "지표가 안정적이에요. 새 제품을 더하기보다 지금 루틴을 유지하는 편이 변화를 읽기 쉬워요.",
    });
  }

  return out;
}
