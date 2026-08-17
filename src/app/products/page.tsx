"use client";

import { BottomNav } from "@/components/BottomNav";
import { ProductRecommendations } from "@/components/ProductRecommendations";
import { TopAppBar } from "@/components/TopAppBar";

/** 제품 추천 (spec §12) as a standalone, deep-linkable page. */
export default function ProductsPage() {
  return (
    <div className="min-h-dvh pb-24">
      <TopAppBar title="맞춤 제품 추천" back />
      <main className="px-margin-main pt-4 pb-4">
        <ProductRecommendations />
      </main>
      <BottomNav />
    </div>
  );
}
