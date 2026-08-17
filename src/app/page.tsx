"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

/**
 * App entry. Shows the loading splash briefly, then hands off straight to
 * the survey for new users or the dashboard for returning ones — no
 * separate landing/hero screen in between.
 */
const SPLASH_MS = 2000;

export default function EntryPage() {
  const { state, hydrated } = useStore();
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSplashDone(true), SPLASH_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!splashDone || !hydrated) return;
    router.replace(state.survey ? "/today" : "/onboarding/survey");
  }, [splashDone, hydrated, state.survey, router]);

  return <Splash />;
}

function Splash() {
  return (
    <div className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-background">
      <Image
        src="/design/00_logo.png"
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
