"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { Confetti } from "@/components/ui/confetti";
import { haptic } from "@/lib/haptics";
import { IMG } from "@/lib/assets";
import { firstRecord, latestRecord } from "@/lib/scoring";
import { renderShareCard, shareOrDownload, type ShareCardData } from "@/lib/shareCard";
import { useStore } from "@/lib/store";
import { CHALLENGE_LENGTH } from "@/lib/types";

/**
 * 7-Day Glow Challenge (spec §13).
 *
 * The ranking metric is *improvement*, never the absolute score — the spec is
 * explicit that ranking raw skin scores invites appearance comparison. Rivals
 * are shown by improvement only, and no one's face is exposed.
 */

/** Local demo opponents. A real build would sync these from the backend. */
const DEMO_RIVALS = [
  { id: "mina", name: "Mina", improvement: 11, streak: 7, completed: 11, avatar: IMG.challengeRivals[0] },
  { id: "jisoo", name: "Jisoo", improvement: 6, streak: 5, completed: 9, avatar: IMG.challengeRivals[1] },
  { id: "hana", name: "Hana", improvement: 3, streak: 4, completed: 7, avatar: IMG.challengeRivals[2] },
];

/** `GLOW-` + four characters, skipping look-alikes (0/O, 1/I). */
function generateInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "GLOW-";
  for (let i = 0; i < 4; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/** 1 → 1st, 2 → 2nd, 3 → 3rd, 11–13 → 11th/12th/13th. */
function ordinal(n: number) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
}

