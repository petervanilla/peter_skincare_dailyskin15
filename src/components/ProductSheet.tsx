"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Icon } from "@/components/Icon";
import { ActiveChips, ProductImage } from "@/components/ProductTile";
import { haptic } from "@/lib/haptics";
import type { ProductMatch } from "@/lib/matching";
import { CATEGORY_LABELS, productSearchUrl, type Product } from "@/lib/products";

interface ProductSheetProps {
  product: Product | null;
  match?: ProductMatch | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Product detail as a bottom sheet. Shared by the Shop catalog, the
 * recommendation rail and the scan → recommendation flow (lane I).
 *
 * Nothing here sells: the primary action turns the product into a 15-day
 * experiment variable, the secondary opens an external search.
 */
export function ProductSheet({ product, match, open, onClose }: ProductSheetProps) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !product) return null;

  const startExperiment = () => {
    haptic("success");
    const title = `${product.brand} ${product.name} 추가`;
    router.push(`/experiment?kind=add-product&title=${encodeURIComponent(title)}`);
  };

  const openSearch = () => {
    haptic("tap");
    window.open(productSearchUrl(product), "_blank", "noopener");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="no-press absolute inset-0 bg-graphite/45"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${product.brand} ${product.name}`}
        className="sheet-up relative flex max-h-[88dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[32px] bg-background shadow-[0_-8px_40px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-center justify-between px-margin-main pt-4 pb-2">
          <span className="h-1.5 w-10 rounded-full bg-outline-variant" aria-hidden />
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-margin-main pb-8">
          <ProductImage
            product={product}
            sizes="430px"
            className="aspect-[4/3] w-full rounded-2xl"
          />

          {product.mockup ? (
            <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant">
              제품 유형을 보여주는 AI 목업이며, 실제 브랜드 패키지와 달라요.
            </p>
          ) : null}

          <div className="mt-4">
            <p className="font-label-sm text-label-sm tracking-wide text-on-surface-variant uppercase">
              {product.brand} · {CATEGORY_LABELS[product.category]}
            </p>
            <h2 className="mt-1 font-headline-md text-headline-md text-on-surface">{product.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {product.quantity ? (
                <span className="rounded-full bg-surface-container px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant">
                  {product.quantity}
                </span>
              ) : null}
              {product.spf ? (
                <span className="rounded-full bg-[#fff4d6] px-2.5 py-1 font-label-bold text-label-sm text-[#7a4b00]">
                  SPF {product.spf}
                </span>
              ) : null}
              {product.kbeauty ? (
                <span className="rounded-full bg-secondary-container px-2.5 py-1 font-label-sm text-label-sm text-primary">
                  K-뷰티
                </span>
              ) : null}
            </div>
            {product.highlight ? (
              <p className="mt-2 font-body-md text-body-md text-on-surface-variant">{product.highlight}</p>
            ) : null}
          </div>

          <section className="mt-5">
            <h3 className="mb-2 font-label-bold text-label-bold text-on-surface">대표 성분</h3>
            <ActiveChips actives={product.actives} hits={match?.hits ?? []} limit={8} />
          </section>

          {match ? (
            <section className="mt-4 rounded-2xl bg-tertiary-fixed p-4 text-on-tertiary-fixed">
              <div className="mb-1 flex items-center gap-2">
                <Icon name="auto_awesome" size={16} filled />
                <span className="font-label-sm text-[11px] font-bold tracking-wider uppercase">
                  내 피부와의 매칭
                </span>
              </div>
              <p className="font-body-md text-body-md break-keep">{match.reason}</p>
              {match.cautions.length ? (
                <ul className="mt-3 flex flex-col gap-1">
                  {match.cautions.map((c) => (
                    <li
                      key={c}
                      className="flex items-start gap-1.5 rounded-lg bg-[#fff4d6] px-2.5 py-1.5 font-label-sm text-label-sm text-[#7a4b00]"
                    >
                      <Icon name="info" size={14} className="mt-0.5" />
                      {c}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          {product.ingredients ? (
            <details className="mt-4 rounded-2xl bg-pure-white p-4 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
              <summary className="cursor-pointer font-label-bold text-label-bold text-on-surface">
                전성분 보기
              </summary>
              <p className="mt-2 font-label-sm text-label-sm leading-5 break-words text-on-surface-variant">
                {product.ingredients}
              </p>
            </details>
          ) : (
            <p className="mt-4 font-label-sm text-label-sm text-on-surface-variant">
              K-뷰티 항목은 제품명과 대표 성분만 표기해요. 전성분은 제품 뒷면을 확인해 주세요.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={startExperiment}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-bold text-label-bold text-pure-white shadow-md"
            >
              <Icon name="science" size={18} />
              이 제품으로 15일 실험하기
            </button>
            <button
              type="button"
              onClick={openSearch}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-pure-white py-4 font-label-bold text-label-bold text-primary"
            >
              <Icon name="open_in_new" size={18} />
              판매처 검색
            </button>
            <p className="text-center font-label-sm text-label-sm text-on-surface-variant">
              외부 검색으로 연결돼요. 앱은 구매를 중개하지 않아요.
            </p>
            {product.source ? (
              <a
                href={product.source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center font-label-sm text-label-sm text-on-surface-variant underline underline-offset-4"
              >
                출처 보기 · Open Beauty Facts
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
