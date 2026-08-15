"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { TopAppBar } from "@/components/TopAppBar";
import { IMG } from "@/lib/assets";
import { FACE_YOGA_ROUTINES, type FaceYogaRoutine } from "@/lib/recommendations";
import { latestRecord } from "@/lib/scoring";
import { useStore } from "@/lib/store";

/** Face Yoga MVP (spec §11) — relaxation/routine content, no efficacy claims. */
export default function FaceYogaPage() {
  const { state, hydrated, toggleAction } = useStore();
  const [active, setActive] = useState<FaceYogaRoutine | null>(null);

  const today = latestRecord(state.records);
  const completed = today?.completedActions ?? [];

  return (
    <div className="min-h-dvh pb-32">
      <TopAppBar title="Face Yoga" back />

      <main className="flex flex-col gap-4 px-margin-main pt-2">
        <div className="relative aspect-[16/9] overflow-hidden rounded-[24px]">
          <Image
            src={IMG.faceYogaLesson}
            alt="페이스 요가 레슨"
            fill
            priority
            sizes="430px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-graphite/70 via-transparent to-transparent" />
          <div className="absolute inset-x-5 bottom-4">
            <p className="font-headline-md text-headline-md text-pure-white">
              Jawline Lifting Massage
            </p>
            <p className="font-label-sm text-label-sm text-pure-white/80">순환 · 붓기 완화</p>
          </div>
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant">
          긴장을 푸는 짧은 루틴이에요. 편안한 자세로 따라 해보세요.
        </p>

        {FACE_YOGA_ROUTINES.map((routine) => {
          const done = hydrated && completed.includes(`yoga-${routine.id}`);
          return (
            <button
              key={routine.id}
              type="button"
              onClick={() => setActive(routine)}
              className="flex items-center gap-4 rounded-[24px] bg-pure-white p-5 text-left shadow-[0_4px_20px_rgba(46,104,93,0.05)] transition-colors hover:bg-secondary-container active:bg-secondary-container"
            >
              <div
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${
                  done ? "bg-primary text-pure-white" : "bg-secondary-container text-primary"
                }`}
              >
                <Icon name={done ? "check" : "favorite"} size={32} />
              </div>
              <div className="flex-1">
                <h3 className="font-label-bold text-label-bold text-on-surface">{routine.title}</h3>
                <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
                  {routine.focus} · {routine.minutes}분
                </p>
              </div>
              <Icon name="play_circle" className="text-primary" size={28} />
            </button>
          );
        })}
      </main>

      <BottomNav />

      {active ? (
        <RoutinePlayer
          routine={active}
          onClose={() => setActive(null)}
          onComplete={() => {
            if (today) toggleAction(today.day, `yoga-${active.id}`);
            setActive(null);
          }}
        />
      ) : null}
    </div>
  );
}

/** Timed guide: large step text, remaining time, "오늘 완료" check (spec §11). */
function RoutinePlayer({
  routine,
  onClose,
  onComplete,
}: {
  routine: FaceYogaRoutine;
  onClose: () => void;
  onComplete: () => void;
}) {
  const total = routine.minutes * 60;
  const [remaining, setRemaining] = useState(total);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const finished = remaining === 0;
  const running = !paused && !finished;

  useEffect(() => {
    if (!running) return;
    timerRef.current = window.setInterval(() => {
      setRemaining((r) => (r <= 1 ? 0 : r - 1));
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [running]);

  const elapsed = total - remaining;
  const stepIndex = Math.min(
    routine.steps.length - 1,
    Math.floor((elapsed / total) * routine.steps.length),
  );
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col bg-graphite px-margin-main pt-12 pb-10 text-pure-white">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-pure-white/15 transition-colors hover:bg-pure-white/25 active:bg-pure-white/35"
      >
        <Icon name="close" />
      </button>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="mb-2 font-label-bold text-label-bold text-tertiary-fixed-dim">
          {routine.title}
        </p>
        <p className="mb-8 font-display-hero text-display-hero tabular-nums">
          {mm}:{ss}
        </p>

        <div className="mb-8 h-1 w-full max-w-xs overflow-hidden rounded-full bg-pure-white/20">
          <div
            className="h-full rounded-full bg-tertiary-fixed-dim transition-all duration-1000 ease-linear"
            style={{ width: `${(elapsed / total) * 100}%` }}
          />
        </div>

        <p className="mb-3 font-body-lg text-body-lg">{routine.steps[stepIndex]}</p>
        <p className="font-label-sm text-label-sm text-pure-white/60">
          {stepIndex + 1} / {routine.steps.length}
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={finished}
          onClick={() => setPaused((p) => !p)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-pure-white/15 py-4 font-label-bold text-label-bold transition-colors hover:bg-pure-white/25 active:bg-pure-white/35 disabled:opacity-50"
        >
          <Icon name={running ? "pause" : "play_arrow"} size={20} />
          {finished ? "완료됨" : running ? "일시정지" : "이어하기"}
        </button>
        <button
          type="button"
          onClick={onComplete}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-tertiary-fixed py-4 font-label-bold text-label-bold text-on-tertiary-fixed transition-colors hover:bg-tertiary-fixed-dim active:bg-tertiary-fixed-dim"
        >
          <Icon name="check" size={20} />
          오늘 완료
        </button>
      </div>
    </div>
  );
}
