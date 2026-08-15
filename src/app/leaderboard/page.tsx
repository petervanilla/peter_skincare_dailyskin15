"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { TopAppBar } from "@/components/TopAppBar";
import { IMG } from "@/lib/assets";
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

export default function LeaderboardPage() {
  const { state, hydrated } = useStore();
  const [scope, setScope] = useState<"class" | "school">("class");

  const first = firstRecord(state.records);
  const latest = latestRecord(state.records);
  const myImprovement =
    hydrated && first && latest ? latest.dailySkinScore - first.dailySkinScore : 0;

  return (
    <div className="min-h-dvh pb-24">
      {/* text-[16.8px] overrides TopAppBar's default 24px (headline-md) by
          30%, scoped to this page only. */}
      <TopAppBar title={<span className="text-[16.8px]">챌린지 랭킹</span>} avatar />

      <main className="flex flex-col gap-4 px-margin-main pt-2">
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

        <section className="rounded-[24px] bg-primary-container p-6 text-pure-white">
          <p className="font-label-sm text-label-sm text-on-primary-container">내 기여도</p>
          <p className="font-display-hero-mobile text-display-hero-mobile">
            {myImprovement > 0 ? "+" : ""}
            {myImprovement}
          </p>
          <p className="mt-1 font-label-sm text-label-sm text-pure-white/70">
            우리 반 평균 개선량에 반영돼요
          </p>
        </section>

        {/* Glow Board — top improvers this week */}
        <section className="rounded-[24px] bg-pure-white p-5 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
          <h3 className="mb-4 font-label-bold text-label-bold text-on-surface">Glow Board</h3>
          <div className="no-scrollbar flex gap-4 overflow-x-auto">
            {IMG.boardAvatars.map((src, i) => (
              <div key={src} className="flex w-16 shrink-0 flex-col items-center gap-1">
                <div
                  className={`relative h-14 w-14 overflow-hidden rounded-full ${
                    i === 0 ? "ring-2 ring-primary ring-offset-2" : ""
                  }`}
                >
                  <Image src={src} alt="" fill sizes="56px" className="object-cover" />
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
          className="flex items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-bold text-label-bold text-pure-white shadow-md transition-opacity hover:opacity-90 active:scale-95"
        >
          <Icon name="military_tech" size={18} />
          내 7-Day 챌린지 순위 · 공유하기
        </Link>

        <section className="flex flex-col gap-2">
          {GROUPS.map((g, i) => (
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
