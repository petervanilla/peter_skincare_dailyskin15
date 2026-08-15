"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { Confetti } from "@/components/ui/confetti";
import { IMG } from "@/lib/assets";
import { firstRecord, latestRecord } from "@/lib/scoring";
import { useStore } from "@/lib/store";

/**
 * 7-Day Glow Challenge (spec §13).
 *
 * The ranking metric is *improvement*, never the absolute score — the spec is
 * explicit that ranking raw skin scores invites appearance comparison. Rivals
 * are shown by improvement only, and no one's face is exposed.
 */

/** Local demo opponents. A real build would sync these from the backend. */
const DEMO_RIVALS = [
  { id: "mina", name: "Mina", improvement: 11, streak: 7, avatar: IMG.challengeRivals[0] },
  { id: "jisoo", name: "Jisoo", improvement: 6, streak: 5, avatar: IMG.challengeRivals[1] },
  { id: "hana", name: "Hana", improvement: 3, streak: 4, avatar: IMG.challengeRivals[2] },
];

/** 1 → 1st, 2 → 2nd, 3 → 3rd, 11–13 → 11th/12th/13th. */
function ordinal(n: number) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
}

export default function ChallengePage() {
  const { state, hydrated, joinChallenge } = useStore();
  const [nickname, setNickname] = useState("");
  const [celebration, setCelebration] = useState(0);

  if (!hydrated) return <div className="p-margin-main">불러오는 중…</div>;

  const first = firstRecord(state.records);
  const latest = latestRecord(state.records);
  const myImprovement =
    first && latest ? latest.dailySkinScore - first.dailySkinScore : 0;

  const board = [
    {
      id: "me",
      name: state.nickname,
      improvement: myImprovement,
      streak: state.records.length,
      avatar: IMG.avatar,
      isMe: true,
    },
    ...DEMO_RIVALS.map((r) => ({ ...r, isMe: false })),
  ].sort((a, b) => b.improvement - a.improvement);

  if (!state.challengeJoined) {
    return (
      <div className="min-h-dvh pb-24">
        <main className="flex flex-col gap-4 px-margin-main pt-6">
          <section className="rounded-[24px] bg-primary-container p-6 text-pure-white">
            <h2 className="mb-2 font-headline-md text-headline-md">
              누가 더 좋아졌는가?
            </h2>
            <p className="font-body-md text-body-md text-pure-white/80">
              이 챌린지는 절대 점수가 아니라 <b>개선량</b>으로 겨뤄요. 피부가 원래 어떤지가
              아니라, 얼마나 달라졌는지만 비교해요.
            </p>
          </section>

          <label htmlFor="nickname" className="font-label-bold text-label-bold text-on-surface">
            닉네임
          </label>
          <input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="친구들에게 보일 이름"
            className="rounded-xl border border-outline-variant bg-pure-white px-4 py-3 font-body-md text-body-md outline-none focus:border-primary"
          />

          <div className="flex items-start gap-2 rounded-2xl bg-surface-container p-4">
            <Icon name="lock" size={18} className="mt-0.5 text-on-surface-variant" />
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              사진은 공유되지 않아요. 점수 변화량만 표시됩니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() => joinChallenge(nickname)}
            className="rounded-full bg-primary py-4 font-label-bold text-label-bold text-pure-white transition-colors hover:bg-primary-container active:bg-primary-container"
          >
            챌린지 참여하기
          </button>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-32">
      <main className="flex flex-col gap-4 px-margin-main pt-6">
        {/* Live Event hero */}
        <section className="rounded-[24px] bg-pure-white p-6 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
          <span className="inline-block rounded-full bg-tertiary-fixed px-3 py-1 font-label-sm text-label-sm text-on-tertiary-fixed">
            Live Event
          </span>
          <h2 className="mt-3 font-headline-lg-mobile text-headline-lg-mobile text-primary">
            7-Day Glow Challenge
          </h2>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            이번 주에 가장 많이 좋아진 사람은 누구일까요?
          </p>
        </section>

        {/* Status bento — Time Left / Your Rank */}
        <section className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-start rounded-[24px] bg-secondary-container p-5">
            <Icon name="timer" filled size={32} className="text-primary" />
            <span className="mt-2 font-label-sm text-label-sm text-primary/70">Time Left</span>
            <span className="font-headline-md text-headline-md text-primary">2 Days</span>
          </div>
          <button
            type="button"
            onClick={() => setCelebration((c) => c + 1)}
            aria-label="순위 축하하기"
            className="relative flex flex-col items-start overflow-hidden rounded-[24px] bg-primary-container p-5 text-left text-pure-white transition-all hover:bg-primary active:scale-95 active:bg-primary"
          >
            <Icon name="stars" filled size={32} className="text-primary-fixed" />
            <span className="mt-2 font-label-sm text-label-sm text-pure-white/70">Your Rank</span>
            <span className="font-headline-md text-headline-md">
              {ordinal(board.findIndex((b) => b.isMe) + 1)} Place
            </span>
          </button>
        </section>

        {celebration > 0 ? <Confetti key={celebration} isActive duration={2200} /> : null}

        <section className="rounded-[24px] bg-pure-white p-6 text-center shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
          <p className="font-label-sm text-label-sm text-on-surface-variant">내 개선량</p>
          <p className="font-display-hero text-display-hero text-primary">
            {myImprovement > 0 ? "+" : ""}
            {myImprovement}
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Day {first?.day ?? 1} → Day {latest?.day ?? 1}
          </p>
        </section>

        <section className="flex flex-col gap-2">
          {board.map((entry, i) => (
            <div
              key={entry.id}
              className={`flex items-center gap-4 rounded-2xl p-4 ${
                entry.isMe ? "bg-secondary-container" : "bg-pure-white"
              } shadow-[0_4px_20px_rgba(46,104,93,0.05)]`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full font-label-bold text-label-bold ${
                  i === 0 ? "bg-primary text-pure-white" : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {i + 1}
              </span>
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                <Image src={entry.avatar} alt="" fill sizes="40px" className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-label-bold text-label-bold text-on-surface">
                  {entry.name}
                  {entry.isMe ? " (나)" : ""}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {entry.streak}일 기록
                </p>
              </div>
              <span
                className={`font-headline-md text-headline-md ${
                  entry.improvement >= 0 ? "text-primary" : "text-error"
                }`}
              >
                {entry.improvement > 0 ? "+" : ""}
                {entry.improvement}
              </span>
            </div>
          ))}
        </section>

        <Link
          href="/leaderboard"
          className="flex items-center justify-center gap-2 rounded-full border border-primary py-4 font-label-bold text-label-bold text-primary transition-colors hover:bg-secondary-container active:bg-secondary-container"
        >
          <Icon name="leaderboard" size={18} />
          학교/반별 랭킹 보기
        </Link>

        <ShareCard improvement={myImprovement} fromDay={first?.day ?? 1} toDay={latest?.day ?? 1} />
      </main>

      <BottomNav />
    </div>
  );
}

/** 15일 결과 카드 (spec §13). Score change only; the face stays private. */
function ShareCard({
  improvement,
  fromDay,
  toDay,
}: {
  improvement: number;
  fromDay: number;
  toDay: number;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] bg-graphite p-6 text-pure-white">
      <p className="mb-1 font-label-sm text-label-sm tracking-[0.3em] text-tertiary-fixed-dim">
        DAY {fromDay} → DAY {toDay}
      </p>
      <p className="font-display-hero text-display-hero">
        {improvement > 0 ? "+" : ""}
        {improvement} SKIN SCORE
      </p>
      <p className="mt-2 font-label-sm text-label-sm text-pure-white/60">
        얼굴 사진은 포함되지 않아요. 공개 여부는 직접 선택할 수 있어요.
      </p>
    </section>
  );
}
