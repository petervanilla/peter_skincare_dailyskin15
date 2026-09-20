"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { LogoMark } from "@/components/Logo";
import { TopAppBar } from "@/components/TopAppBar";
import { haptic } from "@/lib/haptics";
import { useStore } from "@/lib/store";
import {
  CONCERN_LABELS,
  CONDITION_LABELS,
  OUTDOOR_LABELS,
  SKIN_TYPE_LABELS,
  SLEEP_LABELS,
  type OutdoorExposure,
  type SkinConcern,
  type SkinCondition,
  type SkinType,
  type SleepQuality,
} from "@/lib/types";

/**
 * Day 0 mini survey (spec §4). Five steps, inside the 5–7 question budget.
 * Answers feed the recommendation rules — they are never a diagnosis.
 */

const CONCERN_ICONS: Record<SkinConcern, string> = {
  trouble: "medical_services",
  redness: "water_drop",
  spots: "blur_on",
  texture: "air",
  wrinkles: "insights",
  elasticity: "auto_awesome",
};

const PRODUCT_OPTIONS = [
  "클렌징 폼",
  "토너",
  "세럼/앰플",
  "수분 크림",
  "자외선 차단제",
  "레티놀",
  "각질 제거",
];

const STEPS = 5;

export default function SurveyPage() {
  const router = useRouter();
  const { state, hydrated, saveSurvey } = useStore();

  useEffect(() => {
    if (hydrated && !state.user) router.replace("/login");
  }, [hydrated, state.user, router]);

  const [step, setStep] = useState(0);
  const [concerns, setConcerns] = useState<SkinConcern[]>([]);
  const [skinType, setSkinType] = useState<SkinType | null>(null);
  const [condition, setCondition] = useState<SkinCondition | null>(null);
  const [outdoor, setOutdoor] = useState<OutdoorExposure | null>(null);
  const [products, setProducts] = useState<string[]>([]);
  const [sleep, setSleep] = useState<SleepQuality | null>(null);
  const [age, setAge] = useState<string>("");

  const toggle = <T,>(list: T[], value: T, set: (v: T[]) => void) => {
    haptic("select");
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const canAdvance = [
    concerns.length > 0,
    skinType !== null,
    condition !== null,
    outdoor !== null,
    true, // last step is optional
  ][step];

  const handleNext = () => {
    if (step < STEPS - 1) {
      setStep(step + 1);
      return;
    }
    const parsedAge = Number.parseInt(age, 10);
    saveSurvey({
      concerns,
      skinType: skinType ?? "unknown",
      condition: condition ?? "normal",
      outdoor: outdoor ?? "none",
      products,
      sleep: sleep ?? undefined,
      age: Number.isFinite(parsedAge) && parsedAge >= 10 && parsedAge <= 90 ? parsedAge : undefined,
    });
    router.push("/today");
  };

  return (
    <div className="flex min-h-dvh flex-col pb-safe-area-bottom">
      <TopAppBar title={<LogoMark height={28} />} />

      <main className="flex flex-1 flex-col px-margin-main pt-stack-md pb-stack-lg">
        <div className="mb-stack-lg h-1 w-full overflow-hidden rounded-full bg-surface-variant/50">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS) * 100}%` }}
          />
        </div>

        {step === 0 ? (
          <StepShell
            title="피부 상태를 알려주세요"
            subtitle="가장 신경 쓰이는 피부 고민은 무엇인가요?"
            hint="(복수 선택 가능)"
          >
            <div className="grid grid-cols-2 gap-x-gutter gap-y-3">
              {(Object.keys(CONCERN_LABELS) as SkinConcern[]).map((key) => {
                const active = concerns.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(concerns, key, setConcerns)}
                    // DESIGN.md's lavender is normally reserved for AI-insight
                    // surfaces, but this selection state deliberately borrows
                    // it too, per direct request.
                    className={`flex h-28 flex-col items-center justify-center rounded-xl border px-4 py-4 text-center shadow-[0_8px_32px_rgba(0,0,0,0.05)] transition-colors duration-200 ${
                      active ? "pop" : ""
                    } ${
                      active
                        ? "border-tertiary-container bg-tertiary-fixed text-on-tertiary-fixed"
                        : "border-outline-variant bg-pure-white/70 text-on-surface hover:bg-white active:bg-white"
                    }`}
                  >
                    <Icon
                      name={CONCERN_ICONS[key]}
                      size={40}
                      className={`mb-2 ${active ? "text-tertiary-container" : "text-primary-container opacity-90"}`}
                    />
                    <span className="font-label-bold text-label-bold">{CONCERN_LABELS[key]}</span>
                  </button>
                );
              })}
            </div>
          </StepShell>
        ) : null}

        {step === 1 ? (
          <StepShell title="피부 타입" subtitle="평소 내 피부는 어떤가요?">
            <OptionList
              options={Object.entries(SKIN_TYPE_LABELS) as [SkinType, string][]}
              value={skinType}
              onChange={setSkinType}
            />
          </StepShell>
        ) : null}

        {step === 2 ? (
          <StepShell title="최근 피부 컨디션" subtitle="요즘 피부 상태를 골라주세요">
            <OptionList
              options={Object.entries(CONDITION_LABELS) as [SkinCondition, string][]}
              value={condition}
              onChange={setCondition}
            />
          </StepShell>
        ) : null}

        {step === 3 ? (
          <StepShell title="최근 야외활동" subtitle="지난 며칠 햇빛을 얼마나 봤나요?">
            <OptionList
              options={Object.entries(OUTDOOR_LABELS) as [OutdoorExposure, string][]}
              value={outdoor}
              onChange={setOutdoor}
            />
          </StepShell>
        ) : null}

        {step === 4 ? (
          <StepShell
            title="마지막이에요"
            subtitle="현재 쓰는 제품과 수면 상태를 알려주세요"
            hint="(선택 사항)"
          >
            <div className="mb-stack-lg flex flex-wrap gap-2">
              {PRODUCT_OPTIONS.map((p) => {
                const active = products.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggle(products, p, setProducts)}
                    className={`rounded-full border px-4 py-2 font-label-bold text-label-bold transition-colors ${
                      active ? "pop" : ""
                    } ${
                      active
                        ? "border-primary bg-secondary-container text-primary"
                        : "border-outline-variant bg-pure-white text-on-surface-variant hover:bg-surface-container-low active:bg-surface-container-low"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <p className="mb-2 font-label-bold text-label-bold text-on-surface-variant">수면 상태</p>
            <OptionList
              options={Object.entries(SLEEP_LABELS) as [SleepQuality, string][]}
              value={sleep}
              onChange={setSleep}
            />

            <div className="mt-stack-lg">
              <label
                htmlFor="age"
                className="mb-2 block font-label-bold text-label-bold text-on-surface-variant"
              >
                나이 (Skin Age Index 기준값으로만 사용돼요)
              </label>
              <input
                id="age"
                type="number"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="예: 28"
                className="w-full rounded-xl border border-outline-variant bg-pure-white px-4 py-3 font-body-md text-body-md text-on-surface outline-none focus:border-primary"
              />
            </div>
          </StepShell>
        ) : null}

        <div className="mt-stack-lg w-full pt-stack-md">
          <button
            type="button"
            disabled={!canAdvance}
            onClick={handleNext}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary-container py-4 font-label-bold text-label-bold text-pure-white shadow-lg shadow-primary-container/30 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step === STEPS - 1 ? "완료하고 시작하기" : "다음"}
            <Icon name="arrow_forward" size={20} />
          </button>
        </div>
      </main>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  hint,
  children,
}: {
  title: string;
  subtitle: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-grow">
      <div className="mb-stack-lg">
        {/* DESIGN.md reserves Source Serif for editorial headlines; "survey
            questions" are named explicitly as Hanken Grotesk territory. */}
        <h1 className="font-headline-md text-headline-md mb-stack-sm leading-tight tracking-tight text-primary">
          {title}
        </h1>
        {/* 12.6px = 18px (body-lg) cut 30%; hint now matches the subtitle
            instead of running smaller as its own label size. */}
        <p className="font-body-lg text-[12.6px] leading-[20px] text-on-surface-variant">
          {subtitle}
          {hint ? (
            <span className="mt-1 inline-block text-[12.6px] leading-[20px] text-on-surface-variant">
              {" "}
              {hint}
            </span>
          ) : null}
        </p>
      </div>
      {children}
    </div>
  );
}

function OptionList<T extends string>({
  options,
  value,
  onChange,
}: {
  options: [T, string][];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {options.map(([key, label]) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => {
              haptic("select");
              onChange(key);
            }}
            className={`flex items-center justify-between rounded-xl border px-5 py-4 text-left transition-colors ${
              active ? "pop" : ""
            } ${
              active
                ? "border-primary bg-secondary-container text-primary"
                : "border-outline-variant bg-pure-white text-on-surface hover:bg-surface-container-low active:bg-surface-container-low"
            }`}
          >
            <span className="font-body-md text-body-md">{label}</span>
            {active ? <Icon name="check_circle" filled className="text-primary" /> : null}
          </button>
        );
      })}
    </div>
  );
}
