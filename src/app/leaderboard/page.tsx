"use client";

import Link from "next/link";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { firstRecord, latestRecord } from "@/lib/scoring";
import { useStore } from "@/lib/store";

/**
 * 학교/반별 챌린지 랭킹 (design/screens/12-leaderboard-ranking).
 * Group ranking, again by average improvement rather than absolute score.
 */

const GROUPS = [
  { id: "a", name: "2학년 3반", members: 24, avgImprovement: 9.4 },
  { id: "b", name: "2학년 1반", members: 22, avgImprovement: 7.8 },
  { id: "c", name: "2학년 5반", members: 26, avgImprovement: 6.1 },
  { id: "d", name: "2학년 2반", members: 21, avgImprovement: 4.5 },
];

const SCHOOLS = [
  { id: "a", name: "청담고등학교", members: 412, avgImprovement: 7.6 },
  { id: "b", name: "대치고등학교", members: 388, avgImprovement: 6.9 },
  { id: "c", name: "역삼고등학교", members: 355, avgImprovement: 5.8 },
  { id: "d", name: "삼성고등학교", members: 301, avgImprovement: 4.2 },
];

/**
 * Glow Board shows initials, never faces — the deck's rule is "compete with
 * yesterday, not with faces", and nobody's photo leaves their device.
 */
const GLOW_NAMES = ["지민", "서연", "하은", "도윤", "아윤", "시우", "유나"];
const INITIAL_FILLS = [
  "bg-secondary-container",
  "bg-tertiary-fixed",
  "bg-primary-fixed",
  "bg-surface-container-high",
];

const GLOW_UPDATES = [
  { name: "지민", score: 14 },
  { name: "서연", score: 12 },
  { name: "하은", score: 10 },
  { name: "도윤", score: 8 },
  { name: "아윤", score: 6 },
];

/**
 * Recent-activity marquee for the Glow Board card. Same duplicated-content
 * technique as Today's NewsTicker (see `.marquee-track` in globals.css), one
 * loop always fills the strip so the seam never shows.
 */
function GlowBoardTicker() {
  const content = (
    <span className="flex shrink-0 items-center gap-4 pr-4">
      {GLOW_UPDATES.map((u, i) => (
        <span
          key={i}
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap font-label-sm text-label-sm text-primary"
        >
          <span className="animate-pulse rounded-full bg-primary px-1.5 py-0.5 font-label-bold text-[9px] text-pure-white">
            NEW
          </span>
          {u.name}님 +{u.score}점 달성
        </span>
      ))}
    </span>
  );

  return (
    <div className="mb-4 -mx-5 overflow-hidden border-y border-outline-variant/40 bg-surface-container-low py-1.5">
      <span className="marquee-track">
        {content}
        {content}
      </span>
    </div>
  );
}

export default function LeaderboardPage() {
  const { state, hydrated } = useStore();
  const [scope, setScope] = useState<"class" | "school">("class");

  const first = firstRecord(state.records);
  const latest = latestRecord(state.records);
  const myImprovement =
    hydrated && first && latest ? latest.dailySkinScore - first.dailySkinScore : 0;

  const groups = scope === "class" ? GROUPS : SCHOOLS;

  return (
    <div className="min-h-dvh pb-24">
      <AppHeader />

      <main className="flex flex-col gap-4 px-margin-main pt-2">
        {/* Lavender fill (tertiary-fixed / on-tertiary-fixed) — DESIGN.md's
            "AI Action" pairing, matching how lavender is used everywhere
            else in the app. */}
        <section className="rounded-[24px] bg-tertiary-fixed p-6 text-on-tertiary-fixed">
          <p className="font-label-sm text-label-sm text-on-tertiary-fixed/70">내 기여도</p>
          <p className="font-display-hero-mobile text-display-hero-mobile">
            {myImprovement > 0 ? "+" : ""}
            {myImprovement}
          </p>
          <p className="mt-1 font-label-sm text-label-sm text-on-tertiary-fixed/70">
            {scope === "class" ? "우리 반 평균 개선량에 반영돼요" : "우리 학교 평균 개선량에 반영돼요"}
          </p>
        </section>

        <div className="flex gap-2 rounded-full bg-surface-container p-1">
          {(["class", "school"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={`flex-1 rounded-full py-2 font-label-bold text-label-bold transition-colors ${
                scope === s
                  ? "bg-pure-white text-primary shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-container-highest active:bg-surface-container-highest"
              }`}
            >
              {s === "class" ? "반별" : "학교별"}
            </button>
          ))}
        </div>

        {/* Glow Board — top improvers this week */}
        <section className="rounded-[24px] bg-pure-white p-5 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
          <h3 className="mb-4 font-label-bold text-label-bold text-on-surface">Glow Board</h3>
          <GlowBoardTicker />
          <div className="no-scrollbar flex gap-4 overflow-x-auto">
            {GLOW_NAMES.map((name, i) => (
              <div key={name} className="flex w-16 shrink-0 flex-col items-center gap-1">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full ${
                    INITIAL_FILLS[i % INITIAL_FILLS.length]
                  } ${i === 0 ? "ring-2 ring-primary ring-offset-2" : ""}`}
                  aria-label={name}
                >
                  <span className="font-headline-md text-[20px] font-bold text-primary">
                    {name.charAt(0)}
                  </span>
                </div>
                <span className="font-label-sm text-[10px] text-primary">
                  +{(14 - i * 2).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <Link
          href="/challenge"
          className="shiny-button flex items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-bold text-label-bold text-pure-white shadow-md transition-opacity hover:opacity-90 active:scale-95"
        >
          <Icon name="military_tech" size={18} />
          내 Friends Challenge · 공유하기
        </Link>

        <section className="stagger flex flex-col gap-2">
          {groups.map((g, i) => (
            <div
              key={g.id}
              className="flex items-center gap-4 rounded-2xl bg-pure-white p-4 shadow-[0_4px_20px_rgba(46,104,93,0.05)]"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full font-label-bold text-label-bold ${
                  i === 0
                    ? "bg-primary-fixed text-primary"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {i === 0 ? <Icon name="trophy" size={20} /> : i + 1}
              </span>
              <div className="flex-1">
                <p className="font-label-bold text-label-bold text-on-surface">{g.name}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {g.members}명 참여
                </p>
              </div>
              <div className="text-right">
                <p className="font-headline-md text-headline-md text-primary">
                  +{g.avgImprovement.toFixed(1)}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">평균 개선</p>
              </div>
            </div>
          ))}
        </section>

        <div className="flex items-start gap-2 rounded-2xl bg-surface-container p-4">
          <Icon name="info" size={18} className="mt-0.5 text-on-surface-variant" />
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            순위는 절대 피부 점수가 아니라 개선량 평균으로 매겨져요. 개인의 사진이나 점수는
            공개되지 않습니다.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
