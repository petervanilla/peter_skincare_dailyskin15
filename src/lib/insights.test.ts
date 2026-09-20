import assert from "node:assert/strict";
import test from "node:test";
import { buildDemoRecords, DEMO_EXPERIMENT } from "./demo.ts";
import {
  biggestMover,
  buildInsights,
  experimentVerdict,
  habitStreak,
  nextExperimentSuggestion,
  splitMean,
} from "./insights.ts";
import { computeDailySkinScore, computeSubScores } from "./scoring.ts";
import { CHALLENGE_LENGTH } from "./types.ts";

const FIXED_TODAY = new Date("2026-09-20T12:00:00Z");

test("demo records are consistent with the scoring engine", () => {
  const records = buildDemoRecords(CHALLENGE_LENGTH, FIXED_TODAY);
  assert.equal(records.length, CHALLENGE_LENGTH);
  for (const r of records) {
    assert.deepEqual(r.subScores, computeSubScores(r.metrics));
    assert.equal(r.dailySkinScore, computeDailySkinScore(r.subScores));
  }
  // Days are consecutive and end today.
  assert.equal(records[records.length - 1].date, "2026-09-20");
  assert.equal(records[0].date, "2026-09-06");
  // The story the deck tells: a clear Day 1 → Day 15 improvement.
  assert.ok(records[14].dailySkinScore - records[0].dailySkinScore >= 10);
});

test("demo clamps to the 15-day programme", () => {
  assert.equal(buildDemoRecords(40, FIXED_TODAY).length, CHALLENGE_LENGTH);
  assert.equal(buildDemoRecords(0, FIXED_TODAY).length, 1);
});

test("experiment verdict reads the demo adaptation dip as improved overall", () => {
  const records = buildDemoRecords(CHALLENGE_LENGTH, FIXED_TODAY);
  const v = experimentVerdict(records, DEMO_EXPERIMENT);
  assert.ok(v);
  assert.equal(v.outcome, "improved");
  assert.ok(v.after > v.before);
  // First three days after the variable sit below the pre-window mean.
  assert.ok(v.firstThree < v.before);
});

test("experiment verdict is too-early with under three days of response", () => {
  const records = buildDemoRecords(5, FIXED_TODAY); // startDay 4 → 2 days observed
  const v = experimentVerdict(records, DEMO_EXPERIMENT);
  assert.equal(v?.outcome, "too-early");
  assert.equal(v?.daysObserved, 2);
});

test("routine split and habit streak reflect the check-ins", () => {
  const records = buildDemoRecords(12, FIXED_TODAY);
  const split = splitMean(records, (r) => r.routineDone);
  assert.equal(split.noCount, 2); // days 5 and 9 skipped
  assert.equal(split.yesCount, 10);
  // Touched face on day 8 → streak counts days 9–12.
  assert.equal(habitStreak(records, (r) => r.noTouch), 4);
});

test("insights lead with the Day-1 delta and name the experiment", () => {
  const records = buildDemoRecords(12, FIXED_TODAY);
  const insights = buildInsights(records, DEMO_EXPERIMENT);
  assert.ok(insights.length >= 3);
  assert.equal(insights[0].id, "delta-up");
  assert.ok(insights.some((i) => i.id === "exp-improved"));
  assert.ok(insights.some((i) => i.id === "routine-split"));
  // Trouble is the index the demo moves most.
  assert.equal(biggestMover(records)?.index, "trouble");
  // Wellness-first copy: nothing reads like a diagnosis.
  for (const i of insights) {
    assert.doesNotMatch(i.detail, /진단|치료|처방/);
  }
});

test("a single record yields no insights", () => {
  assert.deepEqual(buildInsights(buildDemoRecords(1, FIXED_TODAY), null), []);
});

test("next experiment keeps a variable that worked", () => {
  const records = buildDemoRecords(CHALLENGE_LENGTH, FIXED_TODAY);
  const next = nextExperimentSuggestion(records, DEMO_EXPERIMENT);
  assert.equal(next.kind, "observe");
  assert.match(next.title, /유지/);
});
