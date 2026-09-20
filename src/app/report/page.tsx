"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { StepChart } from "@/components/StepChart";
import { TopAppBar } from "@/components/TopAppBar";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ProductImage } from "@/components/ProductTile";
import { recommendProducts } from "@/lib/matching";
import { Confetti } from "@/components/ui/confetti";
import { haptic } from "@/lib/haptics";
import {
  buildInsights,
  experimentVerdict,
  nextExperimentSuggestion,
  type Insight,
  type InsightTone,
} from "@/lib/insights";
import { firstRecord, latestRecord } from "@/lib/scoring";
import { renderShareCard, shareOrDownload } from "@/lib/shareCard";
import { useStore } from "@/lib/store";
import { CHALLENGE_LENGTH, type SubScores } from "@/lib/types";

const signed = (n: number) => `${n > 0 ? "+" : ""}${n}`;

/** Fresh id for the experiment a new cycle starts with. */
function newExperimentId() {
  return `exp-${Date.now()}`;
}

const TONE_STYLES: Record<InsightTone, string> = {
  positive: "bg-tertiary-fixed text-on-tertiary-fixed",
  neutral: "bg-surface-container text-on-surface-variant",
  warning: "bg-error-container text-on-error-container",
};

const VERDICT_LABEL = {
  improved: "효과가 보였어요",
  worsened: "이 변수는 빼볼게요",
  flat: "아직 차이가 작아요",
  "too-early": "관찰 중",
} as const;

const INDEX_LABELS: Record<keyof Omit<SubScores, "captureConsistency">, string> = {
  trouble: "Visible Trouble",
  spot: "Spot Index",
  nasolabial: "Smile Line",
  forehead: "Forehead Line",
};

/**
 * Day-N / Day-15 report — the LEARN step of the core loop
 * (SCAN → SCORE → CARE → COMPARE → LEARN → NEXT 15 DAYS).
 * Everything here is a visible estimate read off the user's own record.
 */
