"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { HeroCover } from "@/components/HeroCover";
import { Icon } from "@/components/Icon";
import { buildCarePlan } from "@/lib/recommendations";
import { currentStreak, latestRecord, previousRecord, scoreDelta } from "@/lib/scoring";
import { useStore } from "@/lib/store";
import { CHALLENGE_LENGTH } from "@/lib/types";

/** Main Dashboard (spec §8) — ported from design/screens/05-hero-dashboard. */
export default function TodayPage() {
  const { state, hydrated, nextDay } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !state.survey) router.replace("/");
  }, [hydrated, state.survey, router]);

  if (!hydrated) return <div className="p-margin-main">불러오는 중…</div>;

  const today = latestRecord(state.records);
  const prev = today ? previousRecord(state.records, today.day) : null;
  const delta = today ? scoreDelta(today.dailySkinScore, prev?.dailySkinScore ?? null) : null;
  const streak = currentStreak(state.records);
  const plan = buildCarePlan(state.records, today);
  const currentDay = today?.day ?? nextDay;
  const capturedToday = today?.date === new Date().toISOString().slice(0, 10);
  /** No record at all yet — the very first visit after onboarding. */
  const isFirstEver = !today;

  return (
    <div className="min-h-dvh pb-32">
      <AppHeader />

      <NewsTicker />

      <main className="px-margin-main">
        {/* Day tracker */}
        {/* Spacing above the card is deliberately tight so the capture button
            below it stays visible without scrolling. 19.2px is 16px (mt-4)
            widened 20% to clear the ticker band above this section. */}
        <section className="mt-[19.2px] flex flex-col items-center">
          <h2 className="mb-1 font-headline-lg-mobile text-headline-lg-mobile text-primary">
            Day {currentDay}
          </h2>
          <p className="mb-3 font-body-md text-body-md text-on-surface-variant">
            15일의 기적을 향한 여정
          </p>
          <DayStrip
            total={CHALLENGE_LENGTH}
            current={currentDay}
            completed={state.records.map((r) => r.day)}
          />
          {streak > 1 ? (
            <div className="mb-4 flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-1">
              <Icon name="local_fire_department" size={16} className="text-primary" />
              <span className="font-label-sm text-label-sm text-primary">{streak}일 연속 기록</span>
            </div>
          ) : null}
        </section>

        {/* Hero portrait + score */}
        <HeroCover
          todayPhotoKey={today ? (today.photoKeys.front ?? Object.values(today.photoKeys)[0]) : null}
          todayAlt={today ? `Day ${today.day} 기록 사진` : undefined}
        >
          {/* Scrim only under the score panel, so a light portrait keeps its
              tone while the white type on clear glass stays readable. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-graphite/65 via-graphite/25 to-transparent" />

          {isFirstEver ? (
            <div className="absolute top-6 left-6 rounded-full bg-glass-overlay px-3 py-1.5 backdrop-blur-md">
              <span className="font-label-sm text-label-sm text-graphite">
                🎉 Day 1 · 새로운 도전을 응원해요!
              </span>
            </div>
          ) : null}

          <div className="absolute right-6 bottom-6 left-6">
            {/* Clear glass, so the portrait stays visible through the panel. */}
            <div className="flex items-center justify-between rounded-2xl border border-pure-white/25 bg-pure-white/10 p-4 backdrop-blur-[2px]">
              <div className="[text-shadow:0_1px_8px_rgba(32,32,38,0.45)]">
                <div className="mb-1 font-label-bold text-label-bold text-pure-white">
                  Today&apos;s Skin Score
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display-hero-mobile text-display-hero-mobile text-pure-white">
                    {today ? <AnimatedNumber value={today.dailySkinScore} /> : "--"}
                  </span>
                  {delta && delta.value !== 0 ? (
                    <span className="rounded-full bg-pure-white/20 px-2 py-0.5 font-label-sm text-label-sm text-pure-white">
                      {delta.value > 0 ? "+" : ""}
                      {delta.value} pts
                    </span>
                  ) : null}
                </div>
              </div>
              <Link
                href={today ? `/analysis?day=${today.day}` : "/scan"}
                aria-label="분석 결과 보기"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-pure-white shadow-lg transition-colors hover:bg-primary-container"
              >
                <Icon name="insights" filled />
              </Link>
            </div>
          </div>
        </HeroCover>

        {/* Primary actions */}
        <section className="flex flex-col gap-4">
          <Link
            href="/scan"
            className={`shiny-button lavender-glow flex w-full items-center justify-center gap-2 rounded-full bg-tertiary-fixed py-4 font-label-bold text-label-bold text-on-tertiary-fixed shadow-md transition-all hover:opacity-90 active:scale-95 ${
              isFirstEver ? "pulse-cta" : ""
            }`}
          >
            <Icon name="center_focus_strong" />
            {capturedToday ? "촬영하기" : isFirstEver ? "첫 기록 남기고 시작하기" : "오늘의 피부 기록하기"}
          </Link>

          <Link
            href="/routine"
            className="flex items-center gap-4 rounded-[24px] bg-pure-white p-5 shadow-[0_4px_20px_rgba(46,104,93,0.05)] transition-colors hover:bg-secondary-container active:bg-secondary-container"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary-container text-primary">
              <Icon name="favorite" size={32} />
            </div>
            <div className="flex-1">
              <h3 className="font-label-bold text-label-bold text-on-surface">{plan.headline}</h3>
              <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
                {plan.actions[0]?.title}
                {plan.actions.length > 1 ? ` 외 ${plan.actions.length - 1}가지` : ""}
              </p>
            </div>
            <Icon name="chevron_right" className="text-primary" />
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <QuickLink href="/compare" icon="compare" label="Before / After" />
            <QuickLink href="/shop" icon="shopping_bag" label="제품 추천" />
            <QuickLink href="/face-yoga" icon="spa" label="페이스 요가" />
            <QuickLink href="/challenge" icon="groups" label="친구 챌린지" />
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

const TICKER_ITEMS = [
  "🔥 7-Day Glow Challenge 진행 중 · 랭킹 확인하고 친구에게 공유해보세요",
  "🌿 Day 7 지표 안정 — 오늘은 지금 루틴을 그대로 이어가세요",
  "📸 같은 자리, 같은 조명에서 찍을수록 변화가 또렷하게 보여요",
];

/**
 * Announcement ticker. Two back-to-back copies of the same content scroll
 * rightward as one unit (see `.marquee-track` in globals.css) — the seam
 * never shows because a full copy always fills the strip.
 */
function NewsTicker() {
  const content = (
    <span className="flex shrink-0 items-center gap-4 pr-4">
      {TICKER_ITEMS.map((item, i) => (
        <span
          key={i}
          className="flex shrink-0 items-center gap-1 whitespace-nowrap font-label-sm text-label-sm text-on-tertiary-fixed"
        >
          <Icon name="fiber_new" size={14} />
          {item}
        </span>
      ))}
    </span>
  );

  return (
    <Link
      href="/challenge"
      aria-label="이벤트 및 업데이트 소식 보기"
      className="block w-full overflow-hidden border-b border-outline-variant/60 bg-tertiary-fixed py-1 transition-colors hover:bg-tertiary-fixed-dim active:bg-tertiary-fixed-dim"
    >
      <span className="marquee-track">
        {content}
        {content}
      </span>
    </Link>
  );
}

/** Counts up to the score, opening six points below it (74 starts at 68). */
function QuickLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl bg-pure-white p-4 shadow-[0_4px_20px_rgba(46,104,93,0.05)] transition-colors hover:bg-secondary-container active:bg-secondary-container"
    >
      <Icon name={icon} className="text-primary" />
      <span className="font-label-bold text-label-bold text-on-surface">{label}</span>
    </Link>
  );
}

