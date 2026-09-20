"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { IMG } from "@/lib/assets";
import { PRODUCTS } from "@/lib/products";

/**
 * AI Vision Analysis (Stitch screen "AI 피부 분석 — 시각화").
 *
 * Sits between the capture and the result: the four ROI families the pipeline
 * actually measures are named over the mesh while the analysis settles, so the
 * result screen does not appear out of nowhere.
 */
const HOLD_MS = 2800;

const LABELS = [
  {
    title: "Trouble Map",
    sub: "Blemishes",
    tone: "text-primary",
    dot: "bg-primary-fixed-dim",
    position: "top-[16%] left-[2%]",
    align: "items-end",
  },
  {
    title: "Spot Map",
    sub: "Pigmentation",
    tone: "text-tertiary",
    dot: "bg-tertiary-fixed-dim",
    position: "top-[30%] right-[2%]",
    align: "items-start",
  },
  {
    title: "Line Geometry",
    sub: "Smile Lines",
    tone: "text-primary",
    dot: "bg-primary-fixed-dim",
    position: "bottom-[30%] left-[2%]",
    align: "items-end",
  },
  {
    title: "Surface Texture",
    sub: "Micro-relief",
    tone: "text-secondary",
    dot: "bg-secondary-fixed-dim",
    position: "bottom-[14%] right-[2%]",
    align: "items-start",
  },
] as const;

/** Under-image status lines; the last one is the product matching step. */
const STEPS = [
  "피부 표면의 미세한 지형을 매핑하고 있어요.",
  "네 가지 지표를 Day 1 기준과 맞춰 보고 있어요.",
  `성분 매칭 중 · ${PRODUCTS.length}개 제품 비교`,
] as const;

export default function VisionPage() {
  return (
    <Suspense fallback={<div className="p-margin-main">분석 중…</div>}>
      <VisionContent />
    </Suspense>
  );
}

function VisionContent() {
  const router = useRouter();
  const params = useSearchParams();
  const day = params.get("day");
  const [visible, setVisible] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = LABELS.map((_, i) =>
      window.setTimeout(() => setVisible(i + 1), 400 + i * 450),
    );
    // Status copy advances on the same clock; the matching line lands last.
    const stepTimers = STEPS.map((_, i) =>
      window.setTimeout(() => setStep(i), i === 0 ? 0 : 900 + (i - 1) * 900),
    );
    const done = window.setTimeout(
      () => router.replace(day ? `/analysis?day=${day}` : "/analysis"),
      HOLD_MS,
    );
    return () => {
      timers.forEach(window.clearTimeout);
      stepTimers.forEach(window.clearTimeout);
      window.clearTimeout(done);
    };
  }, [router, day]);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="relative flex flex-grow flex-col items-center justify-center px-margin-main pb-safe-area-bottom">
        <div className="z-10 mb-stack-lg text-center">
          <h1 className="font-display-hero-mobile text-display-hero-mobile mb-stack-sm text-primary">
            AI Vision Analysis
          </h1>
          <p
            key={step}
            className="page-in mx-auto flex max-w-md items-center justify-center gap-2 font-body-md text-body-md text-on-surface-variant"
          >
            {step === STEPS.length - 1 ? (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed">
                <span className="material-symbols-outlined filled text-[14px]">auto_awesome</span>
              </span>
            ) : null}
            {STEPS[step]}
          </p>
        </div>

        <div className="relative flex aspect-[3/4] w-full max-w-lg items-center justify-center">
          <Image
            src={IMG.visionMesh}
            alt="피부 분석 시각화"
            fill
            priority
            sizes="430px"
            className="rounded-[2rem] object-cover shadow-[0_4px_40px_rgba(0,67,57,0.05)]"
          />
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-t from-background via-transparent to-transparent" />
          {/* Sweep echoes the scan-line motion in the comp. */}
          <div className="pointer-events-none absolute inset-x-0 h-20 animate-scan-sweep rounded-[2rem] bg-gradient-to-b from-transparent via-primary-fixed/50 to-transparent" />

          <div className="pointer-events-none absolute inset-0 z-10">
            {LABELS.map((label, i) => (
              <div
                key={label.title}
                className={`absolute flex flex-col ${label.align} ${label.position} transition-all duration-500 ${
                  visible > i ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                }`}
              >
                <div className="relative rounded-full border border-surface-variant bg-pure-white/85 px-4 py-2 shadow-sm backdrop-blur-md">
                  <span className={`font-label-bold text-label-bold ${label.tone}`}>
                    {label.title}
                  </span>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">
                    {label.sub}
                  </span>
                  <span
                    className={`absolute top-1/2 h-2 w-2 rounded-full ${label.dot} ${
                      label.align === "items-end" ? "right-[-1.25rem]" : "left-[-1.25rem]"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-stack-lg font-label-sm text-label-sm text-on-surface-variant">
          모든 수치는 사진에서 보이는 추정치예요. 진단이 아닙니다.
        </p>
      </main>
    </div>
  );
}
