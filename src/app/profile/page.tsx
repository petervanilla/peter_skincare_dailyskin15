"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Avatar } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { LogoMark } from "@/components/Logo";
import { ScoreChart } from "@/components/ScoreChart";
import { StoredPhoto } from "@/components/StoredPhoto";
import { TopAppBar } from "@/components/TopAppBar";
import { IMG } from "@/lib/assets";
import { fileToDataUrl } from "@/lib/image";
import { buildCarePlan } from "@/lib/recommendations";
import { currentStreak, latestRecord, previousRecord } from "@/lib/scoring";
import { useStore } from "@/lib/store";
import {
  CONCERN_LABELS,
  CONDITION_LABELS,
  OUTDOOR_LABELS,
  SKIN_TYPE_LABELS,
  type SubScores,
} from "@/lib/types";

/** Small-caps metric label per subscore, matching the analysis screen's English tile titles. */
const METRIC_LABELS: Record<keyof Omit<SubScores, "captureConsistency">, string> = {
  trouble: "Trouble",
  spot: "Pigment",
  nasolabial: "Smile Line",
  forehead: "Forehead",
};

function weakestSubScore(s: SubScores): keyof SubScores {
  const entries = Object.entries(s) as Array<[keyof SubScores, number]>;
  const skinOnly = entries.filter(([k]) => k !== "captureConsistency");
  return skinOnly.reduce((a, b) => (b[1] < a[1] ? b : a))[0];
}

