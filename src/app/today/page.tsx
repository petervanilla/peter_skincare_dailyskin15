"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { HeroCover } from "@/components/HeroCover";
import { Icon } from "@/components/Icon";
import { LogoMark } from "@/components/Logo";
import { IMG } from "@/lib/assets";
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

  return (
    <div className="min-h-dvh pb-32">
      <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-outline-variant/60 bg-pure-white px-margin-main py-3.5">
        <LogoMark height={36} />
        <Link
          href="/profile"
          aria-label="프로필"
          className="relative h-10 w-10 overflow-hidden rounded-full transition-transform hover:opacity-80 active:scale-95"
        >
          <Image src={IMG.avatar} alt="프로필" fill sizes="40px" className="object-cover" />
        </Link>
      </header>

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

          {!today ? (
            <div className="absolute top-6 left-6 rounded-full bg-glass-overlay px-3 py-1.5 backdrop-blur-md">
              <span className="font-label-sm text-label-sm text-graphite">
                첫 기록을 남겨보세요
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
                    {today ? <AnimatedScore value={today.dailySkinScore} /> : "--"}
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
            className="shiny-button flex w-full items-center justify-center gap-2 rounded-full bg-tertiary-fixed py-4 font-label-bold text-label-bold text-on-tertiary-fixed shadow-md transition-all hover:opacity-90 active:scale-95"
          >
            <Icon name="center_focus_strong" />
            {capturedToday ? "촬영하기" : "오늘의 피부 기록하기"}
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
            <QuickLink href="/products" icon="shopping_bag" label="제품 추천" />
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
function AnimatedScore({ value }: { value: number }) {
  const from = Math.max(0, value - 6);
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    const duration = 900;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(frame);
  }, [value, from]);

  return <>{display}</>;
}

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
 * Dragging a finger (or mouse) across the strip raises a "Day N" label above
 * whichever dot is currently under the pointer — a scrub gesture, not hover,
 * since hover doesn't exist on touch. A tap (no meaningful drag distance)
 * jumps straight to Progress instead.
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
  const [revealedDay, setRevealedDay] = useState<number | null>(null);
  const dragStartX = useRef(0);
  const dragMoved = useRef(false);
  // Explicit flag rather than checking e.buttons/pointerType: some pointer
  // implementations fire "move" on plain hover, which must never reveal —
  // only an active press-drag started in onPointerDown should.
  const isDragging = useRef(false);

  // A window around today plus the two end markers, so all 15 days stay
  // representable inside a 375px frame without wrapping or clipping.
  const days = Array.from({ length: total }, (_, i) => i + 1);
  const windowed = days.filter((d) => d === 1 || d === total || Math.abs(d - current) <= 2);

  const revealAt = (clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>("[data-day]");
    setRevealedDay(el ? Number(el.dataset.day) : null);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragMoved.current = false;
    revealAt(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    if (Math.abs(e.clientX - dragStartX.current) > 4) dragMoved.current = true;
    revealAt(e.clientX, e.clientY);
  };

  const endDrag = () => {
    isDragging.current = false;
    setRevealedDay(null);
  };

  return (
    <div
      className="mb-4 flex w-full touch-none items-center justify-center gap-1"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {windowed.map((day, i) => {
        const isCurrent = day === current;
        const isDone = completed.includes(day);
        const prevDay = windowed[i - 1];
        const gap = prevDay !== undefined && day - prevDay > 1;

        return (
          <div key={day} className="flex shrink-0 items-center gap-1">
            {gap ? <div className="h-[2px] w-3 rounded-full bg-surface-container-highest" /> : null}
            <div
              data-day={day}
              role="button"
              tabIndex={0}
              aria-label={`Day ${day}${isDone ? " (완료)" : ""}${isCurrent ? " · 오늘" : ""}`}
              onClick={() => {
                if (!dragMoved.current) router.push("/progress");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") router.push("/progress");
              }}
              className="relative flex shrink-0 cursor-pointer items-center justify-center transition-opacity hover:opacity-70 active:opacity-50"
            >
              <div
                className={
                  isCurrent
                    ? "flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary bg-primary-container font-label-bold text-label-bold text-on-primary-container shadow-md ring-4 ring-primary-container/20"
                    : isDone
                      ? "flex h-7 w-7 items-center justify-center rounded-full bg-primary text-pure-white"
                      : "flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-highest font-label-sm text-label-sm text-on-surface-variant"
                }
              >
                {isDone && !isCurrent ? <Icon name="check" size={14} /> : day}
              </div>
              {/* Rises up and fades in while the pointer is dragged over this dot. */}
              <span
                className={`pointer-events-none absolute bottom-full z-10 rounded-full bg-graphite px-2 py-0.5 font-label-sm text-[10px] whitespace-nowrap text-pure-white shadow-md transition-all duration-150 ${
                  revealedDay === day ? "mb-2.5 opacity-100" : "mb-0.5 opacity-0"
                }`}
              >
                Day {day}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