export default function ReportPage() {
  const { state, hydrated, cycleComplete, startNextCycle } = useStore();
  const router = useRouter();
  const [sharing, setSharing] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  if (!hydrated) return <div className="p-margin-main">불러오는 중…</div>;

  const records = [...state.records].sort((a, b) => a.day - b.day);
  const first = firstRecord(records);
  const latest = latestRecord(records);

  if (!first || !latest || records.length < 2) {
    return (
      <div className="flex min-h-dvh flex-col pb-32">
        <TopAppBar title="리포트" back />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-margin-main text-center">
          <Icon name="summarize" size={48} className="text-outline" />
          <p className="font-body-md text-body-md text-on-surface-variant">
            이틀 이상 기록하면 리포트가 만들어져요.
          </p>
          <Link
            href="/scan"
            className="rounded-full bg-primary px-6 py-3 font-label-bold text-label-bold text-pure-white transition-colors hover:bg-primary-container active:bg-primary-container"
          >
            오늘 기록하기
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const delta = latest.dailySkinScore - first.dailySkinScore;
  const experiment = state.experiment;
  const verdict = experimentVerdict(records, experiment);
  const insights = buildInsights(records, experiment);
  const suggestion = nextExperimentSuggestion(records, experiment);
  const routineCount = records.filter((r) => r.routineDone === true).length;

  const indexDeltas = (["trouble", "spot", "nasolabial", "forehead"] as const).map((key) => ({
    key,
    label: INDEX_LABELS[key],
    value: latest.subScores[key] - first.subScores[key],
  }));

  const subline =
    delta >= 3 ? "어머 좋아졌어!" : delta <= -3 ? "조건을 다시 맞춰봐요" : "아직 큰 변화는 없어요";

  const share = async () => {
    setSharing(true);
    setShareNote(null);
    try {
      const blob = await renderShareCard({
        nickname: state.nickname,
        fromDay: first.day,
        toDay: latest.day,
        scoreStart: first.dailySkinScore,
        scoreEnd: latest.dailySkinScore,
        experimentTitle: experiment?.title ?? null,
        deltas: indexDeltas.map((d) => ({ label: d.label, value: d.value })),
        inviteCode: state.inviteCode,
      });
      const result = await shareOrDownload(
        blob,
        `dailyskin15-day${first.day}-${latest.day}.png`,
        `DailySkin 15 · Day ${first.day}→${latest.day} ${signed(delta)}점`,
      );
      setShareNote(result === "shared" ? "공유했어요" : "이미지를 저장했어요");
    } finally {
      setSharing(false);
    }
  };

  const startNext = () => {
    haptic("success");
    startNextCycle({
      id: newExperimentId(),
      kind: suggestion.kind,
      title: suggestion.title,
      startDay: 1,
      createdAt: new Date().toISOString(),
    });
    router.replace("/today");
  };

  return (
    <div className="min-h-dvh pb-32">
      <TopAppBar title={cycleComplete ? "15일 완주 리포트" : `Day ${latest.day} 리포트`} back />
      {cycleComplete ? <Confetti isActive duration={2600} /> : null}

      <main className="flex flex-col gap-4 px-margin-main pt-4">
        {/* Hero */}
        <section className="rounded-[24px] bg-primary-container p-6 text-pure-white">
          <p className="font-label-sm text-label-sm tracking-[0.2em] text-pure-white/70 uppercase">
            My Skin Response · Day {first.day}→{latest.day}
          </p>
          <div className="mt-3 flex items-end gap-3">
            <span className="font-display-hero text-display-hero leading-none">
              <AnimatedNumber value={latest.dailySkinScore} />
            </span>
            <span className="mb-1 rounded-full bg-pure-white/20 px-3 py-1 font-label-bold text-label-bold">
              {signed(delta)} vs Day 1
            </span>
          </div>
          <p className="mt-3 font-headline-md text-headline-md">{subline}</p>
          <p className="mt-1 font-label-sm text-label-sm text-pure-white/70">
            사진에서 보이는 추정치예요. 의학적 판단이 아닙니다.
          </p>
        </section>

        {/* Step chart */}
        <section className="rounded-[24px] bg-pure-white p-5 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-label-bold text-label-bold text-on-surface">종합 점수 흐름</h3>
            {experiment ? (
              <span className="flex items-center gap-1 font-label-sm text-label-sm text-on-surface-variant">
                <span className="inline-block h-3 w-0.5 border-l-2 border-dashed border-tertiary-fixed-dim" />
                Day {experiment.startDay} 실험 시작
              </span>
            ) : null}
          </div>
          <StepChart
            points={records.map((r) => ({ day: r.day, score: r.dailySkinScore }))}
            experimentStartDay={experiment?.startDay ?? null}
          />
        </section>

        {/* Delta chips */}
        <section className="stagger grid grid-cols-2 gap-3">
          {indexDeltas.map((d) => (
            <DeltaChip key={d.key} label={d.label} value={d.value} improved={d.value >= 0} />
          ))}
          <div className="col-span-2 flex items-center justify-between rounded-2xl bg-surface-container-low p-4">
            <div className="flex items-center gap-2">
              <Icon name="favorite" filled size={18} className="text-primary" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">Routine Streak</span>
            </div>
            <span className="font-headline-md text-headline-md text-primary">
              {routineCount}/{records.length}
            </span>
          </div>
        </section>

        {/* Experiment */}
        {experiment && verdict ? (
          <section className="rounded-[24px] bg-pure-white p-5 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
            <div className="mb-2 flex items-center gap-2">
              <Icon name="science" size={18} className="text-tertiary-container" />
              <span className="font-label-sm text-[11px] font-bold tracking-wider text-tertiary-container uppercase">
                이번 15일의 실험
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">{experiment.title}</h3>
            <span
              className={`mt-2 inline-block rounded-full px-3 py-1 font-label-bold text-label-bold ${
                verdict.outcome === "improved"
                  ? "bg-primary-fixed text-primary"
                  : verdict.outcome === "worsened"
                    ? "bg-error-container text-on-error-container"
                    : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {VERDICT_LABEL[verdict.outcome]}
            </span>
            {verdict.outcome !== "too-early" ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Stat label={`Day ${experiment.startDay} 이전 평균`} value={verdict.before} />
                <Stat label="이후 안정 구간 평균" value={verdict.after} />
              </div>
            ) : (
              <p className="mt-3 font-body-md text-body-md text-on-surface-variant">
                Day {experiment.startDay}부터 {verdict.daysObserved}일 기록됐어요. 3일은 지켜봐야
                흐름을 읽을 수 있어요.
              </p>
            )}
            {verdict.outcome !== "too-early" && verdict.firstThree < verdict.before ? (
              <p className="mt-3 rounded-xl bg-surface-container-low p-3 font-label-sm text-label-sm text-on-surface-variant">
                도입 직후 3일 평균은 {verdict.firstThree}로 잠깐 내려갔어요. 적응기를 지난 뒤의
                흐름이 더 중요해요.
              </p>
            ) : null}
          </section>
        ) : (
          <section className="rounded-[24px] border border-dashed border-outline-variant bg-pure-white/60 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Icon name="science" size={18} className="text-tertiary-container" />
              <span className="font-label-sm text-[11px] font-bold tracking-wider text-tertiary-container uppercase">
                실험 변수 없음
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              이번 사이클은 관찰만 했어요. 다음 15일에는 제품이나 습관 딱 하나만 바꿔 반응을
              읽어 보세요.
            </p>
            <Link
              href="/experiment"
              className="mt-3 inline-flex items-center gap-1 font-label-bold text-label-bold text-primary"
            >
              실험 설계하기
              <Icon name="chevron_right" size={18} />
            </Link>
          </section>
        )}

        {/* AI Coach */}
        <section className="rounded-[24px] bg-pure-white p-5 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="auto_awesome" size={18} className="text-tertiary-container" />
            <span className="font-label-sm text-[11px] font-bold tracking-wider text-tertiary-container uppercase">
              AI Coach
            </span>
          </div>
          {insights.length ? (
            <ol className="stagger flex flex-col gap-4">
              {insights.map((i, idx) => (
                <InsightRow key={i.id} index={idx + 1} insight={i} />
              ))}
            </ol>
          ) : (
            <p className="font-body-md text-body-md text-on-surface-variant">
              기록이 조금 더 쌓이면 코치가 흐름을 읽어 드려요.
            </p>
          )}
        </section>

        {/* Next 15 days */}
        <section className="rounded-[24px] bg-tertiary-fixed p-6 text-on-tertiary-fixed">
          <p className="font-label-sm text-label-sm tracking-[0.2em] text-on-tertiary-fixed/70 uppercase">
            Next 15 Days
          </p>
          <h3 className="mt-2 font-headline-md text-headline-md">{suggestion.title}</h3>
          <p className="mt-2 font-body-md text-body-md text-on-tertiary-fixed/80">{suggestion.detail}</p>

          {suggestion.kind === "add-product" || suggestion.kind === "observe" ? (
            <CandidateProducts survey={state.survey} record={latest} />
          ) : null}

          <button
            type="button"
            disabled={!cycleComplete}
            onClick={startNext}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-tertiary-container py-4 font-label-bold text-label-bold text-pure-white transition-colors hover:bg-tertiary active:bg-tertiary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="restart_alt" size={18} />
            다음 15일 실험 시작하기
          </button>
          {!cycleComplete ? (
            <p className="mt-2 text-center font-label-sm text-label-sm text-on-tertiary-fixed/70">
              Day {CHALLENGE_LENGTH}까지 기록하면 다음 실험을 시작할 수 있어요
            </p>
          ) : null}
          <Link
            href="/experiment"
            className="mt-3 flex items-center justify-center gap-1 font-label-bold text-label-bold text-on-tertiary-fixed"
          >
            직접 설계하기
            <Icon name="chevron_right" size={18} />
          </Link>
        </section>

        <button
          type="button"
          onClick={() => void share()}
          disabled={sharing}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-bold text-label-bold text-pure-white shadow-md transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-60"
        >
          <Icon name="ios_share" size={18} />
          {sharing ? "카드 만드는 중…" : "결과 카드 공유"}
        </button>
        {shareNote ? (
          <p className="-mt-2 text-center font-label-sm text-label-sm text-on-surface-variant">
            {shareNote}
          </p>
        ) : null}
      </main>

      <BottomNav />
    </div>
  );
}

function DeltaChip({ label, value, improved }: { label: string; value: number; improved: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${improved ? "bg-secondary-container" : "bg-[#fff8e6]"}`}>
      <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
      <p className="mt-1 font-headline-md text-headline-md text-primary">{signed(value)}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-3">
      <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
      <p className="font-headline-md text-headline-md text-primary">{value}</p>
    </div>
  );
}

function InsightRow({ index, insight }: { index: number; insight: Insight }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-label-bold text-label-bold ${TONE_STYLES[insight.tone]}`}
      >
        {index}
      </span>
      <div className="flex-1">
        <p className="font-label-bold text-label-bold text-on-surface">{insight.title}</p>
        <p className="mt-0.5 font-label-sm text-label-sm text-on-surface-variant">{insight.detail}</p>
      </div>
    </li>
  );
}

/**
 * Two products for the report's top need — tapping prefills the next
 * experiment with "{brand} {name} 추가" so the variable is a real product.
 */
function CandidateProducts({
  survey,
  record,
}: {
  survey: Parameters<typeof recommendProducts>[0];
  record: Parameters<typeof recommendProducts>[1];
}) {
  const picks = recommendProducts(survey, record, { limit: 2, diversify: true });
  if (!picks.length) return null;
  return (
    <div className="mt-4 rounded-2xl bg-pure-white/60 p-3">
      <p className="mb-2 font-label-sm text-[10px] font-bold tracking-[0.18em] text-on-tertiary-fixed/70 uppercase">
        후보 제품 · 탭하면 실험 변수로
      </p>
      <ul className="stagger flex flex-col gap-2">
        {picks.map((m) => (
          <li key={m.product.id}>
            <Link
              href={`/experiment?kind=add-product&title=${encodeURIComponent(`${m.product.brand} ${m.product.name} 추가`)}`}
              onClick={() => haptic("select")}
              className="flex items-center gap-3 rounded-xl bg-pure-white p-2"
            >
              <ProductImage product={m.product} sizes="48px" className="h-12 w-12 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-label-bold text-label-bold text-on-surface">
                  {m.product.brand} {m.product.name}
                </p>
                <p className="line-clamp-1 font-label-sm text-label-sm text-on-surface-variant">
                  {m.reason}
                </p>
              </div>
              <Icon name="add_circle" size={20} className="shrink-0 text-tertiary-container" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
