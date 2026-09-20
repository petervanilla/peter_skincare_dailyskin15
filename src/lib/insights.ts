import { currentStreak, firstRecord, latestRecord, SUB_SCORE_LABELS } from "./scoring.ts";
import type { DayRecord, Experiment, SubScores } from "./types.ts";

/**
 * Skin Coach — the rule-based "LEARN" step of the deck's core loop
 * (SCAN → SCORE → CARE → COMPARE → LEARN → NEXT 15 DAYS).
 *
 * Every insight is a *visible estimate* phrased as an observation about the
 * user's own record, never a diagnosis and never a product claim. Rules are
 * evaluated in priority order and the caller decides how many to show.
 */

export type InsightTone = "positive" | "neutral" | "warning";

export interface Insight {
  id: string;
  tone: InsightTone;
  /** Material Symbols name. */
  icon: string;
  title: string;
  detail: string;
}

type SkinIndex = keyof Omit<SubScores, "captureConsistency">;
const SKIN_INDICES: SkinIndex[] = ["trouble", "spot", "nasolabial", "forehead"];

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round1 = (x: number) => Math.round(x * 10) / 10;
const signed = (x: number) => `${x > 0 ? "+" : ""}${x}`;

/** Mean Daily Skin Score on days where `pick` answered true vs false. */
export function splitMean(records: DayRecord[], pick: (r: DayRecord) => boolean | undefined) {
  const yes = records.filter((r) => pick(r) === true).map((r) => r.dailySkinScore);
  const no = records.filter((r) => pick(r) === false).map((r) => r.dailySkinScore);
  return { yes: mean(yes), no: mean(no), yesCount: yes.length, noCount: no.length };
}

export interface ExperimentVerdict {
  /** "improved" | "worsened" | "flat" | "too-early" */
  outcome: "improved" | "worsened" | "flat" | "too-early";
  /**
   * Mean score in the window before the variable vs the *settled* window
   * after it (the most recent five days), so an adaptation dip in the first
   * days does not decide the whole experiment.
   */
  before: number;
  after: number;
  /** Mean of the first three days after start, for the adaptation-dip rule. */
  firstThree: number;
  daysObserved: number;
}

/**
 * Compares the score window before the experiment started with the settled
 * window after it. A 3-day minimum after the start keeps a single noisy
 * capture from calling the whole experiment.
 */
export function experimentVerdict(
  records: DayRecord[],
  experiment: Experiment | null,
): ExperimentVerdict | null {
  if (!experiment) return null;
  const sorted = [...records].sort((a, b) => a.day - b.day);
  const before = sorted.filter((r) => r.day < experiment.startDay);
  const after = sorted.filter((r) => r.day >= experiment.startDay);
  const firstThree = after.slice(0, 3).map((r) => r.dailySkinScore);
  const daysObserved = after.length;

  // With no pre-window (variable from Day 1) the baseline is Day 1 itself.
  const beforeMean = before.length ? mean(before.map((r) => r.dailySkinScore)) : (sorted[0]?.dailySkinScore ?? 0);
  const afterMean = mean(after.slice(-5).map((r) => r.dailySkinScore));

  if (daysObserved < 3) {
    return { outcome: "too-early", before: round1(beforeMean), after: round1(afterMean), firstThree: round1(mean(firstThree)), daysObserved };
  }
  const diff = afterMean - beforeMean;
  const outcome = diff >= 3 ? "improved" : diff <= -3 ? "worsened" : "flat";
  return { outcome, before: round1(beforeMean), after: round1(afterMean), firstThree: round1(mean(firstThree)), daysObserved };
}

/** Which index moved most since Day 1, and by how much (score points). */
export function biggestMover(records: DayRecord[]): { index: SkinIndex; delta: number } | null {
  const first = firstRecord(records);
  const latest = latestRecord(records);
  if (!first || !latest || first.day === latest.day) return null;
  let best: { index: SkinIndex; delta: number } | null = null;
  for (const index of SKIN_INDICES) {
    const delta = latest.subScores[index] - first.subScores[index];
    if (!best || Math.abs(delta) > Math.abs(best.delta)) best = { index, delta };
  }
  return best;
}

/** Consecutive answered-true days for a habit, ending at the latest record. */
export function habitStreak(records: DayRecord[], pick: (r: DayRecord) => boolean | undefined) {
  const sorted = [...records].sort((a, b) => a.day - b.day);
  let streak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (pick(sorted[i]) === true) streak++;
    else break;
  }
  return streak;
}

