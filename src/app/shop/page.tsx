"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ProductCatalog } from "@/components/ProductCatalog";
import { ProductRecommendations } from "@/components/ProductRecommendations";

/** Shop tab — personalized picks up top, the full searchable catalog below. */
export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-margin-main">불러오는 중…</div>}>
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const params = useSearchParams();
  // `?product=<id>` deep-links straight into a product sheet (scan flow).
  const productId = params.get("product");

  return (
    <div className="min-h-dvh pb-24">
      <AppHeader />
      <main className="flex flex-col gap-8 px-margin-main pt-4 pb-4">
        <ProductRecommendations />

        <section className="flex flex-col gap-4">
          <h2 className="font-label-bold text-label-bold tracking-wider text-on-surface-variant uppercase">
            전체 상품
          </h2>
          <ProductCatalog initialProductId={productId} />
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
