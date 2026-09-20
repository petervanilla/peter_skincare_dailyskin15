"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IMG } from "@/lib/assets";
import { Suspense } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { ProductPicks } from "@/components/ProductPicks";
import { StoredPhoto } from "@/components/StoredPhoto";
import { TopAppBar } from "@/components/TopAppBar";
import { buildCarePlan } from "@/lib/recommendations";
import {
  countDelta,
  findRecord,
  latestRecord,
  previousRecord,
  SUB_SCORE_LABELS,
} from "@/lib/scoring";
import { useStore } from "@/lib/store";
import { DEFAULT_BASELINE_AGE, type SubScores } from "@/lib/types";

/** AI 피부 분석 결과 (spec §6–§7). All figures are visible estimates. */
export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="p-margin-main">불러오는 중…</div>}>
      <AnalysisContent />
    </Suspense>
  );
}

function AnalysisContent() {
  const { state, hydrated } = useStore();
  const params = useSearchParams();
  const dayParam = Number.parseInt(params.get("day") ?? "", 10);

  const record = Number.isFinite(dayParam)
    ? findRecord(state.records, dayParam)
    : latestRecord(state.records);

  if (!hydrated) return <div className="p-margin-main">불러오는 중…</div>;

  if (!record) {
    return (
      <div className="flex min-h-dvh flex-col">
        <TopAppBar title="DailySkin Analysis" back />
        <EmptyState />
        <BottomNav />
      </div>
    );
  }

  const prev = previousRecord(state.records, record.day);
  const plan = buildCarePlan(state.records, record);
  const baselineAge = state.survey?.age ?? DEFAULT_BASELINE_AGE;
  const weakest = weakestIndex(record.subScores);

  return (
    <div className="flex min-h-dvh flex-col pb-32">
      <TopAppBar title="DailySkin Analysis" back />

      <main className="flex w-full flex-col gap-6 px-margin-main pt-4">
        {/* Capture + overall score */}
        <section className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-surface-variant/50 bg-pure-white shadow-[0_4px_20px_rgba(46,104,93,0.06)]">
          <StoredPhoto
            photoKey={record.photoKeys.front ?? Object.values(record.photoKeys)[0]}
            alt={`Day ${record.day} 정면 촬영`}
            className="h-full w-full object-cover"
            fallback={
              <Image
                src={IMG.analysisFace}
                alt="피부 분석 시각화"
                fill
                sizes="430px"
                className="object-cover"
              />
            }
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-tertiary-fixed/40 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 h-16 animate-scan-sweep bg-gradient-to-b from-transparent via-primary-fixed/40 to-transparent" />

          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center rounded-lg border border-pure-white/40 bg-pure-white/40 px-6 py-3 shadow-sm backdrop-blur-md">
            <p className="mb-1 font-label-sm text-[10px] tracking-widest uppercase opacity-80">
              Overall Score
            </p>
            <div className="flex items-baseline gap-1">
              <span className="font-display-hero-mobile text-display-hero-mobile leading-none text-primary">
                {record.dailySkinScore}
              </span>
              <span className="font-label-sm text-label-sm text-primary/60">/100</span>
            </div>
          </div>
        </section>

        {/* Skin Age Index */}
        <section className="rounded-lg border border-outline-variant/60 bg-pure-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-sm text-label-sm tracking-wider text-on-surface-variant uppercase">
                Visual Skin Age Index
              </p>
              <p className="font-headline-md text-headline-md text-primary">
                {record.skinAgeIndex}
              </p>
              <p
                className={`mt-0.5 font-label-sm text-label-sm ${
                  record.skinAgeIndex - baselineAge <= 0 ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                내 나이 {baselineAge} 기준 {record.skinAgeIndex - baselineAge > 0 ? "+" : ""}
                {record.skinAgeIndex - baselineAge}
              </p>
            </div>
            <Icon name="auto_awesome" className="text-tertiary-container" size={28} />
          </div>
          <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant">
            사진에서 보이는 피부 컨디션을 기준으로 계산한 참고용 지표예요. 의학적 진단이 아닙니다.
          </p>
        </section>

        {/* Four indices */}
        <section className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Trouble"
            icon="healing"
            score={record.subScores.trouble}
            prevScore={prev?.subScores.trouble}
            estimate={`visible trouble ${record.metrics.troubleCount}개`}
            estimateDelta={
              prev ? countDelta(record.metrics.troubleCount, prev.metrics.troubleCount) : null
            }
          />
          <MetricCard
            label="Pigment"
            icon="grain"
            score={record.subScores.spot}
            prevScore={prev?.subScores.spot}
            estimate={`visible spot ${record.metrics.spotCount}개`}
            estimateDelta={
              prev ? countDelta(record.metrics.spotCount, prev.metrics.spotCount) : null
            }
          />
          <MetricCard
            label="Smile Line"
            icon="sentiment_satisfied"
            score={record.subScores.nasolabial}
            prevScore={prev?.subScores.nasolabial}
            estimate={`좌우 대칭 ${Math.round(record.metrics.nasolabialSymmetry * 100)}%`}
          />
          <MetricCard
            label="Forehead"
            icon="horizontal_rule"
            score={record.subScores.forehead}
            prevScore={prev?.subScores.forehead}
            estimate={`visible line ${record.metrics.foreheadLineCount}개`}
            estimateDelta={
              prev
                ? countDelta(record.metrics.foreheadLineCount, prev.metrics.foreheadLineCount)
                : null
            }
          />
        </section>

        {/* Cheek distribution — spec §6 지표 B */}
        <section className="rounded-lg border border-outline-variant/60 bg-pure-white p-5">
          <h3 className="mb-3 font-label-bold text-label-bold text-on-surface">
            잡티 좌우 분포
          </h3>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-container">
            <div
              className="bg-primary-fixed-dim"
              style={{ width: `${Math.round(record.metrics.spotBalance.left * 100)}%` }}
            />
            <div
              className="bg-tertiary-fixed-dim"
              style={{ width: `${Math.round(record.metrics.spotBalance.right * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between font-label-sm text-label-sm text-on-surface-variant">
            <span>왼쪽 볼 {Math.round(record.metrics.spotBalance.left * 100)}%</span>
            <span>오른쪽 볼 {Math.round(record.metrics.spotBalance.right * 100)}%</span>
          </div>
        </section>

        {/* Capture consistency — the precondition for comparing days */}
        <section className="rounded-lg border border-outline-variant/60 bg-pure-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-label-bold text-label-bold text-on-surface">촬영 일관성</h3>
            <span className="font-headline-md text-headline-md text-primary">
              {record.subScores.captureConsistency}
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-surface-variant/50">
            <div
              className="h-1 rounded-full bg-primary"
              style={{ width: `${record.subScores.captureConsistency}%` }}
            />
          </div>
          <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant">
            {record.subScores.captureConsistency >= 70
              ? "촬영 조건이 안정적이에요. 내일도 같은 자리, 같은 조명에서 찍어주세요."
              : "조명과 초점이 흔들렸어요. 같은 조건에서 찍어야 날짜별 비교가 정확해져요."}
          </p>
        </section>

        {/* Skin state → products (deck: 분석 결과 → 맞춤 제품) */}
        <ProductPicks survey={state.survey} record={record} limit={3} variant="list" />

        {/* Priority protocol */}
        <section className="relative overflow-hidden rounded-lg border border-tertiary-fixed-dim/40 bg-tertiary-fixed/25 p-5">
          <div className="flex flex-col">
            <div className="mb-2 flex items-center gap-2">
              <Icon name="biotech" size={18} className="text-tertiary-container" />
              <h3 className="font-label-sm text-[11px] font-bold tracking-wider text-tertiary-container uppercase">
                Priority Protocol
              </h3>
            </div>
            <p className="mb-1 font-body-md text-body-md text-tertiary-container">
              오늘 가장 관리가 필요한 부분:{" "}
              <span className="border-b border-tertiary-container/30 pb-0.5 font-bold">
                {SUB_SCORE_LABELS[weakest]}
              </span>
            </p>
            <p className="mb-4 font-label-sm text-label-sm text-tertiary-container/80">
              {plan.headline}
            </p>
            <Link
              href="/routine"
              className="inline-flex w-full items-center justify-center rounded-lg border border-tertiary-fixed-dim/50 bg-pure-white px-5 py-2.5 font-label-bold text-label-bold text-tertiary-container transition-colors hover:bg-surface-bright active:bg-surface-container-low"
            >
              오늘의 케어 루틴 시작하기
              <Icon name="science" size={16} className="ml-2" />
            </Link>
            <Link
              href="/shop"
              className="mt-2 flex items-center justify-center gap-1 py-1 font-label-sm text-label-sm text-tertiary-container"
            >
              이 상태에 맞는 제품 보기
              <Icon name="chevron_right" size={16} />
            </Link>
          </div>
        </section>

        <Link
          href="/today"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-bold text-label-bold text-pure-white transition-colors hover:bg-primary-container active:bg-primary-container"
        >
          대시보드로 이동
          <Icon name="arrow_forward" size={18} />
        </Link>
      </main>

      <BottomNav />
    </div>
  );
}

function weakestIndex(s: SubScores): keyof SubScores {
  const entries = Object.entries(s) as Array<[keyof SubScores, number]>;
  // Capture consistency is a photo-quality signal, not a skin concern.
  const skinOnly = entries.filter(([k]) => k !== "captureConsistency");
  return skinOnly.reduce((a, b) => (b[1] < a[1] ? b : a))[0];
}

function MetricCard({
  label,
  icon,
  score,
  prevScore,
  estimate,
  estimateDelta,
}: {
  label: string;
  icon: string;
  score: number;
  prevScore?: number;
  estimate: string;
  estimateDelta?: { value: number; percent: number; improved: boolean } | null;
}) {
  const needsAction = score < 65;
  const scoreChange = prevScore === undefined ? null : score - prevScore;

  return (
    <div className={`relative overflow-hidden rounded-lg border bg-pure-white p-4 ${
      needsAction ? "border-error/25" : "border-surface-variant/60"
    }`}
    >
      <div className="mb-3 flex items-start justify-between">
        <span
          className={`font-label-sm text-[11px] font-semibold tracking-wider uppercase ${
            needsAction ? "text-error" : "text-on-surface-variant"
          }`}
        >
          {label}
        </span>
        <Icon
          name={needsAction ? "warning" : icon}
          size={16}
          className={needsAction ? "text-error opacity-70" : "text-secondary opacity-70"}
        />
      </div>

      <div className="flex items-baseline gap-2">
        <span
          className={`font-headline-md text-headline-md ${
            needsAction ? "text-error" : "text-on-surface"
          }`}
        >
          {score}
        </span>
        {scoreChange !== null && scoreChange !== 0 ? (
          <span
            className={`flex items-center rounded px-1.5 py-0.5 font-label-sm text-[10px] ${
              scoreChange > 0
                ? "bg-secondary-fixed text-primary-container"
                : "bg-error/10 text-error"
            }`}
          >
            <Icon name={scoreChange > 0 ? "arrow_upward" : "arrow_downward"} size={10} />
            {Math.abs(scoreChange)}
          </span>
        ) : null}
      </div>

      <div className="mt-3 h-1 w-full rounded-full bg-surface-variant/50">
        <div
          className={`h-1 rounded-full ${needsAction ? "bg-error" : "bg-primary"}`}
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="mt-2 font-label-sm text-label-sm text-on-surface-variant">
        {estimate}
        {estimateDelta && estimateDelta.value !== 0 ? (
          <span className={estimateDelta.improved ? " text-primary" : " text-error"}>
            {" "}
            ({estimateDelta.value > 0 ? "+" : ""}
            {estimateDelta.value})
          </span>
        ) : null}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-margin-main text-center">
      <Icon name="photo_camera" size={48} className="text-outline" />
      <p className="font-body-md text-body-md text-on-surface-variant">
        아직 기록된 촬영이 없어요.
      </p>
      <Link
        href="/scan"
        className="rounded-full bg-primary px-6 py-3 font-label-bold text-label-bold text-pure-white transition-colors hover:bg-primary-container active:bg-primary-container"
      >
        첫 촬영 시작하기
      </Link>
    </div>
  );
}
