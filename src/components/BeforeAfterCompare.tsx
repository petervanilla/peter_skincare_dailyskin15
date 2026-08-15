"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { StoredPhoto } from "@/components/StoredPhoto";
import { IMG } from "@/lib/assets";
import { countDelta, firstRecord, latestRecord, scoreDelta } from "@/lib/scoring";
import type { DayRecord } from "@/lib/types";

/**
 * Before / After split view (spec §9), shared by /compare and the Progress tab.
 *
 * The spec's non-negotiable principle: both sides are shown under the same
 * capture conditions with no beautification. Nothing here filters, retouches
 * or brightens either image — the only transform is the split position.
 */
export function BeforeAfterCompare({ records }: { records: DayRecord[] }) {
  const [split, setSplit] = useState(50);
  const [rightDay, setRightDay] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const sorted = [...records].sort((a, b) => a.day - b.day);
  const base = firstRecord(sorted);
  const newest = latestRecord(sorted);
  const right = rightDay !== null ? (sorted.find((r) => r.day === rightDay) ?? newest) : newest;

  if (!base || !right || sorted.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <Icon name="compare" size={48} className="text-outline" />
        <p className="font-body-md text-body-md text-on-surface-variant">
          비교하려면 최소 이틀치 기록이 필요해요.
        </p>
        <Link
          href="/scan"
          className="rounded-full bg-primary px-6 py-3 font-label-bold text-label-bold text-pure-white transition-colors hover:bg-primary-container active:bg-primary-container"
        >
          오늘 기록하기
        </Link>
      </div>
    );
  }

  const updateSplit = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplit(Math.min(98, Math.max(2, pct)));
  };

  const delta = scoreDelta(right.dailySkinScore, base.dailySkinScore);
  const dayGap = right.day - base.day;

  return (
    <div className="flex w-full flex-col">
      {/* Day selector for the right-hand side */}
      <nav className="no-scrollbar mb-stack-md flex gap-2 overflow-x-auto py-2">
        {sorted
          .filter((r) => r.day !== base.day)
          .map((r) => {
            const active = r.day === right.day;
            return (
              <button
                key={r.day}
                type="button"
                onClick={() => setRightDay(r.day)}
                className={`rounded-full px-4 py-2 font-label-bold text-label-bold whitespace-nowrap transition-colors ${
                  active
                    ? "bg-secondary-container text-primary"
                    : "border border-surface-variant bg-pure-white text-on-surface-variant hover:bg-surface-container active:bg-surface-container"
                }`}
              >
                Day {r.day}
              </button>
            );
          })}
      </nav>

      {/* Split comparison */}
      <div
        ref={containerRef}
        className="relative mb-stack-lg aspect-[3/4] w-full touch-none overflow-hidden rounded-2xl bg-surface-container-high shadow-[0_4px_20px_rgba(46,104,93,0.08)] select-none"
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          updateSplit(e.clientX);
        }}
        onPointerMove={(e) => {
          if (dragging.current) updateSplit(e.clientX);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
      >
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
          <StoredPhoto
            photoKey={base.photoKeys.front ?? Object.values(base.photoKeys)[0]}
            alt={`Day ${base.day} 사진`}
            className="h-full w-full object-cover"
            fallback={
              <Image
                src={IMG.beforeDemo}
                alt=""
                fill
                sizes="430px"
                className="object-cover object-top"
              />
            }
          />
          <div className="absolute top-4 left-4 rounded-full bg-glass-overlay px-3 py-1.5 shadow-sm backdrop-blur-md">
            <span className="font-label-bold text-label-bold tracking-wide text-graphite">
              DAY {base.day}
            </span>
          </div>
        </div>

        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
          <StoredPhoto
            photoKey={right.photoKeys.front ?? Object.values(right.photoKeys)[0]}
            alt={`Day ${right.day} 사진`}
            className="h-full w-full object-cover"
            fallback={
              <Image
                src={IMG.afterDemo}
                alt=""
                fill
                sizes="430px"
                className="object-cover object-top"
              />
            }
          />
          <div className="absolute top-4 right-4 rounded-full bg-primary px-3 py-1.5 shadow-sm">
            <span className="font-label-bold text-label-bold tracking-wide text-pure-white">
              DAY {right.day}
            </span>
          </div>
        </div>

        {/* Handle */}
        <div
          className="pointer-events-none absolute inset-y-0 w-[2px] bg-graphite/70"
          style={{ left: `${split}%` }}
        >
          <div className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-pure-white shadow-lg">
            <Icon name="drag_indicator" className="text-graphite" size={20} />
          </div>
        </div>
      </div>

      <p className="mb-stack-md text-center font-label-sm text-label-sm text-on-surface-variant">
        핸들을 좌우로 드래그해서 비교해 보세요. 두 사진 모두 보정 없이 원본 그대로 표시돼요.
      </p>

      {/* Summary */}
      <section className="rounded-2xl border border-surface-variant/50 bg-pure-white p-6 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
        <h2 className="mb-2 text-center font-headline-md text-headline-md text-primary">
          {dayGap}일 동안{" "}
          <span className="font-bold text-secondary">
            {delta && delta.value > 0 ? "+" : ""}
            {delta?.value ?? 0}점
          </span>{" "}
          변했어요
        </h2>
        <p className="mb-6 text-center font-body-md text-body-md text-on-surface-variant">
          Day {base.day} → Day {right.day}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <ChangeTile
            icon="healing"
            label="Visible Trouble"
            from={base.metrics.troubleCount}
            to={right.metrics.troubleCount}
          />
          <ChangeTile
            icon="blur_on"
            label="Visible Spot"
            from={base.metrics.spotCount}
            to={right.metrics.spotCount}
          />
          <ChangeTile
            icon="sentiment_satisfied"
            label="Smile Line"
            from={base.subScores.nasolabial}
            to={right.subScores.nasolabial}
            higherIsBetter
          />
          <ChangeTile
            icon="horizontal_rule"
            label="Forehead"
            from={base.subScores.forehead}
            to={right.subScores.forehead}
            higherIsBetter
          />
        </div>

        <CaptureWarning base={base} right={right} />
      </section>
    </div>
  );
}

