import {
  DEFAULT_BASELINE_AGE,
  type DayRecord,
  type RawMetrics,
  type SubScores,
  type Survey,
} from "./types.ts";

/**
 * Score weights, verbatim from spec §7-1:
 *   Trouble 30% + Spot/Freckle 25% + Nasolabial 20% + Forehead 15%
 *   + Capture consistency 10%
 */
export const SCORE_WEIGHTS = {
  trouble: 0.3,
  spot: 0.25,
  nasolabial: 0.2,
  forehead: 0.15,
  captureConsistency: 0.1,
} as const;

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));

/**
 * Maps a raw measurement onto 0–100 where higher is better.
 * `worst` is the reading that scores 0; `best` scores 100.
 */
function invertedScore(value: number, best: number, worst: number) {
  if (worst === best) return 100;
  const t = (value - best) / (worst - best);
  return clamp(100 * (1 - t));
}

export function computeSubScores(m: RawMetrics): SubScores {
  const trouble = invertedScore(m.troubleAreaRatio, 0.002, 0.06);
  const spot = invertedScore(m.spotDensity, 0.004, 0.09);
  const nasolabial = invertedScore(m.nasolabialProminence, 0.02, 0.18);
  const forehead = invertedScore(m.foreheadLineProminence, 0.02, 0.16);

  // Capture consistency rewards a sharp, well-exposed frame — the thing the
  // user can actually control, and the precondition for day-to-day comparison.
  const sharpnessScore = clamp((m.sharpness / 400) * 100);
  const exposureScore = clamp(100 - Math.abs(m.exposure - 135) * 1.1);
  const captureConsistency = clamp(sharpnessScore * 0.5 + exposureScore * 0.5);

  return {
    trouble: Math.round(trouble),
    spot: Math.round(spot),
    nasolabial: Math.round(nasolabial),
    forehead: Math.round(forehead),
    captureConsistency: Math.round(captureConsistency),
  };
}

export function computeDailySkinScore(s: SubScores): number {
  const raw =
    s.trouble * SCORE_WEIGHTS.trouble +
    s.spot * SCORE_WEIGHTS.spot +
    s.nasolabial * SCORE_WEIGHTS.nasolabial +
    s.forehead * SCORE_WEIGHTS.forehead +
    s.captureConsistency * SCORE_WEIGHTS.captureConsistency;
  return Math.round(clamp(raw));
}

/**
 * Visual Skin Age Index (spec §7-2).
 *
 * Deliberately named "index" and always presented as a reference figure —
 * never a biological or medical age. A score of 75 lands on the user's own
 * stated age; every 10 points moves the index by ~3 years.
 */
export function computeSkinAgeIndex(score: number, survey: Survey | null): number {
  const baseline = survey?.age ?? DEFAULT_BASELINE_AGE;
  const delta = (75 - score) * 0.3;
  return Math.max(10, Math.round(baseline + delta));
}

export interface Delta {
  value: number;
  percent: number;
  /** true when the change is an improvement for the user. */
  improved: boolean;
}

export function scoreDelta(current: number, previous: number | null): Delta | null {
  if (previous === null) return null;
  const value = current - previous;
  const percent = previous === 0 ? 0 : Math.round((value / previous) * 100);
  return { value: Math.round(value), percent, improved: value >= 0 };
}

/** For counts (trouble/spots/lines) a *decrease* is the improvement. */
export function countDelta(current: number, previous: number | null): Delta | null {
  if (previous === null) return null;
  const value = current - previous;
  const percent = previous === 0 ? 0 : Math.round((value / previous) * 100);
  return { value, percent, improved: value <= 0 };
}

export function findRecord(records: DayRecord[], day: number) {
  return records.find((r) => r.day === day) ?? null;
}

export function latestRecord(records: DayRecord[]) {
  if (!records.length) return null;
  return records.reduce((a, b) => (b.day > a.day ? b : a));
}

export function firstRecord(records: DayRecord[]) {
  if (!records.length) return null;
  return records.reduce((a, b) => (b.day < a.day ? b : a));
}

export function previousRecord(records: DayRecord[], day: number) {
  const earlier = records.filter((r) => r.day < day);
  if (!earlier.length) return null;
  return earlier.reduce((a, b) => (b.day > a.day ? b : a));
}

/** Consecutive days ending at the most recent record. */
export function currentStreak(records: DayRecord[]): number {
  if (!records.length) return 0;
  const days = [...new Set(records.map((r) => r.day))].sort((a, b) => a - b);
  let streak = 1;
  for (let i = days.length - 1; i > 0; i--) {
    if (days[i] - days[i - 1] === 1) streak++;
    else break;
  }
  return streak;
}

export const SUB_SCORE_LABELS: Record<keyof SubScores, string> = {
  trouble: "트러블",
  spot: "잡티 · 색소",
  nasolabial: "팔자 라인",
  forehead: "이마 주름",
  captureConsistency: "촬영 일관성",
};
