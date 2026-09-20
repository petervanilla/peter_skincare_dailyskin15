"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { ProductSheet } from "@/components/ProductSheet";
import { ProductTile } from "@/components/ProductTile";
import { haptic } from "@/lib/haptics";
import {
  ACTIVE_LABELS,
  CATALOG_ATTRIBUTION,
  CATEGORY_LABELS,
  PRODUCTS,
  type Product,
  type ProductCategoryId,
} from "@/lib/products";

type Filter = "all" | "kbeauty" | ProductCategoryId;

interface ProductCatalogProps {
  /** Product id to open on mount (Shop deep link `?product=`). */
  initialProductId?: string | null;
}

/** Browsable + searchable catalog of real products behind the personalized picks. */
export function ProductCatalog({ initialProductId = null }: ProductCatalogProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [brand, setBrand] = useState<string | null>(null);
  const [selected, setSelected] = useState<Product | null>(
    () => PRODUCTS.find((p) => p.id === initialProductId) ?? null,
  );

  const categories = useMemo(
    () =>
      (Object.keys(CATEGORY_LABELS) as ProductCategoryId[]).filter((c) =>
        PRODUCTS.some((p) => p.category === c),
      ),
    [],
  );
  const brands = useMemo(() => [...new Set(PRODUCTS.map((p) => p.brand))].sort(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (filter === "kbeauty" && !p.kbeauty) return false;
      if (filter !== "all" && filter !== "kbeauty" && p.category !== filter) return false;
      if (brand && p.brand !== brand) return false;
      if (!q) return true;
      const hay = [
        p.brand,
        p.name,
        p.highlight ?? "",
        CATEGORY_LABELS[p.category],
        ...p.actives.map((a) => ACTIVE_LABELS[a]),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, filter, brand]);

  const pick = (f: Filter) => {
    haptic("tap");
    setFilter(f);
  };

  const fetched = CATALOG_ATTRIBUTION.fetchedAt
    ? CATALOG_ATTRIBUTION.fetchedAt.slice(0, 10).replaceAll("-", ".")
    : "";

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
          placeholder="브랜드, 제품명, 성분으로 검색"
          className="w-full rounded-full border border-outline-variant bg-pure-white py-3 pr-4 pl-11 font-body-md text-body-md outline-none focus:border-primary"
        />
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        <FilterChip label="전체" active={filter === "all"} onClick={() => pick("all")} />
        <FilterChip label="K-뷰티" active={filter === "kbeauty"} onClick={() => pick("kbeauty")} />
        {categories.map((id) => (
          <FilterChip
            key={id}
            label={CATEGORY_LABELS[id]}
            active={filter === id}
            onClick={() => pick(id)}
          />
        ))}
      </div>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        <BrandChip label="모든 브랜드" active={brand === null} onClick={() => setBrand(null)} />
        {brands.map((b) => (
          <BrandChip key={b} label={b} active={brand === b} onClick={() => setBrand(b)} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center font-label-sm text-label-sm text-on-surface-variant">
          검색 결과가 없어요. 다른 검색어로 시도해 보세요.
        </p>
      ) : (
        <div className="stagger grid grid-cols-2 gap-3">
          {filtered.map((p) => (
            <ProductTile
              key={p.id}
              product={p}
              onClick={() => {
                haptic("select");
                setSelected(p);
              }}
            />
          ))}
        </div>
      )}

      <footer className="flex flex-col gap-1 px-1 pt-2 font-label-sm text-[11px] leading-4 text-on-surface-variant">
        <p>
          제품 정보·사진:{" "}
          <a
            href={CATALOG_ATTRIBUTION.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {CATALOG_ATTRIBUTION.source}
          </a>{" "}
          (ODbL · CC BY-SA){fetched ? ` · ${fetched} 기준` : ""}
        </p>
        <p>K-뷰티 항목은 제품명과 대표 성분만 표기해요.</p>
      </footer>

      <ProductSheet product={selected} open={selected !== null} onClose={() => setSelected(null)} />
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
          ? "pop bg-primary text-pure-white"
          : "bg-surface-container text-on-surface-variant hover:bg-surface-container-highest"
      }`}
    >
      {label}
    </button>
  );
}

function BrandChip({
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
      className={`shrink-0 rounded-full border px-3 py-1 font-label-sm text-label-sm transition-colors ${
        active
          ? "border-primary bg-secondary-container text-primary"
          : "border-outline-variant bg-pure-white text-on-surface-variant"
      }`}
    >
      {label}
    </button>
  );
}
