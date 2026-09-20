"use client";

import { CHALLENGE_LENGTH } from "@/lib/types";

interface StepPoint {
  day: number;
  score: number;
}

/**
 * Daily Skin Score as a step line (IR deck slide 8): a flat segment per day
 * with a lavender dot where each step starts. Optional dashed vertical marks
 * the day the experiment variable was introduced.
 */
export function StepChart({
  points,
  experimentStartDay,
}: {
  points: StepPoint[];
  experimentStartDay?: number | null;
}) {
  const width = 320;
  const height = 150;
  const padX = 14;
  const padTop = 12;
  const padBottom = 24;

  if (points.length < 2) {
    return (
      <p className="py-8 text-center font-label-sm text-label-sm text-on-surface-variant">
        이틀 이상 기록하면 변화 그래프가 그려져요.
      </p>
    );
  }

  const sorted = [...points].sort((a, b) => a.day - b.day);
  const lo = Math.max(0, Math.min(...sorted.map((p) => p.score)) - 8);
  const hi = Math.min(100, Math.max(...sorted.map((p) => p.score)) + 8);
  const lastDay = sorted[sorted.length - 1].day;
  const span = Math.max(lastDay, Math.min(CHALLENGE_LENGTH, lastDay + 1));
  const stepW = (width - padX * 2) / span;
  const xs = (day: number) => padX + (day - 1) * stepW;
  const ys = (v: number) => padTop + (1 - (v - lo) / Math.max(1, hi - lo)) * (height - padTop - padBottom);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label="일별 종합 점수 변화"
    >
      {[0, 0.5, 1].map((t) => {
        const y = padTop + t * (height - padTop - padBottom);
        return <line key={t} x1={padX} x2={width - padX} y1={y} y2={y} stroke="#e3e2df" strokeWidth="1" />;
      })}

      {experimentStartDay ? (
        <line
          x1={xs(experimentStartDay)}
          x2={xs(experimentStartDay)}
          y1={padTop}
          y2={height - padBottom}
          stroke="#cbbeff"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      ) : null}

      {sorted.map((p, i) => (
        <g key={p.day} className="dot-in" style={{ animationDelay: `${i * 50}ms` }}>
          <line
            x1={xs(p.day) + 3}
            x2={xs(p.day) + stepW - 3}
            y1={ys(p.score)}
            y2={ys(p.score)}
            stroke="#004339"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx={xs(p.day) + 3} cy={ys(p.score)} r="3.5" fill="#cbbeff" stroke="#004339" strokeWidth="1" />
        </g>
      ))}

      <text x={padX} y={height - 6} fontSize="10" fill="#707976" fontWeight="600">
        D{sorted[0].day}
      </text>
      <text x={width - padX} y={height - 6} fontSize="10" fill="#707976" fontWeight="600" textAnchor="end">
        D{lastDay}
      </text>
    </svg>
  );
}
