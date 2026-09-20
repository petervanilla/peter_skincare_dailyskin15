"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { ProductSheet } from "@/components/ProductSheet";
import { ActiveChips, ProductImage } from "@/components/ProductTile";
import { haptic } from "@/lib/haptics";
import { deriveNeeds, focusHeadline, recommendProducts, type ProductMatch } from "@/lib/matching";
import { latestRecord } from "@/lib/scoring";
import { useStore } from "@/lib/store";

/**
 * 제품 추천 (spec §12) — the four indices + survey become "needs", needs
 * become ingredient matches, and every pick explains itself in one line.
 * Shared between the Shop tab and the Progress page's 제품 추천 tab.
 */
export function ProductRecommendations() {
  const { state, hydrated } = useStore();
  const [selected, setSelected] = useState<ProductMatch | null>(null);

  if (!hydrated) return <div className="p-margin-main">불러오는 중…</div>;

  const today = latestRecord(state.records);
  const needs = deriveNeeds(state.survey, today);
  const headline = focusHeadline(needs);
  const picks = recommendProducts(state.survey, today, { diversify: true, limit: 4 });

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col items-center pb-1 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary-fixed px-4 py-1.5 text-on-secondary-fixed">
          <Icon name="shield" filled size={16} />
          <span className="font-label-sm text-[11px] tracking-wider uppercase">
            Today&apos;s Focus
          </span>
        </div>
        <h1 className="mb-2 font-display-hero-mobile text-display-hero-mobile text-primary">
          {headline.title}
        </h1>
        <p className="max-w-md font-body-md text-body-md break-keep text-on-surface-variant">
          설문{today ? ` + Day ${today.day} 지표` : ""}를 규칙에 넣어 성분을 매칭했어요. 특정
          브랜드나 효과를 보장하지 않아요.
        </p>
        <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">{headline.caption}</p>
      </section>

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {needs.slice(0, 4).map((n) => (
          <span
            key={n.id}
            className="shrink-0 rounded-full bg-tertiary-fixed px-3 py-1.5 font-label-sm text-label-sm text-on-tertiary-fixed"
          >
            <b className="font-label-bold">{n.label}</b> · {n.reason}
          </span>
        ))}
      </div>

      <section className="stagger flex flex-col gap-3">
        {picks.map((m) => (
          <button
            key={m.product.id}
            type="button"
            onClick={() => {
              haptic("select");
              setSelected(m);
            }}
            className="flex items-start gap-3 rounded-[24px] bg-pure-white p-3 text-left shadow-[0_4px_20px_rgba(46,104,93,0.05)]"
          >
            <ProductImage
              product={m.product}
              sizes="72px"
              className="h-[72px] w-[72px] shrink-0 rounded-xl"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-label-sm text-[10px] tracking-wide text-on-surface-variant uppercase">
                {m.product.brand}
              </span>
              <h3 className="line-clamp-2 font-label-bold text-label-bold text-on-surface">
                {m.product.name}
              </h3>
              <p className="font-label-sm text-label-sm break-keep text-primary">{m.reason}</p>
              <ActiveChips actives={m.product.actives} hits={m.hits} />
              {m.cautions.length ? (
                <p className="font-label-sm text-[11px] text-[#7a4b00]">
                  {m.cautions.join(" · ")}
                </p>
              ) : null}
            </div>
            <Icon name="chevron_right" className="mt-6 shrink-0 text-on-surface-variant" size={20} />
          </button>
        ))}
      </section>

      <p className="px-2 text-center font-label-sm text-label-sm text-on-surface-variant">
        피부에 지속적인 불편이 있다면 전문가와 상담하세요.
      </p>

      <ProductSheet
        product={selected?.product ?? null}
        match={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
