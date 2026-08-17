"use client";

import { useEffect, useState } from "react";

interface ScoreRingProps {
  /** 0–100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: React.ReactNode;
  caption?: string;
  /** Soft Lab uses mint for progress on a light green track. */
  color?: string;
  trackColor?: string;
}

export function ScoreRing({
  value,
  size = 180,
  strokeWidth = 14,
  label,
  caption,
  color = "#97d2c4",
  trackColor = "#cfe8dc",
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));

  // Starts empty and fills to the target on mount, so the ring visibly
  // draws itself in rather than appearing already full.
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // No reduced-motion branch needed here: the global stylesheet collapses
    // all transition/animation durations for prefers-reduced-motion, so this
    // stroke-dashoffset transition already resolves instantly for those users.
    const frame = requestAnimationFrame(() => setProgress(clamped));
    return () => cancelAnimationFrame(frame);
  }, [clamped]);

  const offset = circumference * (1 - progress / 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display-hero text-display-hero text-primary">
          {label ?? Math.round(clamped)}
        </span>
        {caption ? (
          <span className="font-label-sm text-label-sm text-on-surface-variant">{caption}</span>
        ) : null}
      </div>
    </div>
  );
}
