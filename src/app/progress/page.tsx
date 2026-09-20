"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BeforeAfterCompare } from "@/components/BeforeAfterCompare";
import { BottomNav } from "@/components/BottomNav";
import { CoachCard } from "@/components/CoachCard";
import { HabitTiles } from "@/components/HabitTiles";
import { Icon } from "@/components/Icon";
import { ProductRecommendations } from "@/components/ProductRecommendations";
import { StoredPhoto } from "@/components/StoredPhoto";
import { TrendChart } from "@/components/TrendChart";
import { IMG } from "@/lib/assets";
import { buildInsights, experimentVerdict, splitMean } from "@/lib/insights";
import { countDelta, firstRecord, latestRecord, SUB_SCORE_LABELS } from "@/lib/scoring";
import { useStore } from "@/lib/store";
import { CHALLENGE_LENGTH, type DayRecord, type Experiment, type SubScores } from "@/lib/types";

/** 15일 Tracking (spec §8) — ported from design/screens/10-progress-day7. */
export default function ProgressPage() {
  return (
    <Suspense fallback={<div className="p-margin-main">불러오는 중…</div>}>
      <ProgressContent />
    </Suspense>
  );
}

function ProgressContent() {
  const { state, hydrated, nextDay } = useStore();
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const [tab, setTab] = useState<TabId>(isTabId(tabParam) ? tabParam : "journey");
  const dayParam = Number.parseInt(params.get("day") ?? "", 10);
  const highlightDay = Number.isFinite(dayParam) ? dayParam : null;

  if (!hydrated) return <div className="p-margin-main">불러오는 중…</div>;

  const records = [...state.records].sort((a, b) => a.day - b.day);
  const latest = latestRecord(records);
  const first = firstRecord(records);
  const experiment = state.experiment;
  const insights = buildInsights(records, experiment);

  if (!latest || !first) {
    return (
      <div className="min-h-dvh pb-32">
        <AppHeader />
        <div className="flex flex-col items-center justify-center gap-4 px-margin-main pt-20 text-center">
          <Icon name="insights" size={48} className="text-outline" />
          <p className="font-body-md text-body-md text-on-surface-variant">
            기록이 쌓이면 여기에서 변화를 볼 수 있어요.
          </p>
          <Link
            href="/scan"
            className="rounded-full bg-primary px-6 py-3 font-label-bold text-label-bold text-pure-white transition-colors hover:bg-primary-container active:bg-primary-container"
          >
            첫 촬영 시작하기
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-32">
      <AppHeader />

      <main className="px-margin-main pt-2">
        {/* "15일의 여정" header — same lavender fill (tertiary-fixed /
            on-tertiary-fixed) as the Leaderboard's "내 기여도" card, for a
            consistent boxed-hero treatment across pages. */}
        <section className="mb-6 rounded-[24px] bg-tertiary-fixed p-6 text-on-tertiary-fixed">
          {/* Sourced from records.length — the same count THE JOURNEY's
              checkmarks and the streak tile below use — so this number can
              never drift from either of them. */}
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile">
            Day {records.length} of {CHALLENGE_LENGTH}
          </h2>
          <p className="mt-1 font-body-md text-body-md text-on-tertiary-fixed/70">
            {records.length >= CHALLENGE_LENGTH
              ? "15일을 완주했어요!"
              : records.length >= CHALLENGE_LENGTH / 2
                ? "와~ 이제 반환점을 돌았어요!"
                : "기록이 쌓일수록 변화가 또렷해져요."}
          </p>
        </section>

        <TabStrip active={tab} onChange={setTab} />

        <div className="rounded-[24px] bg-pure-white/45 p-4 backdrop-blur-xl">
          {tab === "compare" ? (
            <BeforeAfterCompare records={records} />
          ) : tab === "products" ? (
            <ProductRecommendations />
          ) : tab === "coach" ? (
            <CoachTab insights={insights} latestDay={latest.day} />
          ) : (
            <div className="flex flex-col gap-4">
        {/* THE JOURNEY — day chips, per the approved comp */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <SectionLabel>The Journey</SectionLabel>
            <span className="rounded-full bg-surface-container px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
              {Math.round((records.length / CHALLENGE_LENGTH) * 100)}% Complete
            </span>
          </div>
          <DayGrid
            completed={records.map((r) => r.day)}
            next={nextDay}
            highlight={highlightDay}
          />
        </section>

        {/* Growth-loop quartet (deck slide 12): compete with yesterday */}
        <HabitTiles records={records} challengeJoined={state.challengeJoined} />

        {/* PROGRESS GALLERY */}
        <section>
          <SectionLabel className="mb-4">Progress Gallery</SectionLabel>
          <div className="rounded-[24px] bg-pure-white p-4 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
            <div className="no-scrollbar flex gap-3 overflow-x-auto">
              {records.map((r, i) => {
                const isLatest = r.day === latest.day;
                return (
                  <Link
                    key={r.day}
                    href={`/analysis?day=${r.day}`}
                    className="shrink-0 transition-opacity hover:opacity-80 active:opacity-60"
                  >
                    <div
                      className={`relative h-20 w-20 overflow-hidden rounded-2xl bg-surface-container ${
                        isLatest ? "ring-2 ring-primary ring-offset-2 ring-offset-pure-white" : ""
                      }`}
                    >
                      <StoredPhoto
                        photoKey={r.photoKeys.front ?? Object.values(r.photoKeys)[0]}
                        alt={`Day ${r.day}`}
                        className="h-full w-full object-cover"
                        fallback={
                          <Image
                            src={IMG.progressGallery[i % IMG.progressGallery.length]}
                            alt={`Day ${r.day}`}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        }
                      />
                      {isLatest ? (
                        <span className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-pure-white/90">
                          <Icon name="star" filled size={12} className="text-primary" />
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-center font-label-sm text-label-sm text-on-surface-variant">
                      D-{r.day}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[24px] bg-pure-white p-5 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
          <h3 className="mb-4 font-label-bold text-label-bold text-on-surface">
            점수 & 지표별 15일 변화 추이
          </h3>
          <TrendChart
            records={records.map((r) => ({
              day: r.day,
              dailySkinScore: r.dailySkinScore,
              subScores: r.subScores,
            }))}
            experimentStartDay={experiment?.startDay}
            experimentTitle={experiment?.title}
            routineDays={Object.fromEntries(records.map((r) => [r.day, r.routineDone]))}
          />
        </section>

        <ResponseTile records={records} experiment={experiment} />

        <section className="rounded-[24px] bg-pure-white p-5 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
          <h3 className="mb-4 font-label-bold text-label-bold text-on-surface">지표별 변화</h3>
          <div className="flex flex-col gap-4">
            {(Object.keys(SUB_SCORE_LABELS) as Array<keyof SubScores>).map((key) => {
              const now = latest.subScores[key];
              const then = first.subScores[key];
              const diff = now - then;
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-label-bold text-label-bold text-on-surface">
                      {SUB_SCORE_LABELS[key]}
                    </span>
                    <span
                      className={`font-label-sm text-label-sm ${
                        diff >= 0 ? "text-primary" : "text-error"
                      }`}
                    >
                      {now} ({diff > 0 ? "+" : ""}
                      {diff})
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${now}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[24px] bg-secondary-container p-5">
          <h3 className="mb-3 font-label-bold text-label-bold text-primary">추정치 변화</h3>
          <ul className="flex flex-col gap-2 font-body-md text-body-md text-primary">
            <EstimateRow
              label="Visible Trouble"
              from={first.metrics.troubleCount}
              to={latest.metrics.troubleCount}
            />
            <EstimateRow
              label="Visible Spot"
              from={first.metrics.spotCount}
              to={latest.metrics.spotCount}
            />
            <EstimateRow
              label="Forehead Line"
              from={first.metrics.foreheadLineCount}
              to={latest.metrics.foreheadLineCount}
            />
          </ul>
          <p className="mt-3 font-label-sm text-label-sm text-primary/70">
            모두 사진에서 보이는 추정치예요. 진단이 아닙니다.
          </p>
        </section>

              <Link
                href="/scan"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-bold text-label-bold text-pure-white shadow-md transition-opacity hover:opacity-90 active:scale-95"
              >
                <Icon name="photo_camera" size={18} />
                오늘의 {nextDay}일차 기록 준비하기
              </Link>

              <button
                type="button"
                onClick={() => setTab("compare")}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-pure-white py-4 font-label-bold text-label-bold text-primary transition-colors hover:bg-surface-container-low active:scale-95"
              >
                <Icon name="compare" size={18} />
                Before / After 비교하기
              </button>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

/** Small caps section heading that sits on the background, not inside a card. */
function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h3
      className={`font-label-bold text-label-bold tracking-[0.12em] text-primary uppercase ${className}`}
    >
      {children}
    </h3>
  );
}

/**
 * All fifteen days as chips: mint with a check for days already recorded, solid
 * green for the day due next, lavender for the ones still ahead. A `highlight`
 * day (arrived via `?day=` from Today's DayStrip) gets a ring on top of
 * whichever of those colors it already has, and scrolls into view.
 */
function DayGrid({
  completed,
  next,
  highlight,
}: {
  completed: number[];
  next: number;
  highlight?: number | null;
}) {
  const days = Array.from({ length: CHALLENGE_LENGTH }, (_, i) => i + 1);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlight) highlightRef.current?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  return (
    <div className="grid grid-cols-8 gap-x-1 gap-y-3">
      {days.map((day) => {
        const done = completed.includes(day);
        const isNext = !done && day === next;
        const isHighlighted = day === highlight;

        return (
          <div
            key={day}
            ref={isHighlighted ? highlightRef : undefined}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={`flex aspect-square w-full max-w-9 items-center justify-center rounded-full font-label-bold text-label-bold transition-all ${
                done
                  ? "bg-secondary-container text-primary"
                  : isNext
                    ? "bg-primary text-pure-white shadow-md"
                    : "bg-tertiary-fixed text-on-tertiary-fixed-variant"
              } ${isHighlighted ? "ring-2 ring-tertiary-container ring-offset-2 ring-offset-pure-white" : ""}`}
            >
              {done ? <Icon name="check" size={16} /> : day}
            </div>
            <span
              className={`font-label-sm text-[10px] ${
                isHighlighted ? "font-bold text-tertiary-container" : "text-on-surface-variant"
              }`}
            >
              D{day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

type TabId = "journey" | "compare" | "products" | "coach";

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: "journey", label: "변화 추이", icon: "insights" },
  { id: "compare", label: "Before / After", icon: "compare" },
  { id: "products", label: "제품 추천", icon: "shopping_bag" },
  { id: "coach", label: "Skin Coach", icon: "psychology" },
];

function isTabId(v: string | null): v is TabId {
  return TABS.some((t) => t.id === v);
}

/**
 * Response Graph, in numbers: the deck's "제품 × 루틴 × 피부 반응". Routine
 * days vs off days, and the experiment's before/after window once it has
 * enough days to say anything.
 */
function ResponseTile({ records, experiment }: { records: DayRecord[]; experiment: Experiment | null }) {
  const routine = splitMean(records, (r) => r.routineDone);
  const hasRoutine = routine.yesCount >= 2 && routine.noCount >= 1;
  const verdict = experimentVerdict(records, experiment);
  const hasVerdict = experiment && verdict && verdict.outcome !== "too-early";
  const r1 = (x: number) => Math.round(x * 10) / 10;
  const diff = r1(routine.yes - routine.no);
  const expDiff = verdict ? r1(verdict.after - verdict.before) : 0;

  return (
    <section className="rounded-[24px] bg-pure-white p-5 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-label-bold text-label-bold text-on-surface">Response</h3>
        <span className="font-label-sm text-[11px] text-on-surface-variant">루틴 × 실험 × 피부 반응</span>
      </div>

      {hasRoutine ? (
        <div className="flex items-stretch gap-2">
          <div className="flex-1 rounded-2xl bg-secondary-container p-3">
            <p className="font-label-sm text-label-sm text-primary/70">루틴한 날 평균</p>
            <p className="font-headline-md text-headline-md text-primary">{r1(routine.yes)}</p>
            <p className="font-label-sm text-[10px] text-primary/60">{routine.yesCount}일</p>
          </div>
          <div className="flex-1 rounded-2xl bg-surface-container-low p-3">
            <p className="font-label-sm text-label-sm text-on-surface-variant">건너뛴 날 평균</p>
            <p className="font-headline-md text-headline-md text-on-surface">{r1(routine.no)}</p>
            <p className="font-label-sm text-[10px] text-on-surface-variant/70">{routine.noCount}일</p>
          </div>
          <div className="flex w-16 shrink-0 flex-col items-center justify-center">
            <span
              className={`rounded-full px-2 py-1 font-label-bold text-label-bold ${
                diff > 0 ? "bg-primary-fixed text-primary" : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {diff > 0 ? "+" : ""}
              {diff}
            </span>
            <span className="mt-1 font-label-sm text-[10px] text-on-surface-variant">차이</span>
          </div>
        </div>
      ) : (
        <p className="rounded-2xl bg-surface-container-low p-3 font-label-sm text-label-sm text-on-surface-variant">
          루틴 체크인이 쌓이면 루틴 효과가 숫자로 보여요.
        </p>
      )}

      {hasVerdict ? (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-tertiary-fixed-dim/50 bg-tertiary-fixed/30 p-3">
          <Icon name="science" size={18} className="shrink-0 text-tertiary-container" />
          <p className="min-w-0 flex-1 break-keep font-label-sm text-label-sm text-on-tertiary-fixed">
            <span className="font-label-bold text-label-bold">&lsquo;{experiment.title}&rsquo;</span> 전 평균{" "}
            {verdict.before} → 후 평균 {verdict.after}
          </p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 font-label-bold text-label-bold ${
              expDiff > 0
                ? "bg-primary-fixed text-primary"
                : expDiff < 0
                  ? "bg-[#fff4d6] text-[#7a4b00]"
                  : "bg-surface-container text-on-surface-variant"
            }`}
          >
            {expDiff > 0 ? "+" : ""}
            {expDiff}
          </span>
        </div>
      ) : experiment ? (
        <p className="mt-3 font-label-sm text-[11px] text-on-surface-variant/70">
          &lsquo;{experiment.title}&rsquo;는 Day {experiment.startDay}부터 3일이 쌓이면 전후 평균이 보여요.
        </p>
      ) : null}
    </section>
  );
}

/** Full Skin Coach list plus the door to the Day-15 report. */
function CoachTab({ insights, latestDay }: { insights: ReturnType<typeof buildInsights>; latestDay: number }) {
  return (
    <div className="flex flex-col gap-4">
      {insights.length ? (
        <CoachCard insights={insights} />
      ) : (
        <p className="rounded-[24px] bg-pure-white p-5 text-center font-body-md text-body-md text-on-surface-variant shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
          이틀 이상 기록하면 코치가 관찰을 시작해요.
        </p>
      )}
      <Link
        href="/report"
        className="flex items-center gap-4 rounded-[24px] bg-primary-container p-5 text-pure-white transition-colors hover:bg-primary active:bg-primary"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pure-white/15">
          <Icon name="summarize" size={26} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-label-bold text-label-bold">15일 리포트</h3>
          <p className="mt-0.5 font-label-sm text-label-sm text-pure-white/70">
            Day {latestDay} 리포트 보기 · 다음 15일 실험 제안
          </p>
        </div>
        <Icon name="chevron_right" />
      </Link>
    </div>
  );
}

/**
 * Icon-only control row. Each icon carries its own outline rather than
 * sharing one pill background, so the three read as separate controls — but
 * all three now do the same kind of thing: swap the panel below in place,
 * keeping the "Day N of 15" header above them on screen.
 */
function TabStrip({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <div role="tablist" aria-label="Progress 보기" className="mb-4 flex items-center gap-2">
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={t.label}
            title={t.label}
            onClick={() => onChange(t.id)}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
              isActive
                ? "border-primary bg-primary text-pure-white shadow-sm"
                : "border-outline-variant text-on-surface-variant hover:bg-surface-container-highest active:bg-surface-container-highest"
            }`}
          >
            <Icon name={t.icon} size={18} filled={isActive} />
          </button>
        );
      })}
    </div>
  );
}

function EstimateRow({ label, from, to }: { label: string; from: number; to: number }) {
  const d = countDelta(to, from);
  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <span className="opacity-60">
          {from} → {to}
        </span>
        {d && d.percent !== 0 ? (
          <span
            className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm ${
              d.improved ? "bg-primary-fixed text-primary" : "bg-error-container text-on-error-container"
            }`}
          >
            {d.percent > 0 ? "+" : ""}
            {d.percent}%
          </span>
        ) : null}
      </span>
    </li>
  );
}