export default function ChallengePage() {
  const { state, hydrated, joinChallenge, setInviteCode } = useStore();
  const [nickname, setNickname] = useState("");
  const [codeDraft, setCodeDraft] = useState("");
  const [celebration, setCelebration] = useState(0);

  if (!hydrated) return <div className="p-margin-main">불러오는 중…</div>;

  const first = firstRecord(state.records);
  const latest = latestRecord(state.records);
  const myImprovement =
    first && latest ? latest.dailySkinScore - first.dailySkinScore : 0;

  const board = [
    {
      id: "me",
      name: state.nickname,
      improvement: myImprovement,
      streak: state.records.length,
      completed: new Set(state.records.map((r) => r.day)).size,
      avatar: IMG.avatar,
      isMe: true,
    },
    ...DEMO_RIVALS.map((r) => ({ ...r, isMe: false })),
  ].sort((a, b) => b.improvement - a.improvement);

  if (!state.challengeJoined) {
    return (
      <div className="min-h-dvh pb-24">
        <main className="flex flex-col gap-4 px-margin-main pt-6">
          <section className="rounded-[24px] bg-primary-container p-6 text-pure-white">
            <p className="mb-1 font-label-sm text-label-sm tracking-[0.2em] text-pure-white/70 uppercase">
              Friends Challenge
            </p>
            <h2 className="mb-2 font-headline-md text-headline-md">함께 15일 완주하기</h2>
            <p className="font-body-md text-body-md text-pure-white/80">
              이 챌린지는 절대 점수가 아니라 <b>완주</b>와 <b>개선량</b>으로 겨뤄요. 피부가
              원래 어떤지가 아니라, 얼마나 꾸준히 달라졌는지만 비교해요.
            </p>
          </section>

          <label htmlFor="nickname" className="font-label-bold text-label-bold text-on-surface">
            닉네임
          </label>
          <input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="친구들에게 보일 이름"
            className="rounded-xl border border-outline-variant bg-pure-white px-4 py-3 font-body-md text-body-md outline-none focus:border-primary"
          />

          <label htmlFor="invite" className="mt-2 font-label-bold text-label-bold text-on-surface">
            초대코드
          </label>
          <div className="flex gap-2">
            <input
              id="invite"
              value={codeDraft}
              onChange={(e) => setCodeDraft(e.target.value.toUpperCase())}
              placeholder="초대코드 (예: GLOW-7K2M)"
              autoCapitalize="characters"
              className="min-w-0 flex-1 rounded-xl border border-outline-variant bg-pure-white px-4 py-3 font-body-md text-body-md tracking-wider outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setCodeDraft(generateInviteCode())}
              className="shrink-0 rounded-xl border border-primary px-4 font-label-bold text-label-bold text-primary transition-colors hover:bg-secondary-container active:bg-secondary-container"
            >
              코드 만들기
            </button>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            같은 코드로 들어온 친구들과 15일 완주를 함께 해요. 사진과 점수는 공유되지 않아요.
          </p>

          <div className="flex items-start gap-2 rounded-2xl bg-surface-container p-4">
            <Icon name="lock" size={18} className="mt-0.5 text-on-surface-variant" />
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              사진은 공유되지 않아요. 완주 일수와 점수 변화량만 표시됩니다.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              joinChallenge(nickname);
              setInviteCode(codeDraft.trim() || generateInviteCode());
            }}
            className="rounded-full bg-primary py-4 font-label-bold text-label-bold text-pure-white transition-colors hover:bg-primary-container active:bg-primary-container"
          >
            챌린지 참여하기
          </button>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-32">
      <main className="flex flex-col gap-4 px-margin-main pt-6">
        <InviteCodeRow code={state.inviteCode} />

        {/* Friends Challenge hero */}
        <section className="rounded-[24px] bg-pure-white p-6 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
          <span className="inline-block rounded-full bg-tertiary-fixed px-3 py-1 font-label-sm text-label-sm text-on-tertiary-fixed">
            Friends Challenge
          </span>
          <h2 className="mt-3 font-headline-lg-mobile text-headline-lg-mobile text-primary">
            함께 15일 완주하기
          </h2>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            어제의 나보다 나아진 나와 경쟁해요. 완주와 개선량만 봐요.
          </p>
        </section>

        {/* Status bento — Time Left / Your Rank */}
        <section className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-start rounded-[24px] bg-secondary-container p-5">
            <Icon name="timer" filled size={32} className="text-primary" />
            <span className="mt-2 font-label-sm text-label-sm text-primary/70">Time Left</span>
            <span className="font-headline-md text-headline-md text-primary">2 Days</span>
          </div>
          <button
            type="button"
            onClick={() => setCelebration((c) => c + 1)}
            aria-label="순위 축하하기"
            className="relative flex flex-col items-start overflow-hidden rounded-[24px] bg-primary-container p-5 text-left text-pure-white transition-all hover:bg-primary active:scale-95 active:bg-primary"
          >
            <Icon name="stars" filled size={32} className="text-primary-fixed" />
            <span className="mt-2 font-label-sm text-label-sm text-pure-white/70">Your Rank</span>
            <span className="font-headline-md text-headline-md">
              {ordinal(board.findIndex((b) => b.isMe) + 1)} Place
            </span>
          </button>
        </section>

        {celebration > 0 ? <Confetti key={celebration} isActive duration={2200} /> : null}

        <section className="rounded-[24px] bg-pure-white p-6 text-center shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
          <p className="font-label-sm text-label-sm text-on-surface-variant">내 개선량</p>
          <p className="font-display-hero text-display-hero text-primary">
            {myImprovement > 0 ? "+" : ""}
            {myImprovement}
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Day {first?.day ?? 1} → Day {latest?.day ?? 1}
          </p>
        </section>

        <section className="stagger flex flex-col gap-2">
          {board.map((entry, i) => (
            <div
              key={entry.id}
              className={`flex items-center gap-4 rounded-2xl p-4 ${
                entry.isMe ? "bg-secondary-container" : "bg-pure-white"
              } shadow-[0_4px_20px_rgba(46,104,93,0.05)]`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full font-label-bold text-label-bold ${
                  i === 0 ? "bg-primary text-pure-white" : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {i + 1}
              </span>
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                <Image src={entry.avatar} alt="" fill sizes="40px" className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-label-bold text-label-bold text-on-surface">
                  {entry.name}
                  {entry.isMe ? " (나)" : ""}
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  완주 {entry.completed}/{CHALLENGE_LENGTH}
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      entry.isMe ? "bg-primary" : "bg-primary-fixed-dim"
                    }`}
                    style={{ width: `${Math.round((entry.completed / CHALLENGE_LENGTH) * 100)}%` }}
                  />
                </div>
              </div>
              <span
                className={`font-headline-md text-headline-md ${
                  entry.improvement >= 0 ? "text-primary" : "text-error"
                }`}
              >
                {entry.improvement > 0 ? "+" : ""}
                {entry.improvement}
              </span>
            </div>
          ))}
        </section>

        <Link
          href="/leaderboard"
          className="flex items-center justify-center gap-2 rounded-full border border-primary py-4 font-label-bold text-label-bold text-primary transition-colors hover:bg-secondary-container active:bg-secondary-container"
        >
          <Icon name="leaderboard" size={18} />
          학교/반별 랭킹 보기
        </Link>

        <ShareCardPreview
          data={{
            nickname: state.nickname,
            fromDay: first?.day ?? 1,
            toDay: latest?.day ?? 1,
            scoreStart: first?.dailySkinScore ?? 0,
            scoreEnd: latest?.dailySkinScore ?? 0,
            experimentTitle: state.experiment?.title ?? null,
            deltas: [
              { label: "Visible Trouble", value: (latest?.subScores.trouble ?? 0) - (first?.subScores.trouble ?? 0) },
              { label: "Spot Index", value: (latest?.subScores.spot ?? 0) - (first?.subScores.spot ?? 0) },
              { label: "Smile Line", value: (latest?.subScores.nasolabial ?? 0) - (first?.subScores.nasolabial ?? 0) },
              { label: "Forehead Line", value: (latest?.subScores.forehead ?? 0) - (first?.subScores.forehead ?? 0) },
            ],
            inviteCode: state.inviteCode,
          }}
        />
      </main>

      <BottomNav />
    </div>
  );
}

/** Invite code with copy + share, so friends can join the same protocol. */
function InviteCodeRow({ code }: { code: string | null }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);

  if (!code) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      haptic("success");
      setCopied(true);
    } catch {
      /* clipboard blocked — nothing else to do */
    }
  };

  const share = async () => {
    const text = `DailySkin 15 친구 챌린지에 초대할게요. 초대코드 ${code}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        /* dismissed */
      }
    }
    await copy();
  };

  return (
    <section className="flex items-center gap-3 rounded-2xl bg-secondary-container px-4 py-3">
      <Icon name="key" size={20} className="text-primary" />
      <div className="flex-1">
        <p className="font-label-sm text-[10px] tracking-widest text-primary/70 uppercase">Invite Code</p>
        <p className="font-headline-md text-headline-md tracking-wider text-primary">{code}</p>
      </div>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label="초대코드 복사"
        className="flex h-10 items-center gap-1 rounded-full bg-pure-white px-3 font-label-sm text-label-sm text-primary transition-colors hover:bg-surface-container-low active:scale-95"
      >
        <span key={copied ? "copied" : "idle"} className={`flex items-center gap-1 ${copied ? "pop" : ""}`}>
          <Icon name={copied ? "check" : "content_copy"} size={16} />
          {copied ? "복사됨" : "복사"}
        </span>
      </button>
      <button
        type="button"
        onClick={() => {
          haptic("tap");
          void share();
        }}
        aria-label="초대코드 공유"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-pure-white transition-colors hover:bg-primary-container active:scale-95"
      >
        <Icon name="ios_share" size={18} />
      </button>
    </section>
  );
}

/**
 * 15일 결과 카드 (spec §13). Rendered live from the same canvas that gets
 * shared, so what the user previews is exactly what leaves the app. Score
 * change only; the face stays private.
 */
function ShareCardPreview({ data }: { data: ShareCardData }) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const key = JSON.stringify(data);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    const parsed = JSON.parse(key) as ShareCardData;
    void renderShareCard(parsed).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [key]);

  const act = async () => {
    setBusy(true);
    setNote(null);
    try {
      const blob = await renderShareCard(data);
      const result = await shareOrDownload(
        blob,
        `dailyskin15-day${data.fromDay}-${data.toDay}.png`,
        `DailySkin 15 · Day ${data.fromDay}→${data.toDay}`,
      );
      setNote(result === "shared" ? "공유했어요" : "이미지를 저장했어요");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-[24px] bg-pure-white p-4 shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-label-bold text-label-bold text-on-surface">내 결과 카드</h3>
        <span className="font-label-sm text-label-sm text-on-surface-variant">얼굴 사진 없음</span>
      </div>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-surface-container">
        {url ? (
          // Freshly rendered blob URL — not a static asset, so next/image does not apply.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="15일 결과 카드 미리보기" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center font-label-sm text-label-sm text-on-surface-variant">
            카드 만드는 중…
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            haptic("tap");
            void act();
          }}
          className="flex items-center justify-center gap-2 rounded-full border border-primary py-3 font-label-bold text-label-bold text-primary transition-colors hover:bg-secondary-container active:bg-secondary-container disabled:opacity-60"
        >
          <Icon name="download" size={18} />
          이미지 저장
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            haptic("tap");
            void act();
          }}
          className="flex items-center justify-center gap-2 rounded-full bg-primary py-3 font-label-bold text-label-bold text-pure-white transition-colors hover:bg-primary-container active:bg-primary-container disabled:opacity-60"
        >
          <Icon name="ios_share" size={18} />
          공유하기
        </button>
      </div>
      {note ? (
        <p className="mt-2 text-center font-label-sm text-label-sm text-on-surface-variant">{note}</p>
      ) : null}
      <p className="mt-3 font-label-sm text-label-sm text-on-surface-variant">
        얼굴 사진은 포함되지 않아요. 공개 여부는 직접 선택할 수 있어요.
      </p>
    </section>
  );
}
