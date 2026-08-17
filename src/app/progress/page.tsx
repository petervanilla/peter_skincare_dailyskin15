"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BeforeAfterCompare } from "@/components/BeforeAfterCompare";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { LogoMark } from "@/components/Logo";
import { ProductRecommendations } from "@/components/ProductRecommendations";
import { StoredPhoto } from "@/components/StoredPhoto";
import { TopAppBar } from "@/components/TopAppBar";
import { TrendChart } from "@/components/TrendChart";
import { IMG } from "@/lib/assets";
import {
  countDelta,
  currentStreak,
  firstRecord,
  latestRecord,
  scoreDelta,
  SUB_SCORE_LABELS,
} from "@/lib/scoring";
import { useStore } from "@/lib/store";
import { CHALLENGE_LENGTH, type SubScores } from "@/lib/types";

/** 15일 Tracking (spec §8) — ported from design/screens/10-progress-day7. */
export default function ProgressPage() {
  const { state, hydrated, nextDay } = useStore();
  const [tab, setTab] = useState<TabId>("journey");

  if (!hydrated) return <div className="p-margin-main">불러오는 중…</div>;

  const records = [...state.records].sort((a, b) => a.day - b.day);
  const latest = latestRecord(records);
  const first = firstRecord(records);
  const delta = latest && first ? scoreDelta(latest.dailySkinScore, first.dailySkinScore) : null;
  const streak = currentStreak(records);

  if (!latest || !first) {
    return (
      <div className="min-h-dvh pb-32">
        <TopAppBar title={<LogoMark height={28} />} />
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
      <TopAppBar title={<LogoMark height={28} />} />

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
          <DayGrid completed={records.map((r) => r.day)} next={nextDay} />
        </section>

        {/* Streak + score tiles */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center rounded-[24px] bg-pure-white p-5 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-tertiary-fixed">
              <Icon name="local_fire_department" filled size={28} className="text-tertiary" />
            </div>
            <p className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
              {streak} Days
            </p>
            <p className="mt-1 font-label-sm text-label-sm tracking-[0.12em] text-on-surface-variant uppercase">
              Streak
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[24px] bg-pure-white p-5 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
            <p className="font-label-sm text-label-sm tracking-[0.12em] text-on-surface-variant uppercase">
              Skin Score
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display-hero-mobile text-display-hero-mobile text-primary">
                {latest.dailySkinScore}
              </span>
              {delta && delta.value !== 0 ? (
                <span
                  className={`font-label-bold text-label-bold ${
                    delta.value > 0 ? "text-tertiary" : "text-error"
                  }`}
                >
                  {delta.value > 0 ? "+" : ""}
                  {delta.value}
                </span>
              ) : null}
            </div>
            <p className="mt-3 font-label-sm text-label-sm text-on-surface-variant">Since Day 1</p>
            {/* Decorative rising line, as in the comp */}
            <svg
              viewBox="0 0 80 40"
              aria-hidden
              className="pointer-events-none absolute right-0 bottom-2 h-12 w-20 text-secondary-container"
            >
              <path
                d="M2 34 L22 26 L42 28 L62 10 L76 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

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
          />
        </section>

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
 * green for the day due next, lavender for the ones still ahead.
 */
function DayGrid({ completed, next }: { completed: number[]; next: number }) {
  const days = Array.from({ length: CHALLENGE_LENGTH }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-8 gap-x-1 gap-y-3">
      {days.map((day) => {
        const done = completed.includes(day);
        const isNext = !done && day === next;

        return (
          <div key={day} className="flex flex-col items-center gap-1">
            <div
              className={`flex aspect-square w-full max-w-9 items-center justify-center rounded-full font-label-bold text-label-bold ${
                done
                  ? "bg-secondary-container text-primary"
                  : isNext
                    ? "bg-primary text-pure-white shadow-md"
                    : "bg-tertiary-fixed text-on-tertiary-fixed-variant"
              }`}
            >
              {done ? <Icon name="check" size={16} /> : day}
            </div>
            <span className="font-label-sm text-[10px] text-on-surface-variant">D{day}</span>
          </div>
        );
      })}
    </div>
  );
}

type TabId = "journey" | "compare" | "products";

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: "journey", label: "변화 추이", icon: "insights" },
  { id: "compare", label: "Before / After", icon: "compare" },
  { id: "products", label: "제품 추천", icon: "shopping_bag" },
];

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

