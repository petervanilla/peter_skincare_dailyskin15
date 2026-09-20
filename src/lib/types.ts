export type SkinConcern =
  | "trouble"
  | "redness"
  | "spots"
  | "texture"
  | "wrinkles"
  | "elasticity";

export type SkinType = "dry" | "oily" | "combination" | "unknown";

export type SkinCondition = "great" | "normal" | "sensitive";

export type OutdoorExposure = "none" | "light" | "heavy";

export type SleepQuality = "good" | "normal" | "poor";

export interface Survey {
  concerns: SkinConcern[];
  skinType: SkinType;
  condition: SkinCondition;
  outdoor: OutdoorExposure;
  products: string[];
  sleep?: SleepQuality;
  /**
   * Optional. Only used as the baseline for the Visual Skin Age Index —
   * never for anything diagnostic. Falls back to DEFAULT_BASELINE_AGE.
   */
  age?: number;
}

/** The five guided capture angles from the spec (§5-1). */
export type PoseId = "front" | "left30" | "right30" | "chinUp" | "chinDown";

export interface Pose {
  id: PoseId;
  label: string;
  instruction: string;
  /** What this angle is captured for, shown as the sub-caption. */
  purpose: string;
}

export const POSES: Pose[] = [
  {
    id: "front",
    label: "정면",
    instruction: "정면을 보고 무표정을 유지해주세요",
    purpose: "전체 피부 톤 · 트러블",
  },
  {
    id: "left30",
    label: "왼쪽 30°",
    instruction: "고개를 왼쪽으로 천천히 돌려주세요",
    purpose: "왼쪽 볼 · 턱선",
  },
  {
    id: "right30",
    label: "오른쪽 30°",
    instruction: "고개를 오른쪽으로 천천히 돌려주세요",
    purpose: "오른쪽 볼 · 턱선",
  },
  {
    id: "chinUp",
    label: "턱 들기",
    instruction: "턱을 살짝 들어주세요",
    purpose: "턱 · 팔자 · 목 경계",
  },
  {
    id: "chinDown",
    label: "턱 내리기",
    instruction: "턱을 살짝 내려주세요",
    purpose: "이마 · 미간 텍스처",
  },
];

/** Raw measurements pulled straight out of the pixels, before scoring. */
export interface RawMetrics {
  /** Share of ROI pixels flagged as visible trouble (0–1). */
  troubleAreaRatio: number;
  /** Estimated count of distinct visible trouble spots. */
  troubleCount: number;
  /** Share of ROI pixels flagged as pigmented spots (0–1). */
  spotDensity: number;
  spotCount: number;
  /** Left/right cheek spot split, for the distribution heatmap. */
  spotBalance: { left: number; right: number };
  /** Mean edge energy in the nasolabial ROI (higher = more prominent). */
  nasolabialProminence: number;
  nasolabialSymmetry: number;
  /** Mean horizontal-line energy in the forehead ROI. */
  foreheadLineProminence: number;
  foreheadLineCount: number;
  /** Capture quality inputs. */
  sharpness: number;
  exposure: number;
}

/** 0–100, higher is better, for every index. */
export interface SubScores {
  trouble: number;
  spot: number;
  nasolabial: number;
  forehead: number;
  captureConsistency: number;
}

export interface DayRecord {
  /** 1–15 */
  day: number;
  /** ISO date (yyyy-mm-dd) the capture was taken. */
  date: string;
  metrics: RawMetrics;
  subScores: SubScores;
  dailySkinScore: number;
  skinAgeIndex: number;
  /** IndexedDB keys for the five captured photos. */
  photoKeys: Partial<Record<PoseId, string>>;
  /** Self-reported context for the day, used by the recommendation rules. */
  sunExposure?: boolean;
  completedActions: string[];
  /**
   * Daily check-in (deck "Routine + Product History"). Each is a tri-state:
   * undefined = not answered, true/false = answered. The Response Graph and
   * Skin Coach only reason over answered days.
   */
  routineDone?: boolean;
  /** Whether today's routine included the variable under experiment. */
  experimentApplied?: boolean;
  /** "얼굴 만지지 않기" habit — the No-Touch streak on Progress. */
  noTouch?: boolean;
}

/** What the user is changing for this 15-day cycle — one variable only. */
export type ExperimentKind =
  | "add-product"
  | "remove-product"
  | "routine-change"
  | "habit"
  | "observe";

export interface Experiment {
  id: string;
  kind: ExperimentKind;
  /** Short, user-facing name. e.g. "논코메도제닉 선크림 추가" */
  title: string;
  /** Day (1–15) the variable was introduced. 1 = from the very start. */
  startDay: number;
  /** Which of the four indices the user expects to move. */
  target?: keyof Omit<SubScores, "captureConsistency">;
  createdAt: string;
}

export const EXPERIMENT_KIND_LABELS: Record<ExperimentKind, string> = {
  "add-product": "제품 1개 추가",
  "remove-product": "제품 1개 빼기",
  "routine-change": "루틴 순서/시간 바꾸기",
  habit: "생활 습관 하나 바꾸기",
  observe: "아무것도 바꾸지 않고 관찰만",
};

/**
 * A finished 15-day cycle, kept so Skin Memory outlives a single challenge.
 * Photo keys stay valid as long as the IndexedDB store is not cleared.
 */
export interface CompletedCycle {
  id: string;
  startedAt: string;
  completedAt: string;
  experiment: Experiment | null;
  records: DayRecord[];
  scoreStart: number;
  scoreEnd: number;
}

/** A cover photo the user picked for the dashboard, framed by hand. */
export interface HeroPhoto {
  /** Key into the IndexedDB photo store. */
  key: string;
  /** `object-position`, in percent — 50/50 is centred. */
  x: number;
  y: number;
}

export interface AppState {
  survey: Survey | null;
  onboardedAt: string | null;
  records: DayRecord[];
  /** Days on which the user completed a capture, for the streak counter. */
  challengeJoined: boolean;
  nickname: string;
  heroPhoto: HeroPhoto | null;
  /** IndexedDB key for a user-uploaded profile photo; null uses the stock avatar. */
  avatarPhotoKey: string | null;
  /** The single variable being tested in the current cycle, if any. */
  experiment: Experiment | null;
  /** Earlier cycles, newest last. */
  cycles: CompletedCycle[];
  /** Invite code of the friends challenge the user joined or created. */
  inviteCode: string | null;
}

export const DEFAULT_BASELINE_AGE = 28;

export const CHALLENGE_LENGTH = 15;

export const CONCERN_LABELS: Record<SkinConcern, string> = {
  trouble: "트러블",
  redness: "붉은기",
  spots: "잡티/주근깨",
  texture: "피부결",
  wrinkles: "주름",
  elasticity: "탄력",
};

export const SKIN_TYPE_LABELS: Record<SkinType, string> = {
  dry: "건성",
  oily: "지성",
  combination: "복합성",
  unknown: "잘 모르겠음",
};

export const CONDITION_LABELS: Record<SkinCondition, string> = {
  great: "매우 좋음",
  normal: "보통",
  sensitive: "예민함",
};

export const OUTDOOR_LABELS: Record<OutdoorExposure, string> = {
  none: "거의 실내",
  light: "가벼운 외출",
  heavy: "장시간 야외활동",
};

export const SLEEP_LABELS: Record<SleepQuality, string> = {
  good: "잘 잤어요",
  normal: "보통이에요",
  poor: "부족해요",
};
