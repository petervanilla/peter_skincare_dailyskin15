"use client";

import type { ReactNode } from "react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Icon } from "@/components/Icon";
import { habitStreak } from "@/lib/insights";
import { currentStreak, firstRecord, latestRecord } from "@/lib/scoring";
import { CHALLENGE_LENGTH, type DayRecord } from "@/lib/types";

/**
 * The growth-loop quartet from the IR deck (slide 12): compete with
 * yesterday, not with faces. Every tile is about the user's own habit or
 * improvement — never an absolute score.
 */
interface HabitTilesProps {
  records: DayRecord[];
  challengeJoined: boolean;
}

/** Demo cohort size for "함께 완주하기" until friends sync exists. */
const FRIENDS_TOTAL = 5;
const FRIENDS_ON_TRACK = 4;

export function HabitTiles({ records, challengeJoined }: HabitTilesProps) {
  const first = firstRecord(records);
  const latest = latestRecord(records);
  const delta = first && latest ? latest.dailySkinScore - first.dailySkinScore : 0;
  const routineDays = records.filter((r) => r.routineDone === true).length;
  const noTouch = habitStreak(records, (r) => r.noTouch);
  const streak = currentStreak(records);
  const friends = challengeJoined ? FRIENDS_ON_TRACK : 0;

  return (
    <div className="stagger grid grid-cols-2 gap-3">
      <Tile
        eyebrow="15-Day Glow"
        title="Day 1 대비 개선량"
        value={
          <>
            {delta > 0 ? "+" : ""}
            <AnimatedNumber value={delta} from={0} />
          </>
        }
        unit="Δ SCORE"
        icon="trending_up"
        className="bg-secondary-container text-primary"
      />
      <Tile
        eyebrow="Routine Streak"
        title="스킨케어 실천"
        value={<AnimatedNumber value={routineDays} from={0} />}
        unit={`/ ${CHALLENGE_LENGTH}`}
        note={`${streak}일 연속 촬영`}
        icon="favorite"
        className="bg-[#fff8e6] text-on-surface"
      />
      <Tile
        eyebrow="No-Touch"
        title="얼굴 만지지 않기"
        value={<AnimatedNumber value={noTouch} from={0} />}
        unit="DAYS"
        icon="back_hand"
        className="bg-pure-white text-on-surface shadow-[0_4px_20px_rgba(46,104,93,0.05)]"
      />
      <Tile
        eyebrow="Friends Challenge"
        title="함께 완주하기"
        value={<AnimatedNumber value={friends} from={0} />}
        unit={`/ ${FRIENDS_TOTAL}`}
        icon="groups"
        className="bg-pure-white text-on-surface shadow-[0_4px_20px_rgba(46,104,93,0.05)]"
      />
    </div>
  );
}

function Tile({
  eyebrow,
  title,
  value,
  unit,
  note,
  icon,
  className,
}: {
  eyebrow: string;
  title: string;
  value: ReactNode;
  unit: string;
  note?: string;
  icon: string;
  className: string;
}) {
  return (
    <div className={`flex flex-col rounded-[24px] p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-label-sm text-[11px] tracking-wide opacity-70">{eyebrow}</p>
        <Icon name={icon} size={16} className="opacity-60" />
      </div>
      <p className="font-label-bold text-label-bold break-keep">{title}</p>
      <div className="mt-2 flex items-baseline justify-end gap-1">
        <span className="font-headline-md text-headline-md">{value}</span>
        <span className="font-label-sm text-[10px] tracking-wider uppercase opacity-70">{unit}</span>
      </div>
      {note ? (
        <p className="mt-0.5 text-right font-label-sm text-[10px] opacity-60">{note}</p>
      ) : null}
    </div>
  );
}