export function buildInsights(records: DayRecord[], experiment: Experiment | null): Insight[] {
  const sorted = [...records].sort((a, b) => a.day - b.day);
  const first = firstRecord(sorted);
  const latest = latestRecord(sorted);
  const out: Insight[] = [];
  if (!first || !latest) return out;

  // 1. Headline delta since Day 1.
  const delta = latest.dailySkinScore - first.dailySkinScore;
  if (latest.day > first.day) {
    if (delta >= 3) {
      out.push({
        id: "delta-up",
        tone: "positive",
        icon: "trending_up",
        title: `Day 1보다 ${signed(delta)}점`,
        detail: `${latest.day - first.day}일 동안 종합 점수가 ${first.dailySkinScore} → ${latest.dailySkinScore}로 움직였어요. 사진에서 보이는 추정치예요.`,
      });
    } else if (delta <= -3) {
      out.push({
        id: "delta-down",
        tone: "warning",
        icon: "trending_down",
        title: `Day 1보다 ${signed(delta)}점`,
        detail: "아직 실험 초반이거나 촬영 조건이 흔들렸을 수 있어요. 같은 자리, 같은 조명을 유지해 주세요.",
      });
    } else {
      out.push({
        id: "delta-flat",
        tone: "neutral",
        icon: "trending_flat",
        title: "Day 1과 비슷한 수준",
        detail: "큰 변화는 아직 없어요. 15일을 채워야 흐름이 보여요.",
      });
    }
  }

  // 2. Experiment response window.
  const verdict = experimentVerdict(sorted, experiment);
  if (experiment && verdict) {
    if (verdict.outcome === "too-early") {
      out.push({
        id: "exp-early",
        tone: "neutral",
        icon: "science",
        title: `'${experiment.title}' 반응 관찰 중`,
        detail: `Day ${experiment.startDay}부터 ${verdict.daysObserved}일 기록됐어요. 3일은 지켜봐야 흐름을 읽을 수 있어요.`,
      });
    } else if (verdict.outcome === "improved") {
      const dipped = verdict.firstThree < verdict.before - 1;
      out.push({
        id: "exp-improved",
        tone: "positive",
        icon: "science",
        title: `'${experiment.title}' 이후 평균 ${signed(round1(verdict.after - verdict.before))}점`,
        detail: dipped
          ? `도입 직후 3일은 잠깐 내려갔다가(평균 ${verdict.firstThree}) 이후 회복했어요. 적응기를 지난 뒤의 흐름이 더 중요해요.`
          : `도입 전 평균 ${verdict.before} → 이후 평균 ${verdict.after}. 이 변수는 다음 15일에도 유지해 볼 만해요.`,
      });
    } else if (verdict.outcome === "worsened") {
      out.push({
        id: "exp-worsened",
        tone: "warning",
        icon: "science",
        title: `'${experiment.title}' 이후 평균 ${signed(round1(verdict.after - verdict.before))}점`,
        detail: "도입 후 흐름이 내려갔어요. 3일 이상 반복되면 다음 실험에서는 이 변수를 빼고 관찰해 보세요.",
      });
    } else {
      out.push({
        id: "exp-flat",
        tone: "neutral",
        icon: "science",
        title: `'${experiment.title}'는 아직 차이가 뚜렷하지 않아요`,
        detail: `도입 전 평균 ${verdict.before} → 이후 평균 ${verdict.after}. 변화 폭이 작아요. 15일을 채운 뒤 판단해요.`,
      });
    }
  }

  // 3. Routine days vs off days.
  const routine = splitMean(sorted, (r) => r.routineDone);
  if (routine.yesCount >= 2 && routine.noCount >= 1) {
    const diff = round1(routine.yes - routine.no);
    if (Math.abs(diff) >= 1) {
      out.push({
        id: "routine-split",
        tone: diff > 0 ? "positive" : "neutral",
        icon: "favorite",
        title: diff > 0 ? `루틴을 지킨 날 평균 ${signed(diff)}점` : "루틴 여부와 점수 차이가 작아요",
        detail:
          diff > 0
            ? `루틴한 날 ${routine.yesCount}일 평균 ${round1(routine.yes)}, 건너뛴 날 ${routine.noCount}일 평균 ${round1(routine.no)}. 꾸준함이 숫자로 보이고 있어요.`
            : `루틴한 날 평균 ${round1(routine.yes)}, 건너뛴 날 평균 ${round1(routine.no)}. 조금 더 기록이 쌓이면 또렷해질 거예요.`,
      });
    }
  }

  // 4. Biggest moving index.
  const mover = biggestMover(sorted);
  if (mover && Math.abs(mover.delta) >= 4) {
    const label = SUB_SCORE_LABELS[mover.index];
    out.push({
      id: `mover-${mover.index}`,
      tone: mover.delta > 0 ? "positive" : "warning",
      icon: mover.delta > 0 ? "auto_awesome" : "priority_high",
      title: `${label} 지표가 가장 많이 ${mover.delta > 0 ? "좋아졌어요" : "내려갔어요"} (${signed(mover.delta)})`,
      detail:
        mover.delta > 0
          ? `네 지표 중 ${label}이(가) 가장 크게 움직였어요. 지금 루틴이 이 부분에 잘 맞고 있어요.`
          : `${label} 쪽이 내려가고 있어요. 오늘의 케어에서 이 부분을 우선으로 챙겨요.`,
    });
  }

  // 5. Capture consistency guard — the precondition for everything above.
  const lastThree = sorted.slice(-3);
  const shaky = lastThree.filter((r) => r.subScores.captureConsistency < 70).length;
  if (lastThree.length >= 2 && shaky >= 2) {
    out.push({
      id: "capture-shaky",
      tone: "warning",
      icon: "photo_camera",
      title: "최근 촬영 조건이 흔들렸어요",
      detail: "최근 3일 중 2일이 조명·초점 일관성 70점 아래예요. 비교 정확도를 위해 같은 자리, 같은 시간에 찍어 주세요.",
    });
  }

  // 6. No-Touch habit.
  const noTouch = habitStreak(sorted, (r) => r.noTouch);
  if (noTouch >= 5) {
    out.push({
      id: "no-touch",
      tone: "positive",
      icon: "back_hand",
      title: `${noTouch}일째 얼굴 안 만지기 성공`,
      detail: "손이 얼굴에 닿는 횟수가 줄면 자극도 줄어요. 트러블 지표 흐름과 같이 보세요.",
    });
  }

  // 7. Streak nudge.
  const streak = currentStreak(sorted);
  if (streak >= 7 && !out.some((i) => i.id === "no-touch")) {
    out.push({
      id: "streak",
      tone: "positive",
      icon: "local_fire_department",
      title: `${streak}일 연속 기록`,
      detail: "같은 조건으로 계속 찍는 것 자체가 이 앱의 가장 큰 자산이에요.",
    });
  }

  return out;
}