export default function ProfilePage() {
  const { state, hydrated, reset, updateProfile, saveAvatarPhoto, loadDemo } = useStore();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [ageDraft, setAgeDraft] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  if (!hydrated) return <div className="p-margin-main">불러오는 중…</div>;

  const survey = state.survey;
  const latest = latestRecord(state.records);
  const prev = latest ? previousRecord(state.records, latest.day) : null;
  const plan = buildCarePlan(state.records, latest);
  const weakest = latest ? weakestSubScore(latest.subScores) : null;

  const startEditingProfile = () => {
    setNameDraft(state.nickname);
    setAgeDraft(state.survey?.age?.toString() ?? "");
    setEditingProfile(true);
  };

  const pickAvatar = async (file: File | undefined) => {
    if (!file) return;
    setAvatarBusy(true);
    try {
      await saveAvatarPhoto(await fileToDataUrl(file));
    } finally {
      setAvatarBusy(false);
    }
  };

  return (
    <div className="min-h-dvh pb-32">
      <TopAppBar title={<LogoMark height={28} />} />

      <main className="flex flex-col gap-4 px-margin-main pt-2">
        {/* Personal info — the one place nickname and age are entered and
            saved; the age doubles as the Skin Age Index baseline (spec §7).
            Lavender fill (tertiary-fixed / on-tertiary-fixed), same as the
            "Day N of 15" and "내 기여도" boxes on Progress/Leaderboard. */}
        <section className="rounded-[24px] bg-tertiary-fixed p-6 text-on-tertiary-fixed">
          {editingProfile ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <AvatarPicker
                  busy={avatarBusy}
                  onClick={() => avatarFileRef.current?.click()}
                />
                <div className="flex flex-1 flex-col gap-2">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="이름"
                    className="rounded-lg border border-outline-variant bg-pure-white px-3 py-2 font-body-md text-body-md outline-none focus:border-tertiary-container"
                  />
                  <input
                    value={ageDraft}
                    onChange={(e) => setAgeDraft(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    inputMode="numeric"
                    placeholder="나이"
                    className="w-24 rounded-lg border border-outline-variant bg-pure-white px-3 py-2 font-body-md text-body-md outline-none focus:border-tertiary-container"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProfile(false)}
                  className="flex-1 rounded-full bg-surface-container-low py-2.5 font-label-bold text-label-bold text-on-surface-variant transition-colors hover:bg-surface-container-highest active:bg-surface-container-highest"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateProfile(nameDraft.trim(), ageDraft ? Number(ageDraft) : null);
                    setEditingProfile(false);
                  }}
                  className="flex-1 rounded-full bg-tertiary-container py-2.5 font-label-bold text-label-bold text-pure-white transition-colors hover:bg-tertiary active:bg-tertiary"
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <AvatarPicker busy={avatarBusy} onClick={() => avatarFileRef.current?.click()} />
              <div className="flex-1">
                <p className="font-headline-md text-headline-md text-on-tertiary-fixed">
                  {state.nickname}
                  {survey?.age ? ` | ${survey.age}` : ""}
                </p>
                <p className="font-label-sm text-label-sm text-on-tertiary-fixed/70">
                  {state.records.length}일 기록 · {currentStreak(state.records)}일 연속
                </p>
              </div>
              {latest ? (
                <div className="flex flex-col items-end px-1">
                  {/* Same source as the OVERALL SCORE panel below (latest
                      record), so the two numbers on this page always agree. */}
                  <span className="font-headline-md text-headline-md text-on-tertiary-fixed">
                    <AnimatedNumber value={latest.dailySkinScore} />
                  </span>
                  <span className="font-label-sm text-[10px] whitespace-nowrap text-on-tertiary-fixed/70">
                    최근 점수
                  </span>
                </div>
              ) : null}
              <button
                type="button"
                aria-label="프로필 수정"
                title="프로필 수정"
                onClick={startEditingProfile}
                className="text-on-tertiary-fixed/70 transition-opacity hover:opacity-70 active:scale-95"
              >
                <Icon name="edit" size={20} />
              </button>
            </div>
          )}
          <input
            ref={avatarFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void pickAvatar(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </section>

        {/* Analysis summary — moved above the survey card so the freshest,
            most visual content sits right under the profile header. */}
        {latest && weakest ? (
          <section className="overflow-hidden rounded-[24px] bg-pure-white shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
            <div className="relative aspect-[4/3] w-full bg-surface-container-low">
              <StoredPhoto
                photoKey={latest.photoKeys.front ?? Object.values(latest.photoKeys)[0]}
                alt={`Day ${latest.day} 정면 촬영`}
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
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-graphite/55 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 rounded-lg border border-pure-white/30 bg-pure-white/20 px-4 py-2 backdrop-blur-md">
                <p className="font-label-sm text-[10px] tracking-widest text-pure-white/80 uppercase">
                  Overall Score
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="font-display-hero-mobile text-display-hero-mobile leading-none text-pure-white">
                    <AnimatedNumber value={latest.dailySkinScore} />
                  </span>
                  <span className="font-label-sm text-label-sm text-pure-white/70">/100</span>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
                <MiniMetric
                  label={METRIC_LABELS.trouble}
                  score={latest.subScores.trouble}
                  prevScore={prev?.subScores.trouble}
                />
                <MiniMetric
                  label={METRIC_LABELS.spot}
                  score={latest.subScores.spot}
                  prevScore={prev?.subScores.spot}
                />
                <MiniMetric
                  label={METRIC_LABELS.nasolabial}
                  score={latest.subScores.nasolabial}
                  prevScore={prev?.subScores.nasolabial}
                />
                <MiniMetric
                  label={METRIC_LABELS.forehead}
                  score={latest.subScores.forehead}
                  prevScore={prev?.subScores.forehead}
                />
              </div>

              <div className="mt-4 rounded-xl border border-tertiary-fixed-dim/40 bg-tertiary-fixed/25 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <Icon name="biotech" size={16} className="text-tertiary-container" />
                  <span className="font-label-sm text-[10px] font-bold tracking-wider text-tertiary-container uppercase">
                    Priority Protocol
                  </span>
                </div>
                <p className="mb-1 font-body-md text-body-md text-tertiary-container">
                  오늘 가장 관리가 필요한 부분:{" "}
                  <span className="border-b border-tertiary-container/30 pb-0.5 font-bold">
                    {METRIC_LABELS[weakest as keyof typeof METRIC_LABELS] ?? "촬영 일관성"}
                  </span>
                </p>
                <p className="mb-3 font-label-sm text-label-sm text-tertiary-container/80">
                  {plan.headline}
                </p>
                <Link
                  href="/routine"
                  className="flex items-center justify-center gap-2 rounded-lg bg-pure-white px-4 py-2.5 font-label-bold text-label-bold text-tertiary-container transition-colors hover:bg-surface-bright"
                >
                  <Icon name="science" size={16} />
                  Start Recommended Routine
                </Link>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-label-bold text-label-bold text-on-surface">
                    7-Day Analysis
                  </h3>
                  <Icon name="more_horiz" size={18} className="text-on-surface-variant" />
                </div>
                <ScoreChart
                  points={state.records.map((r) => ({ day: r.day, score: r.dailySkinScore }))}
                />
              </div>

              <Link
                href={`/analysis?day=${latest.day}`}
                className="mt-2 flex items-center justify-center gap-1 rounded-lg py-1 font-label-bold text-label-bold text-primary transition-colors hover:bg-surface-container-low active:bg-surface-container-low"
              >
                자세히 보기
                <Icon name="chevron_right" size={18} />
              </Link>
            </div>
          </section>
        ) : null}

        {survey ? (
          <section className="rounded-[24px] bg-pure-white p-5 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
            <h3 className="mb-4 font-label-bold text-label-bold text-on-surface">내 설문 응답</h3>
            <dl className="flex flex-col gap-3">
              <Row
                label="피부 고민"
                value={survey.concerns.map((c) => CONCERN_LABELS[c]).join(", ") || "-"}
              />
              <Row label="피부 타입" value={SKIN_TYPE_LABELS[survey.skinType]} />
              <Row label="최근 컨디션" value={CONDITION_LABELS[survey.condition]} />
              <Row label="야외활동" value={OUTDOOR_LABELS[survey.outdoor]} />
              <Row label="사용 제품" value={survey.products.join(", ") || "-"} />
            </dl>
          </section>
        ) : null}

        {/* Skin Memory — completed 15-day cycles, the deck's compounding asset. */}
        <section className="rounded-[24px] bg-pure-white p-5 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="history" className="text-primary" />
              <h3 className="font-label-bold text-label-bold text-on-surface">Skin Memory</h3>
            </div>
            <span className="rounded-full bg-surface-container px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
              {state.cycles.length}회 완주
            </span>
          </div>
          {state.cycles.length ? (
            <ul className="flex flex-col gap-2">
              {[...state.cycles].reverse().map((c) => {
                const d = c.scoreEnd - c.scoreStart;
                return (
                  <li key={c.id} className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed">
                      <Icon name="science" size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-label-bold text-label-bold text-on-surface">
                        실험: {c.experiment?.title ?? "관찰만"}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {fmtDate(c.startedAt)} → {fmtDate(c.completedAt)} · {c.scoreStart} → {c.scoreEnd}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 font-label-bold text-label-bold ${
                        d >= 0 ? "bg-primary-fixed text-primary" : "bg-error-container text-on-error-container"
                      }`}
                    >
                      {d > 0 ? "+" : ""}
                      {d}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="font-body-md text-body-md text-on-surface-variant">
              완주한 15일이 여기에 쌓여요. 사이클이 쌓일수록 나만의 반응 기록이 돼요.
            </p>
          )}
        </section>

        <section className="rounded-[24px] bg-pure-white p-5 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="lock" className="text-primary" />
            <h3 className="font-label-bold text-label-bold text-on-surface">데이터 보관</h3>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            촬영한 사진과 분석 결과는 이 브라우저 안에만 저장돼요 (IndexedDB · localStorage).
            서버로 전송되지 않습니다.
          </p>
        </section>

        {/* Demo seed — the deck's "Live Demo" without 15 real days of selfies. */}
        <section className="rounded-[24px] border border-dashed border-outline-variant bg-pure-white/60 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="science" className="text-tertiary-container" />
            <h3 className="font-label-bold text-label-bold text-on-surface">데모 · 개발자</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                loadDemo(12);
                router.push("/today");
              }}
              className="rounded-full border border-primary py-3 font-label-bold text-label-bold text-primary transition-colors hover:bg-secondary-container active:bg-secondary-container"
            >
              데모 12일차
            </button>
            <button
              type="button"
              onClick={() => {
                loadDemo(15);
                router.push("/today");
              }}
              className="rounded-full bg-primary py-3 font-label-bold text-label-bold text-pure-white transition-colors hover:bg-primary-container active:bg-primary-container"
            >
              데모 15일차 (리포트)
            </button>
          </div>
          <p className="mt-3 font-label-sm text-label-sm text-on-surface-variant">
            투자자 데모용 합성 데이터예요. 실제 촬영 기록을 덮어씁니다.
          </p>
        </section>

        {confirming ? (
          <div className="rounded-[24px] bg-error-container p-5">
            <p className="mb-4 font-body-md text-body-md text-on-error-container">
              모든 사진과 기록이 삭제돼요. 되돌릴 수 없습니다. 정말 초기화할까요?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-full bg-pure-white py-3 font-label-bold text-label-bold text-on-surface transition-colors hover:bg-surface-container-low active:bg-surface-container-low"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  reset();
                  router.replace("/");
                }}
                className="flex-1 rounded-full bg-error py-3 font-label-bold text-label-bold text-on-error transition-opacity hover:opacity-90 active:opacity-80"
              >
                초기화
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex items-center justify-center gap-2 rounded-full border border-error py-4 font-label-bold text-label-bold text-error transition-colors hover:bg-error-container active:bg-error-container"
          >
            <Icon name="delete" size={18} />
            모든 기록 초기화
          </button>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function MiniMetric({
  label,
  score,
  prevScore,
}: {
  label: string;
  score: number;
  prevScore?: number;
}) {
  const needsAction = score < 65;
  const change = prevScore === undefined ? null : score - prevScore;

  return (
    <div
      className={`rounded-xl border p-3 ${
        needsAction ? "border-error/30 bg-error-container/40" : "border-surface-variant/60 bg-surface-container-low"
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-1">
        <span
          className={`font-label-sm text-[10px] font-semibold tracking-wider uppercase ${
            needsAction ? "text-error" : "text-on-surface-variant"
          }`}
        >
          {label}
        </span>
        {needsAction ? (
          <span className="shrink-0 rounded-full bg-error px-1.5 py-0.5 font-label-sm text-[9px] text-on-error">
            Action Needed
          </span>
        ) : null}
      </div>

      <div className="flex items-baseline gap-1">
        <span
          className={`font-headline-md text-headline-md ${needsAction ? "text-error" : "text-on-surface"}`}
        >
          <AnimatedNumber value={score} />
        </span>
        {change !== null && change !== 0 ? (
          <span className={`font-label-sm text-[11px] ${change > 0 ? "text-primary" : "text-error"}`}>
            {change > 0 ? "+" : ""}
            {change}
          </span>
        ) : null}
      </div>

      <div className="mt-2 h-1 w-full rounded-full bg-surface-variant/50">
        <div
          className={`h-1 rounded-full ${needsAction ? "bg-error" : "bg-primary"}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

/** ISO timestamp → yyyy.mm.dd for the Skin Memory rows. */
function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10).replaceAll("-", ".");
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="font-label-sm text-label-sm text-on-surface-variant">{label}</dt>
      <dd className="text-right font-body-md text-body-md text-on-surface">{value}</dd>
    </div>
  );
}

/** Tapping the photo swaps in a picked image everywhere the avatar shows. */
function AvatarPicker({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label="프로필 사진 변경"
      title="프로필 사진 변경"
      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-60"
    >
      <Avatar sizePx={64} />
      <span className="absolute right-0 bottom-0 flex h-5 w-5 items-center justify-center rounded-full bg-pure-white text-on-tertiary-fixed shadow-sm">
        <Icon name={busy ? "hourglass_top" : "photo_camera"} size={12} />
      </span>
    </button>
  );
}
