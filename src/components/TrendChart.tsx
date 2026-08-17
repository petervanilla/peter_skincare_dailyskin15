"use client";

import { useState } from "react";
import { CHALLENGE_LENGTH, type SubScores } from "@/lib/types";

type SeriesKey = "score" | keyof SubScores;

interface Point {
  day: number;
  dailySkinScore: number;
  subScores: SubScores;
}

const SERIES: Array<{ key: SeriesKey; label: string; color: string }> = [
  { key: "score", label: "종합 점수", color: "#004339" },
  { key: "trouble", label: "트러블", color: "#ba1a1a" },
  { key: "spot", label: "잡티 · 색소", color: "#c98a2b" },
  { key: "nasolabial", label: "팔자 라인", color: "#3d2d7b" },
  { key: "forehead", label: "이마 주름", color: "#2f6f9e" },
];

function valueFor(p: Point, key: SeriesKey) {
  return key === "score" ? p.dailySkinScore : p.subScores[key];
}

/**
 * Merges the old single-line score chart and the 4-line sub-score chart into
 * one: the overall score keeps its area-fill "anchor" treatment, the 4
 * indicators keep their own colored lines, and hovering (or tapping, for
 * touch) a legend chip isolates just that line.
 */
export function TrendChart({ records }: { records: Point[] }) {
  const [focused, setFocused] = useState<SeriesKey | null>(null);
  const width = 320;
  const height = 170;
  const pad = 16;

  if (records.length < 2) {
    return (
      <p className="py-8 text-center font-label-sm text-label-sm text-on-surface-variant">
        이틀 이상 기록하면 추이 그래프가 그려져요.
      </p>
    );
  }

  const xs = (day: number) => pad + ((day - 1) / (CHALLENGE_LENGTH - 1)) * (width - pad * 2);
  const ys = (v: number) => height - pad - (v / 100) * (height - pad * 2);

  const last = records[records.length - 1];
  const areaPath = `${records
    .map((r, i) => `${i === 0 ? "M" : "L"} ${xs(r.day)} ${ys(r.dailySkinScore)}`)
    .join(" ")} L ${xs(last.day)} ${height - pad} L ${xs(records[0].day)} ${height - pad} Z`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="점수 및 지표별 15일 변화 추이"
      >
        {[0, 50, 100].map((v) => (
          <line
            key={v}
            x1={pad}
            x2={width - pad}
            y1={ys(v)}
            y2={ys(v)}
            stroke="#e3e2df"
            strokeWidth="1"
          />
        ))}

        <path
          d={areaPath}
          fill="#cfe8dc"
          opacity={focused && focused !== "score" ? 0.15 : 0.5}
          style={{ transition: "opacity 200ms ease" }}
        />

        {SERIES.map((s) => {
          const path = records
            .map((r, i) => `${i === 0 ? "M" : "L"} ${xs(r.day)} ${ys(valueFor(r, s.key))}`)
            .join(" ");
          const dimmed = focused !== null && focused !== s.key;
          return (
            <g key={s.key} opacity={dimmed ? 0.12 : 1} style={{ transition: "opacity 200ms ease" }}>
              <path
                d={path}
                fill="none"
                stroke={s.color}
                strokeWidth={s.key === "score" ? 3 : 2.5}
                strokeLinecap="round"
              />
              {records.map((r) => (
                <circle
                  key={r.day}
                  cx={xs(r.day)}
                  cy={ys(valueFor(r, s.key))}
                  r={s.key === "score" ? 3.5 : 3}
                  fill={s.color}
                />
              ))}
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap gap-x-2 gap-y-2">
        {SERIES.map((s) => (
          <button
            key={s.key}
            type="button"
            onMouseEnter={() => setFocused(s.key)}
            onMouseLeave={() => setFocused(null)}
            onFocus={() => setFocused(s.key)}
            onBlur={() => setFocused(null)}
            onClick={() => setFocused((f) => (f === s.key ? null : s.key))}
            className={`flex items-center gap-1.5 rounded-full px-2 py-1 font-label-sm text-label-sm transition-colors ${
              focused === s.key
                ? "bg-surface-container-low text-on-surface"
                : "text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
