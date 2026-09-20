"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { withBase } from "@/lib/assets";
import { useStore } from "@/lib/store";

/**
 * App entry. Shows the loading splash briefly, then hands off straight to
 * the survey for new users or the dashboard for returning ones — no
 * separate landing/hero screen in between.
 *
 * Signed-out users go to /login first. `/?demo=12` (any 1–15) replaces local
 * state with the deterministic demo data (which includes a demo user) and
 * lands on the dashboard — the deck's "Live Demo" link.
 */
const SPLASH_MS = 2000;

export default function EntryPage() {
  return (
    <Suspense fallback={<Splash />}>
      <Entry />
    </Suspense>
  );
}

function Entry() {
  const { state, hydrated, loadDemo } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const demoParam = params.get("demo");
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSplashDone(true), SPLASH_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!splashDone || !hydrated) return;
    if (demoParam !== null) {
      const days = Number.parseInt(demoParam, 10);
      loadDemo(Number.isFinite(days) && days > 0 ? days : 12);
      router.replace("/today");
      return;
    }
    if (!state.user) {
      router.replace("/login");
      return;
    }
    router.replace(state.survey ? "/today" : "/onboarding/survey");
  }, [splashDone, hydrated, state.user, state.survey, demoParam, loadDemo, router]);

  return <Splash />;
}

function Splash() {
  return (
    <div className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-background">
      <Image
        src={withBase("/design/00_logo.png")}
        alt="DailySkin"
        width={805}
        height={274}
        priority
        className="w-[240px] drop-shadow-[0_16px_48px_rgba(31,91,80,0.18)]"
      />
      {/* A loading ring around the wordmark, not over a full-bleed photo. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="h-[54%] w-[54%] animate-spin [animation-duration:2.6s]">
          <circle
            cx="100"
            cy="100"
            r="94"
            fill="none"
            stroke="#97d2c4"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="70 520"
            opacity="0.9"
          />
        </svg>
      </div>
    </div>
  );
}
