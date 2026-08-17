"use client";

import Image from "next/image";
import { Icon } from "@/components/Icon";
import { IMG } from "@/lib/assets";
import { CATEGORY_ICON, CATEGORY_IMAGE } from "@/lib/products";
import { recommendProductCategories } from "@/lib/recommendations";
import { latestRecord } from "@/lib/scoring";
import { useStore } from "@/lib/store";

/**
 * 제품 추천 (spec §12) content — rule-based candidate filter, then a plain
 * language reason. Shared between the Shop tab and the Progress page's
 * 제품 추천 tab, so it renders in place there instead of navigating away
 * from the "Day N of 15" context.
 */
export function ProductRecommendations() {
  const { state, hydrated } = useStore();

  if (!hydrated) return <div className="p-margin-main">불러오는 중…</div>;

  const today = latestRecord(state.records);
  const categories = recommendProductCategories(state.survey, today);

  return (
    <div className="flex flex-col gap-6">
      {/* Centred hero, ported from the approved comp */}
      <section className="flex flex-col items-center pb-1 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary-fixed px-4 py-1.5 text-on-secondary-fixed">
          <Icon name="shield" filled size={16} />
          <span className="font-label-sm text-[11px] tracking-wider uppercase">
            Today&apos;s Focus
          </span>
        </div>
        <h1 className="mb-2 font-display-hero-mobile text-display-hero-mobile text-primary">
          Calm &amp; Protect
        </h1>
        <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
          설문 응답
          {today ? ` + Day ${today.day} 지표` : ""}를 규칙에 넣어 제품 &quot;유형&quot;을
          골랐어요. 특정 브랜드나 치료 효과를 보장하지 않아요.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        {categories.map((c) => (
          <article
            key={c.id}
            className="flex flex-col overflow-hidden rounded-[24px] bg-pure-white p-gutter shadow-[0_4px_20px_rgba(46,104,93,0.05)]"
          >
            <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl bg-surface-container-low">
              <Image
                src={CATEGORY_IMAGE[c.id] ?? IMG.productSkinTexture}
                alt={c.category}
                fill
                sizes="430px"
                className="object-cover"
              />
              <div className="absolute top-2 left-2 rounded bg-glass-overlay px-2 py-1 font-label-bold text-[10px] text-primary backdrop-blur-md">
                {c.category}
              </div>
              {/* Lavender = DESIGN.md's AI-insight color — this pick came
                  straight out of the rule engine reading today's sub-scores,
                  not a generic catalog listing. */}
              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-tertiary-fixed px-2.5 py-1 text-on-tertiary-fixed shadow-sm">
                <Icon name="auto_awesome" size={12} filled />
                <span className="font-label-bold text-[10px]">
                  {today ? `Day ${today.day} 지표 맞춤` : "맞춤 추천"}
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between py-3">
              <div>
                <h3 className="mb-1 font-headline-md text-headline-md leading-tight text-primary">
                  {c.category}
                </h3>
                <div className="mb-3 flex flex-wrap gap-2">
                  {c.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface-container px-3 py-1 font-label-sm text-label-sm text-on-surface-variant"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-auto rounded-lg border border-tertiary-fixed-dim/40 bg-tertiary-fixed/20 p-3">
                <div className="flex items-start gap-2">
                  <Icon
                    name={CATEGORY_ICON[c.id] ?? "check_circle"}
                    size={18}
                    className="mt-0.5 text-tertiary-container"
                  />
                  <div>
                    <span className="block font-label-bold text-label-bold text-tertiary-container">
                      Why it fits your skin
                    </span>
                    <span className="font-body-md text-sm text-on-surface-variant">{c.why}</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <p className="px-2 text-center font-label-sm text-label-sm text-on-surface-variant">
        피부에 지속적인 불편이 있다면 전문가와 상담하세요.
      </p>
    </div>
  );
}
