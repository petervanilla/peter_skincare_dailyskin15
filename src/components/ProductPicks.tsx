"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ActiveChips, ProductImage, ProductTile } from "@/components/ProductTile";
import { haptic } from "@/lib/haptics";
import { deriveNeeds, focusHeadline, recommendProducts } from "@/lib/matching";
import type { DayRecord, Survey } from "@/lib/types";

interface ProductPicksProps {
  survey: Survey | null;
  record: DayRecord | null;
  limit?: number;
  variant?: "rail" | "list";
  title?: string;
  caption?: string;
}

/**
 * Skin state → product picks. Reads the latest capture's indices (plus the
 * survey) into needs, ranks the catalog against them and explains each pick
 * in one line. Shared by Analysis (list), Routine (rail) and anywhere else a
 * "matched to today's skin" block is wanted.
 */
export function ProductPicks({
  survey,
  record,
  limit = 3,
  variant = "list",
  title,
  caption,
}: ProductPicksProps) {
  const needs = deriveNeeds(survey, record);
  const picks = recommendProducts(survey, record, { limit, diversify: true });
  if (!picks.length) return null;

  const headline = focusHeadline(needs);
  const tap = () => haptic("tap");

  return (
    <section className="rounded-[24px] bg-pure-white p-5 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
      <div className="mb-1 flex items-center gap-1.5 text-tertiary-container">
        <Icon name="auto_awesome" size={14} filled />
        <span className="font-label-sm text-[10px] font-bold tracking-[0.18em] uppercase">
          {record ? `Matched to Day ${record.day}` : "Matched to survey"}
        </span>
      </div>
      <h3 className="font-headline-md text-headline-md text-primary">{title ?? headline.title}</h3>
      <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
        {caption ?? headline.caption}
      </p>

      <div className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto">
        {needs.slice(0, 3).map((n) => (
          <span
            key={n.id}
            className="shrink-0 rounded-full bg-tertiary-fixed/60 px-2.5 py-1 font-label-sm text-[10px] text-on-tertiary-fixed"
          >
            {n.label} · {n.reason}
          </span>
        ))}
      </div>

      {variant === "rail" ? (
        <div className="no-scrollbar stagger -mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-1">
          {picks.map((m) => (
            <Link
              key={m.product.id}
              href={`/shop?product=${m.product.id}`}
              onClick={tap}
              className="w-[150px] shrink-0"
            >
              <ProductTile product={m.product} hits={m.hits} reason={m.reason} />
            </Link>
          ))}
        </div>
      ) : (
        <ul className="stagger mt-4 flex flex-col gap-2">
          {picks.map((m) => (
            <li key={m.product.id}>
              <Link
                href={`/shop?product=${m.product.id}`}
                onClick={tap}
                className="flex items-start gap-3 rounded-2xl bg-surface-container-low p-3"
              >
                <ProductImage
                  product={m.product}
                  sizes="64px"
                  className="h-16 w-16 shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-label-sm text-[10px] tracking-wide text-on-surface-variant uppercase">
                    {m.product.brand}
                  </p>
                  <p className="line-clamp-1 font-label-bold text-label-bold text-on-surface">
                    {m.product.name}
                  </p>
                  <p className="mt-0.5 line-clamp-2 font-label-sm text-label-sm text-primary">
                    {m.reason}
                  </p>
                  <div className="mt-1.5">
                    <ActiveChips actives={m.product.actives} hits={m.hits} />
                  </div>
                  {m.cautions.length ? (
                    <p className="mt-1.5 rounded-lg bg-[#fff4d6] px-2 py-1 font-label-sm text-[10px] text-[#7a4b00]">
                      {m.cautions.join(" · ")}
                    </p>
                  ) : null}
                </div>
                <Icon name="chevron_right" size={18} className="mt-1 shrink-0 text-on-surface-variant" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/shop"
        onClick={tap}
        className="mt-3 flex items-center justify-center gap-1 rounded-lg py-1.5 font-label-bold text-label-bold text-primary"
      >
        전체 매칭 보기 · Shop
        <Icon name="chevron_right" size={18} />
      </Link>
      <p className="mt-1 text-center font-label-sm text-[10px] text-on-surface-variant">
        성분과 지표의 매칭이에요. 특정 제품의 효과를 보장하지 않아요.
      </p>
    </section>
  );
}