function ChangeTile({
  icon,
  label,
  from,
  to,
  higherIsBetter = false,
}: {
  icon: string;
  label: string;
  from: number;
  to: number;
  higherIsBetter?: boolean;
}) {
  const raw = countDelta(to, from);
  const improved = higherIsBetter ? to >= from : (raw?.improved ?? true);
  const diff = to - from;

  return (
    <div className="flex items-center rounded-xl bg-surface-container-low p-3">
      <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container">
        <Icon name={icon} filled className="text-primary" />
      </div>
      <div>
        <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
        <p className={`font-label-bold text-label-bold ${improved ? "text-primary" : "text-error"}`}>
          {diff > 0 ? "+" : ""}
          {diff}
        </p>
      </div>
    </div>
  );
}

/**
 * Spec §9: a comparison is only meaningful when both photos were taken under
 * similar conditions, so say so when they were not.
 */
function CaptureWarning({ base, right }: { base: DayRecord; right: DayRecord }) {
  const gap = Math.abs(base.subScores.captureConsistency - right.subScores.captureConsistency);
  if (gap < 20) return null;

  return (
    <div className="mt-4 flex items-start gap-2 rounded-xl bg-error-container p-3">
      <Icon name="info" size={18} className="mt-0.5 text-on-error-container" />
      <p className="font-label-sm text-label-sm text-on-error-container">
        두 날의 촬영 조건 차이가 커요 (일관성 {base.subScores.captureConsistency} vs{" "}
        {right.subScores.captureConsistency}). 조명이나 초점 차이가 결과에 섞였을 수 있어요.
      </p>
    </div>
  );
}
