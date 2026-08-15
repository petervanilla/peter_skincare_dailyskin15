"use client";

import { BeforeAfterCompare } from "@/components/BeforeAfterCompare";
import { BottomNav } from "@/components/BottomNav";
import { TopAppBar } from "@/components/TopAppBar";
import { useStore } from "@/lib/store";

/** Before / After split view (spec §9) as a standalone route. */
export default function ComparePage() {
  const { state, hydrated } = useStore();

  if (!hydrated) return <div className="p-margin-main">불러오는 중…</div>;

  return (
    <div className="min-h-dvh pb-32">
      <TopAppBar title="Before / After" back />
      <main className="px-margin-main">
        <BeforeAfterCompare records={state.records} />
      </main>

      <BottomNav />
    </div>
  );
}