/**
 * A swipeable carousel across all 15 days: whichever chip is scrolled to the
 * center enlarges, matching the old "today" treatment — but now any day can
 * sit there. Tapping a chip (centered or not) jumps straight to that day's
 * Progress view.
 */
function DayStrip({
  total,
  current,
  completed,
}: {
  total: number;
  current: number;
  completed: number[];
}) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<number, HTMLButtonElement>());
  const [centerDay, setCenterDay] = useState<number | null>(null);
  const days = Array.from({ length: total }, (_, i) => i + 1);

  // No chip is enlarged until the user actually swipes: with no side
  // padding, Day 1 already rests flush at the left edge on its own — forcing
  // it to "center" is impossible (it's at the boundary) and previously just
  // left some unrelated day looking falsely enlarged instead. The observer
  // only starts reporting once a real scroll happens.
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    let observer: IntersectionObserver | undefined;
    let interacted = false;

    const onScroll = () => {
      interacted = true;
    };
    root.addEventListener("scroll", onScroll, { passive: true, once: true });

    const frame = requestAnimationFrame(() => {
      observer = new IntersectionObserver(
        (entries) => {
          if (!interacted) return;
          let best: { day: number; dist: number } | null = null;
          const rootMid = root.getBoundingClientRect().left + root.clientWidth / 2;
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const day = Number((entry.target as HTMLElement).dataset.day);
            const targetMid = entry.boundingClientRect.left + entry.boundingClientRect.width / 2;
            const dist = Math.abs(targetMid - rootMid);
            if (!best || dist < best.dist) best = { day, dist };
          }
          if (best) setCenterDay(best.day);
        },
        { root, threshold: [0, 0.5, 1] },
      );
      itemRefs.current.forEach((el) => observer?.observe(el));
    });

    return () => {
      root.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [total]);

  return (
    <div
      ref={scrollerRef}
      // Height leaves a few px above/below the enlarged (h-9) chip for its
      // shadow — a height tight to exactly 36px clips the shadow's bottom
      // edge, since overflow-x: auto makes the y-axis clip too.
      // No side padding: the scrollable range is exactly Day 1's chip to Day
      // 15's, so at full swing they sit flush against each edge.
      className="no-scrollbar mb-4 flex h-11 w-full items-center gap-3 overflow-x-auto"
      // overflow-anchor: none — otherwise the browser "helpfully" shifts
      // scrollLeft to compensate whenever the centered chip resizes
      // (28px <-> 36px), drifting the strip away from the day it settled on.
      style={{ scrollSnapType: "x mandatory", overflowAnchor: "none" }}
    >
      {days.map((day) => {
        const isCenter = day === centerDay;
        const isDone = completed.includes(day);

        return (
          <button
            key={day}
            ref={(el) => {
              if (el) itemRefs.current.set(day, el);
              else itemRefs.current.delete(day);
            }}
            type="button"
            data-day={day}
            aria-label={`Day ${day}${isDone ? " (완료)" : ""}${day === current ? " · 오늘" : ""}`}
            onClick={() => router.push(`/progress?day=${day}`)}
            style={{ scrollSnapAlign: "center" }}
            // Centering only changes size — it's a scroll position, not a
            // status, so it must never imply "done" or "today" with color.
            className={`flex shrink-0 items-center justify-center rounded-full font-label-bold text-label-bold transition-all duration-200 ${
              isCenter ? "h-9 w-9 shadow-md" : "h-7 w-7"
            } ${
              isDone
                ? "bg-primary text-pure-white"
                : "bg-surface-container-highest text-label-sm text-on-surface-variant"
            }`}
          >
            {day}
          </button>
        );
      })}
    </div>
  );
}
