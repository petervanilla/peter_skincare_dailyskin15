"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { CATEGORY_LABELS, PRODUCTS, type ProductCategoryId } from "@/lib/products";

/** Browsable + searchable product grid — the full catalog behind the personalized picks above it. */
export function ProductCatalog() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<ProductCategoryId | "all">("all");

  // Only categories actually present in PRODUCTS get a chip, so there's
  // never a filter that turns up zero results.
  const categories = [...new Set(PRODUCTS.map((p) => p.categoryId))];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (activeCategory !== "all" && p.categoryId !== activeCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        CATEGORY_LABELS[p.categoryId].toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, activeCategory]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Icon
          name="search"
          size={18}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제품명, 성분, 고민으로 검색"
          className="w-full rounded-full border border-outline-variant bg-pure-white py-3 pr-4 pl-11 font-body-md text-body-md outline-none focus:border-primary"
        />
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        <FilterChip
          label="전체"
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
        />
        {categories.map((id) => (
          <FilterChip
            key={id}
            label={CATEGORY_LABELS[id]}
            active={activeCategory === id}
            onClick={() => setActiveCategory(id)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center font-label-sm text-label-sm text-on-surface-variant">
          검색 결과가 없어요. 다른 검색어로 시도해 보세요.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="flex flex-col overflow-hidden rounded-2xl bg-pure-white shadow-[0_4px_20px_rgba(46,104,93,0.05)]"
            >
              <div className="shimmer relative aspect-square w-full bg-surface-container-low">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="220px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <span className="font-label-sm text-[10px] tracking-wide text-on-surface-variant uppercase">
                  {CATEGORY_LABELS[p.categoryId]}
                </span>
                <h4 className="line-clamp-2 font-label-bold text-label-bold text-on-surface">
                  {p.name}
                </h4>
                <div className="mt-1 flex flex-wrap gap-1">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-surface-container px-2 py-0.5 font-label-sm text-[10px] text-on-surface-variant"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p className="mt-auto pt-2 font-headline-md text-headline-md text-primary">
                  {p.price.toLocaleString()}원
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 font-label-bold text-label-bold transition-colors ${
        active
          ? "bg-primary text-pure-white"
          : "bg-surface-container text-on-surface-variant hover:bg-surface-container-highest"
      }`}
    >
      {label}
    </button>
  );
}