/** The "NEXT 15 DAYS" recommendation shown on the Day-15 report. */
export function nextExperimentSuggestion(
  records: DayRecord[],
  experiment: Experiment | null,
): { title: string; detail: string; kind: Experiment["kind"] } {
  const verdict = experimentVerdict(records, experiment);
  const mover = biggestMover(records);

  if (experiment && verdict?.outcome === "worsened") {
    return {
      kind: "remove-product",
      title: `'${experiment.title}' 빼고 관찰하기`,
      detail: "도입 후 흐름이 내려갔으니, 다음 15일은 이 변수를 뺀 상태를 기준선으로 다시 잡아요.",
    };
  }
  if (experiment && verdict?.outcome === "improved") {
    return {
      kind: "observe",
      title: `'${experiment.title}' 유지 + 아무것도 더하지 않기`,
      detail: "효과가 보인 변수는 그대로 두고, 이번엔 새 변수를 넣지 않은 채 안정되는지 확인해요.",
    };
  }
  if (mover && mover.delta < 0) {
    return {
      kind: "add-product",
      title: `${SUB_SCORE_LABELS[mover.index]} 지표를 위한 제품 1개만 추가`,
      detail: "가장 많이 내려간 지표 하나를 겨냥해 제품 1개만 바꿔요. 두 개를 바꾸면 무엇이 원인인지 알 수 없어요.",
    };
  }
  return {
    kind: "habit",
    title: "생활 습관 하나만 바꿔 보기",
    detail: "제품 대신 수면·물·얼굴 안 만지기 중 하나를 골라 15일간 지켜요. 피부 반응은 습관에도 남아요.",
  };
}
