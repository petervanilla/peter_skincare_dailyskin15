"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { TopAppBar } from "@/components/TopAppBar";
import { SUB_SCORE_LABELS } from "@/lib/scoring";
import { useStore } from "@/lib/store";
import {
  CHALLENGE_LENGTH,
  EXPERIMENT_KIND_LABELS,
  type Experiment,
  type ExperimentKind,
  type SubScores,
} from "@/lib/types";

/**
 * "이번 15일의 실험" — declares the single variable this cycle tests
 * (deck: Skin Experiment Platform). One variable at a time is the whole
 * point: change two things and the Response Graph cannot say which one moved
 * the needle.
 */

type TargetIndex = keyof Omit<SubScores, "captureConsistency">;
const TARGETS: TargetIndex[] = ["trouble", "spot", "nasolabial", "forehead"];

const KIND_ORDER: ExperimentKind[] = [
  "add-product",
  "remove-product",
  "routine-change",
  "habit",
  "observe",
];

const KIND_ICONS: Record<ExperimentKind, string> = {
  "add-product": "add_circle",
  "remove-product": "remove_circle",
  "routine-change": "swap_vert",
  habit: "self_improvement",
  observe: "visibility",
};

const KIND_HINTS: Record<ExperimentKind, string> = {
  "add-product": "지금 루틴에 제품 하나만 더해요.",
  "remove-product": "쓰던 제품 하나를 빼고 반응을 봐요.",
  "routine-change": "제품은 그대로, 순서나 시간만 바꿔요.",
  habit: "피부 반응은 생활 습관에도 남아요.",
  observe: "기준선을 만드는 15일. 아무것도 바꾸지 않아요.",
};

const SUGGESTIONS: Record<ExperimentKind, string[]> = {
  "add-product": [
    "논코메도제닉 선크림 추가",
    "진정 앰플 추가",
    "약산성 클렌저로 교체",
    "수분 세럼 한 겹 추가",
  ],
  "remove-product": ["각질 제거 제품 빼기", "레티놀 잠시 쉬기", "향 있는 제품 빼기"],
  "routine-change": ["저녁 세안 시간 앞당기기", "보습 → 선크림 순서 지키기", "아침 세안 물로만 하기"],
  habit: ["물 1.5L 마시기", "12시 전 취침", "얼굴 안 만지기", "베개 커버 3일마다 교체"],
  observe: ["지금 루틴 그대로 관찰"],
};

export default function ExperimentPage() {
  const { state, hydrated } = useStore();
  // The form seeds its own state from the stored experiment, so it must not
  // mount until localStorage has been read — otherwise it would seed from the
  // empty server-render state and never show the existing variable.
  if (!hydrated) return <div className="p-margin-main">불러오는 중…</div>;
  return <ExperimentForm key={state.experiment?.id ?? "new"} existing={state.experiment} />;
}

