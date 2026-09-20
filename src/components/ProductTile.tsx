"use client";

import Image from "next/image";
import { Icon } from "@/components/Icon";
import {
  ACTIVE_LABELS,
  CATEGORY_ICON,
  CATEGORY_LABELS,
  monogram,
  type ActiveKey,
  type Product,
} from "@/lib/products";

/** Soft Lab fills for photo-less monogram tiles, cycled by brand. */
const MONO_FILLS = [
  "bg-secondary-container text-primary",
  "bg-tertiary-fixed text-on-tertiary-fixed",
  "bg-primary-fixed text-on-primary-fixed",
  "bg-[#fff4d6] text-[#7a4b00]",
  "bg-surface-container-high text-on-surface",
];

function fillFor(brand: string) {
  let h = 0;
  for (const ch of brand) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return MONO_FILLS[h % MONO_FILLS.length];
}

/**
 * Product image well: the OBF photo when we have one, otherwise a monogram
 * tile (brand initials + category glyph) so curated K-beauty items sit in the
 * same grid without a fake pack shot.
 */
export function ProductImage({
  product,
  sizes = "220px",
  className = "",
}: {
  product: Product;
  sizes?: string;
  className?: string;
}) {
  if (product.image) {
    return (
      // White well: the photos are background-knocked PNGs (scripts/
      // cutout-products.py), so the pack floats on the same white the card
      // uses — no photo rectangle inside a grey tile.
      <div className={`relative overflow-hidden bg-pure-white ${className}`}>
        <Image
          src={product.image}
          alt={`${product.brand} ${product.name}`}
          fill
          sizes={sizes}
          className="object-contain p-4 drop-shadow-[0_6px_14px_rgba(46,104,93,0.12)]"
        />
      </div>
    );
  }
  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-1 overflow-hidden ${fillFor(product.brand)} ${className}`}
      aria-label={`${product.brand} ${product.name}`}
    >
      <span className="font-headline-md text-headline-md tracking-wide">{monogram(product.brand)}</span>
      <Icon name={CATEGORY_ICON[product.category]} size={18} className="opacity-70" />
      <span className="absolute right-2 bottom-2 rounded-full bg-pure-white/70 px-1.5 py-0.5 font-label-sm text-[9px] text-on-surface-variant">
        K-BEAUTY
      </span>
    </div>
  );
}

/** Small ingredient chips; `hits` are highlighted in mint. */
export function ActiveChips({
  actives,
  hits = [],
  limit = 3,
}: {
  actives: ActiveKey[];
  hits?: ActiveKey[];
  limit?: number;
}) {
  const ordered = [...actives.filter((a) => hits.includes(a)), ...actives.filter((a) => !hits.includes(a))]
    .filter((a) => a !== "oilFree" || actives.length <= 2)
    .slice(0, limit);
  return (
    <div className="flex flex-wrap gap-1">
      {ordered.map((a) => (
        <span
          key={a}
          className={`rounded-full px-2 py-0.5 font-label-sm text-[10px] ${
            hits.includes(a)
              ? "bg-primary-fixed text-on-primary-fixed"
              : "bg-surface-container text-on-surface-variant"
          }`}
        >
          {ACTIVE_LABELS[a]}
        </span>
      ))}
    </div>
  );
}

/** Grid card used by the Shop catalog and the recommendation rails. */
export function ProductTile({
  product,
  hits = [],
  reason,
  onClick,
}: {
  product: Product;
  hits?: ActiveKey[];
  reason?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full flex-col overflow-hidden rounded-2xl bg-pure-white text-left shadow-[0_4px_20px_rgba(46,104,93,0.05)]"
    >
      <ProductImage product={product} className="aspect-square w-full" />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="font-label-sm text-[10px] tracking-wide text-on-surface-variant uppercase">
          {product.brand} · {CATEGORY_LABELS[product.category]}
        </span>
        <h4 className="line-clamp-2 font-label-bold text-label-bold text-on-surface">{product.name}</h4>
        {reason ? (
          <p className="line-clamp-2 font-label-sm text-label-sm text-primary">{reason}</p>
        ) : product.highlight ? (
          <p className="line-clamp-1 font-label-sm text-label-sm text-on-surface-variant">{product.highlight}</p>
        ) : null}
        <div className="mt-auto pt-2">
          <ActiveChips actives={product.actives} hits={hits} />
        </div>
      </div>
    </button>
  );
}
