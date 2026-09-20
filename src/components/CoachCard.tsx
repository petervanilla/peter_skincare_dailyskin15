"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { Insight, InsightTone } from "@/lib/insights";

/**
 * Skin Coach — the LEARN step of the core loop, rendered as a stack of
 * observations about the user's own record. Warnings are amber nudges, never
 * error red: nothing here is a diagnosis.
 */
const TONE: Record<InsightTone, { card: string; icon: string; title: string; detail: string }> = {
  positive: {
    card: "bg-primary-fixed/40",
    icon: "bg-pure-white text-primary",
    title: "text-primary",
    detail: "text-on-surface-variant",
  },
  neutral: {
    card: "bg-surface-container-low",
    icon: "bg-pure-white text-on-surface-variant",
    title: "text-on-surface",
    detail: "text-on-surface-variant",
  },
  warning: {
    card: "bg-[#fff4d6]",
    icon: "bg-pure-white text-[#7a4b00]",
    title: "text-[#7a4b00]",
    detail: "text-[#7a4b00]/80",
  },
};

interface CoachCardProps {
  insights: Insight[];
  /** How many to show; omit for all. */
  limit?: number;
  /** Shows the "전체 인사이트 보기" footer link (Today). */
  showMoreLink?: boolean;
}

export function CoachCard({ insights, limit, showMoreLink = false }: CoachCardProps) {
  if (!insights.length) return null;
  const shown = limit ? insights.slice(0, limit) : insights;
  const hidden = insights.length - shown.length;

  return (
    <section className="rounded-[24px] bg-pure-white p-5 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="psychology" size={18} className="text-tertiary-container" />
        <h3 className="font-label-sm text-[11px] font-bold tracking-[0.18em] text-tertiary-container uppercase">
          Skin Coach
        </h3>
      </div>

      <ul className="flex flex-col gap-2">
        {shown.map((insight) => {
          const tone = TONE[insight.tone];
          return (
            <li key={insight.id} className={`flex items-start gap-3 rounded-2xl p-3.5 ${tone.card}`}>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm ${tone.icon}`}
              >
                <Icon name={insight.icon} size={18} filled={insight.tone === "positive"} />
              </span>
              <div className="min-w-0 break-keep">
                <p className={`font-label-bold text-label-bold ${tone.title}`}>{insight.title}</p>
                <p className={`mt-0.5 font-label-sm text-label-sm ${tone.detail}`}>{insight.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {showMoreLink ? (
        <Link
          href="/progress?tab=coach"
          className="mt-3 flex items-center justify-center gap-1 rounded-lg py-1.5 font-label-bold text-label-bold text-primary transition-colors hover:bg-surface-container-low active:bg-surface-container-low"
        >
          전체 인사이트 보기{hidden > 0 ? ` (+${hidden})` : ""}
          <Icon name="chevron_right" size={18} />
        </Link>
      ) : null}

      <p className="mt-3 font-label-sm text-[11px] text-on-surface-variant/70">
        사진에서 보이는 추정치를 바탕으로 한 관찰이에요. 의학적 판단이 아닙니다.
      </p>
    </section>
  );
}