function ExperimentForm({ existing }: { existing: Experiment | null }) {
  const router = useRouter();
  const { nextDay, setExperiment } = useStore();

  const [kind, setKind] = useState<ExperimentKind>(existing?.kind ?? "add-product");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [target, setTarget] = useState<TargetIndex | undefined>(existing?.target);
  const [startDay, setStartDay] = useState<number | null>(existing?.startDay ?? null);

  const effectiveStart = startDay ?? nextDay;
  const canSave = title.trim().length > 0;

  const save = () => {
    const experiment: Experiment = {
      id: existing?.id ?? `exp-${Date.now()}`,
      kind,
      title: title.trim(),
      startDay: effectiveStart,
      target,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    setExperiment(experiment);
    router.push("/today");
  };

  const pickKind = (k: ExperimentKind) => {
    setKind(k);
    if (k === "observe") setTitle(SUGGESTIONS.observe[0]);
    else if (kind === "observe") setTitle("");
  };

  return (
    <div className="min-h-dvh pb-32">
      <TopAppBar title="이번 15일의 실험" back />

      <main className="flex flex-col gap-5 px-margin-main pt-4">
        <section className="rounded-[24px] bg-tertiary-fixed p-5 text-on-tertiary-fixed">
          <div className="mb-1 flex items-center gap-2">
            <Icon name="science" size={18} />
            <p className="font-label-sm text-[11px] font-bold tracking-[0.18em] uppercase">
              One Variable
            </p>
          </div>
          <p className="font-body-md text-body-md break-keep">
            한 번에 하나만 바꿔야 무엇이 효과였는지 알 수 있어요. 15일 동안 이 변수 하나만
            지켜보고, 반응은 그래프가 대신 말해줘요.
          </p>
        </section>

        {/* (a) kind */}
        <Step number={1} title="무엇을 바꿀까요?">
          <div className="flex flex-col gap-2">
            {KIND_ORDER.map((k) => {
              const active = k === kind;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => pickKind(k)}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                    active
                      ? "border-primary bg-secondary-container text-primary"
                      : "border-outline-variant bg-pure-white text-on-surface hover:bg-surface-container-low active:bg-surface-container-low"
                  }`}
                >
                  <Icon
                    name={KIND_ICONS[k]}
                    filled={active}
                    className={active ? "text-primary" : "text-on-surface-variant"}
                  />
                  <span className="flex-1">
                    <span className="block font-label-bold text-label-bold">
                      {EXPERIMENT_KIND_LABELS[k]}
                    </span>
                    <span className="block font-label-sm text-label-sm opacity-70">
                      {KIND_HINTS[k]}
                    </span>
                  </span>
                  {active ? <Icon name="check_circle" filled className="text-primary" /> : null}
                </button>
              );
            })}
          </div>
        </Step>

        {/* (b) title */}
        <Step number={2} title="변수의 이름">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 논코메도제닉 선크림 추가"
            maxLength={40}
            className="w-full rounded-xl border border-outline-variant bg-pure-white px-4 py-3 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS[kind].map((s) => {
              const active = s === title;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTitle(s)}
                  className={`rounded-full px-3 py-1.5 font-label-sm text-label-sm transition-colors ${
                    active
                      ? "bg-primary text-pure-white"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-highest"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </Step>

        {/* (c) target */}
        <Step number={3} title="어느 지표가 움직이길 기대하나요?" hint="선택 사항">
          <div className="flex flex-wrap gap-2">
            {TARGETS.map((t) => {
              const active = t === target;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTarget(active ? undefined : t)}
                  className={`rounded-full border px-4 py-2 font-label-bold text-label-bold transition-colors ${
                    active
                      ? "border-primary bg-secondary-container text-primary"
                      : "border-outline-variant bg-pure-white text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  {SUB_SCORE_LABELS[t]}
                </button>
              );
            })}
          </div>
        </Step>

        {/* (d) start day */}
        <Step number={4} title="언제부터 시작하나요?">
          <div className="flex items-center justify-between rounded-2xl bg-pure-white p-4 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
            <div>
              <p className="font-headline-md text-headline-md text-primary">
                Day {effectiveStart}부터
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {effectiveStart === nextDay ? "다음 촬영일부터 적용돼요" : "이 날부터 반응을 계산해요"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Stepper
                label="하루 앞으로"
                icon="remove"
                disabled={effectiveStart <= 1}
                onClick={() => setStartDay(Math.max(1, effectiveStart - 1))}
              />
              <Stepper
                label="하루 뒤로"
                icon="add"
                disabled={effectiveStart >= CHALLENGE_LENGTH}
                onClick={() => setStartDay(Math.min(CHALLENGE_LENGTH, effectiveStart + 1))}
              />
            </div>
          </div>
        </Step>

        <button
          type="button"
          disabled={!canSave}
          onClick={save}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-bold text-label-bold text-pure-white shadow-md transition-opacity hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="science" size={18} />
          {existing ? "실험 변수 저장" : "이 변수로 15일 시작"}
        </button>

        {existing ? (
          <button
            type="button"
            onClick={() => {
              setExperiment(null);
              router.push("/today");
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-outline-variant py-3 font-label-bold text-label-bold text-on-surface-variant transition-colors hover:bg-surface-container-low active:bg-surface-container-low"
          >
            <Icon name="delete_outline" size={18} />
            실험 변수 지우기
          </button>
        ) : null}

        <p className="text-center font-label-sm text-label-sm break-keep text-on-surface-variant/70">
          실험은 특정 제품의 효과를 보장하지 않아요. 내 피부가 어떻게 반응하는지 기록하는
          도구예요.
        </p>
      </main>
    </div>
  );
}

function Step({
  number,
  title,
  hint,
  children,
}: {
  number: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-label-sm text-label-sm text-pure-white">
          {number}
        </span>
        <h2 className="font-label-bold text-label-bold text-on-surface">{title}</h2>
        {hint ? (
          <span className="font-label-sm text-label-sm text-on-surface-variant">· {hint}</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Stepper({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-primary transition-colors hover:bg-surface-container-highest active:scale-95 disabled:opacity-30"
    >
      <Icon name={icon} size={20} />
    </button>
  );
}
