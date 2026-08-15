"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { LogoBadge } from "@/components/Logo";
import { IMG } from "@/lib/assets";
import { useStore } from "@/lib/store";

/**
 * App entry.
 *
 * Screen 1 of the Stitch board is the loading scene (15 / day / 당신의 피부변화)
 * — it is shown full-bleed on every launch, then hands off to the hero for new
 * users or straight to the dashboard for returning ones.
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
    if (splashDone && hydrated && state.survey) router.replace("/today");
  }, [splashDone, hydrated, state.survey, router]);

  if (!splashDone) return <Splash />;

  return <Hero />;
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

/** 화면 01. Hero (spec §4, Day 0). */
function Hero() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <Image
        src={IMG.lifestyle}
        alt=""
        fill
        priority
        sizes="430px"
        className="object-cover"
      />
      {/* Soft Lab glass wash so the copy stays legible over the interior shot. */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-[20px]" />

      <div className="relative flex flex-1 flex-col px-margin-main pb-safe-area-bottom">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <LogoBadge
            size={160}
            className="mb-stack-lg shadow-[0_16px_40px_rgba(31,91,80,0.16)]"
          />

          <h1 className="font-display-hero-mobile text-display-hero-mobile mb-stack-sm text-primary drop-shadow-sm">
            15일 뒤,
            <br />
            내 피부는 얼마나 달라질까?
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            하루 30초. 같은 얼굴을 기록하면 변화가 보입니다.
          </p>
        </div>

        <div className="flex flex-col gap-3 pb-8">
          <Link
            href="/onboarding/survey"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-container py-4 font-label-bold text-label-bold text-pure-white shadow-lg shadow-primary-container/30 transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            15일 피부 챌린지 시작하기
            <Icon name="arrow_forward" size={20} />
          </Link>
          <p className="text-center font-label-sm text-label-sm text-on-surface-variant">
            사진은 이 기기 안에만 저장돼요. 서버로 전송되지 않습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
