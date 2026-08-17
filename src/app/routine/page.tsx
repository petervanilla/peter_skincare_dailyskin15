"use client";

import Image from "next/image";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { LogoMark } from "@/components/Logo";
import { TopAppBar } from "@/components/TopAppBar";
import { IMG } from "@/lib/assets";
import { buildCarePlan } from "@/lib/recommendations";
import { latestRecord } from "@/lib/scoring";
import { useStore } from "@/lib/store";

/** 오늘의 셀프 케어 (spec §10) — one analysis, one clear action set. */
export default function RoutinePage() {
  const { state, hydrated, toggleAction, setSunExposure } = useStore();

  if (!hydrated) return <div className="p-margin-main">불러오는 중…</div>;

  const today = latestRecord(state.records);
  const plan = buildCarePlan(state.records, today);
  const completed = today?.completedActions ?? [];
  const allDone = plan.actions.every((a) => completed.includes(a.id));

  return (
    <div className="min-h-dvh pb-32">
      <TopAppBar title={<LogoMark height={28} />} />

      <main className="flex flex-col gap-4 px-margin-main pt-2">
        {/* "Day N Focus" hero — DESIGN.md's "AI Action" lavender fill
            (tertiary-fixed bg + on-tertiary-fixed text), the same pairing
            used everywhere else lavender appears in this app, for an
            AI-generated recommendation. */}
        <section className="lavender-glow relative overflow-hidden rounded-[24px] bg-tertiary-fixed p-6 text-on-tertiary-fixed">
          {/* break-keep stops Korean from wrapping mid-word; whitespace-pre-line
              honours the authored break in the rationale. */}
          <div className="relative z-10 break-keep">
            <p className="mb-1 font-label-sm text-label-sm tracking-wider text-on-tertiary-fixed/70 uppercase">
              {today ? `Day ${today.day} Focus` : "Getting started"}
            </p>
            <h2 className="mb-2 font-headline-md text-headline-md">{plan.headline}</h2>
            <p className="font-body-md text-body-md whitespace-pre-line text-on-tertiary-fixed/80">
              {plan.rationale}
            </p>
          </div>
          {/* Decorative blur, matching the comp's soft corner glow. */}
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-tertiary-fixed-dim/50 blur-3xl" />
        </section>

        <Link
          href="/face-yoga"
          className="group relative block aspect-[16/9] overflow-hidden rounded-[24px]"
        >
          <Image
            src={IMG.faceYogaHero}
            alt="오늘의 3분 케어"
            fill
            sizes="430px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-graphite/70 via-graphite/10 to-transparent" />
          <div className="absolute inset-x-5 bottom-4 flex items-center justify-between">
            <div>
              <p className="font-label-sm text-label-sm text-pure-white/80">Today&apos;s Care</p>
              <p className="font-headline-md text-headline-md text-pure-white">3분 페이스 요가</p>
            </div>
            {/* Glows with the same pulse ring as the first-capture CTA, but
                only while hovered — a "click me" nudge, not a constant one. */}
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pure-white/90 text-primary transition-transform group-hover:scale-110 group-hover:[animation:pulse-ring_1.2s_ease-out_infinite]">
              <Icon name="play_arrow" filled size={28} />
            </span>
          </div>
        </Link>

        {today ? (
          <section className="flex items-center justify-between rounded-2xl bg-pure-white p-4 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
            <div className="flex items-center gap-3">
              <Icon name="wb_sunny" className="text-tertiary-container" />
              <div>
                <p className="font-label-bold text-label-bold text-on-surface">
                  오늘 야외활동을 했나요?
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  자외선 기록은 내일 추천에 반영돼요
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(today.sunExposure)}
              onClick={() => setSunExposure(today.day, !today.sunExposure)}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                today.sunExposure ? "bg-primary" : "bg-surface-container-highest"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-pure-white transition-all ${
                  today.sunExposure ? "left-6" : "left-1"
                }`}
              />
            </button>
          </section>
        ) : null}

        <h3 className="font-label-bold text-label-bold tracking-wider text-on-surface-variant uppercase">
          Morning Protocol
        </h3>

        <section className="flex flex-col gap-3">
          {plan.actions.map((action) => {
            const done = completed.includes(action.id);
            return (
              <button
                key={action.id}
                type="button"
                disabled={!today}
                onClick={() => today && toggleAction(today.day, action.id)}
                className={`flex items-start gap-4 rounded-[24px] p-5 text-left shadow-[0_4px_20px_rgba(46,104,93,0.05)] transition-colors disabled:opacity-60 ${
                  done ? "bg-secondary-container" : "bg-pure-white"
                }`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    done ? "bg-primary text-pure-white" : "bg-secondary-container text-primary"
                  }`}
                >
                  <Icon name={done ? "check" : action.icon} size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-label-bold text-label-bold text-on-surface">
                      {action.title}
                    </h3>
                    {action.minutes ? (
                      <span className="rounded-full bg-surface-container px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
                        {action.minutes}분
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                    {action.detail}
                  </p>
                </div>
              </button>
            );
          })}
        </section>

        {allDone && today ? (
          <div className="flex items-center gap-3 rounded-2xl bg-primary-fixed p-4">
            <Icon name="celebration" className="text-primary" />
            <p className="font-label-bold text-label-bold text-primary">
              오늘의 케어를 모두 마쳤어요!
            </p>
          </div>
        ) : null}

        <Link
          href="/products"
          className="flex items-center gap-3 rounded-2xl bg-pure-white p-4 shadow-[0_4px_20px_rgba(46,104,93,0.05)] transition-colors hover:bg-secondary-container"
        >
          <Icon name="shopping_bag" className="text-primary" />
          <span className="flex-1 font-label-bold text-label-bold">나를 위한 맞춤 제품 추천</span>
          <Icon name="chevron_right" className="text-primary" />
        </Link>

        <p className="px-2 text-center font-label-sm text-label-sm text-on-surface-variant">
          이 루틴은 생활 관리 가이드로 치료나 처방을 대신하지 않아요.
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
