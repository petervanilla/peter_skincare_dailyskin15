"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { LogoMark } from "@/components/Logo";
import { ProviderIcon } from "@/components/ProviderIcon";
import { IMG } from "@/lib/assets";
import { isValidEmail, signInWith } from "@/lib/auth";
import { haptic } from "@/lib/haptics";
import { useStore } from "@/lib/store";
import type { AuthProvider } from "@/lib/types";

/**
 * Sign-in. Lifestyle photo up top, a rising sheet of providers at the bottom
 * (Cleo AI / Replika / Anything pattern). Every provider is a local mock in
 * the web MVP — see lib/auth.ts for the swap points.
 */
export default function LoginPage() {
  const router = useRouter();
  const { state, hydrated, signIn } = useStore();
  const [busy, setBusy] = useState<AuthProvider | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const destination = state.survey ? "/today" : "/onboarding/survey";

  useEffect(() => {
    if (hydrated && state.user) router.replace(destination);
  }, [hydrated, state.user, destination, router]);

  const go = async (provider: AuthProvider) => {
    if (busy) return;
    setError(null);
    if (provider === "email" && !isValidEmail(email)) {
      setError("이메일 주소를 확인해 주세요");
      haptic("warning");
      return;
    }
    setBusy(provider);
    haptic("tap");
    try {
      const user = await signInWith(provider, { email });
      signIn(user);
      haptic("success");
      router.replace(destination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "다시 시도해 주세요");
      setBusy(null);
    }
  };

  return (
    <div className="no-stagger relative flex min-h-dvh flex-col overflow-hidden bg-background">
      {/* Photo */}
      <div className="no-press relative h-[58dvh] w-full">
        <Image
          src={IMG.lifestyle}
          alt=""
          fill
          priority
          sizes="430px"
          className="object-cover object-[50%_35%] opacity-80"
        />
        {/* Softer than the photo alone: a light wash on top so the wordmark
            sits on the scene without a pill, then the fade into the sheet. */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/45 via-background/10 to-background" />
        <div className="absolute top-12 left-margin-main drop-shadow-[0_2px_10px_rgba(255,255,255,0.9)]">
          <LogoMark height={30} />
        </div>
        <div className="absolute right-margin-main bottom-6 left-margin-main">
          <h1 className="font-sans text-[32px] leading-[40px] font-bold tracking-[-0.02em] break-keep whitespace-pre-line text-primary">
            {"매일 30초.\n15일의 변화."}
          </h1>
          <p className="mt-2 font-body-md text-body-md break-keep text-on-surface-variant">
            같은 빛, 같은 거리, 같은 각도. 내 피부 반응을 기록해요.
          </p>
        </div>
      </div>

      {/* Provider sheet */}
      <main className="sheet-up relative -mt-2 flex flex-1 flex-col gap-3 rounded-t-[32px] bg-pure-white px-margin-main pt-6 pb-10 shadow-[0_-12px_40px_rgba(0,67,57,0.08)]">
        <ProviderButton
          provider="google"
          busy={busy}
          onClick={() => void go("google")}
          className="border border-outline-variant bg-pure-white text-on-surface"
        >
          Google로 계속하기
        </ProviderButton>
        <ProviderButton
          provider="apple"
          busy={busy}
          onClick={() => void go("apple")}
          className="bg-graphite text-pure-white"
        >
          Apple로 계속하기
        </ProviderButton>
        <ProviderButton
          provider="kakao"
          busy={busy}
          onClick={() => void go("kakao")}
          className="bg-[#FEE500] text-[#191919]"
        >
          카카오로 계속하기
        </ProviderButton>

        {emailOpen ? (
          <div className="pop flex flex-col gap-2 rounded-2xl bg-surface-container-low p-3">
            <label htmlFor="email" className="font-label-sm text-label-sm text-on-surface-variant">
              이메일
            </label>
            <div className="flex gap-2">
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void go("email");
                }}
                placeholder="you@example.com"
                className="min-w-0 flex-1 rounded-xl border border-outline-variant bg-pure-white px-4 py-3 font-body-md text-body-md outline-none focus:border-primary"
              />
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void go("email")}
                className="flex items-center justify-center rounded-xl bg-primary px-5 font-label-bold text-label-bold text-pure-white disabled:opacity-50"
              >
                {busy === "email" ? <Spinner /> : "계속"}
              </button>
            </div>
            {error ? (
              <p className="font-label-sm text-label-sm text-error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              haptic("tap");
              setEmailOpen(true);
            }}
            className="flex items-center justify-center gap-2 py-2 font-label-bold text-label-bold text-primary"
          >
            <ProviderIcon provider="email" size={18} />
            이메일로 계속하기
          </button>
        )}

        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void go("guest")}
          className="py-1 font-label-sm text-label-sm text-on-surface-variant underline-offset-4 hover:underline disabled:opacity-50"
        >
          {busy === "guest" ? "준비 중…" : "둘러보기 (게스트)"}
        </button>

        <p className="mt-auto text-center font-label-sm text-[11px] leading-4 break-keep text-on-surface-variant/80">
          계속하면 이용약관과 개인정보 처리방침에 동의하는 거예요.
          <br />
          사진과 기록은 이 기기에만 저장돼요.
        </p>
      </main>
    </div>
  );
}

function ProviderButton({
  provider,
  busy,
  onClick,
  className,
  children,
}: {
  provider: AuthProvider;
  busy: AuthProvider | null;
  onClick: () => void;
  className: string;
  children: React.ReactNode;
}) {
  const isBusy = busy === provider;
  return (
    <button
      type="button"
      disabled={busy !== null}
      onClick={onClick}
      aria-busy={isBusy}
      className={`relative flex h-14 w-full items-center justify-center gap-3 rounded-full font-label-bold text-label-bold shadow-sm disabled:opacity-60 ${className}`}
    >
      <span className="absolute left-5 flex items-center">
        {isBusy ? <Spinner /> : <ProviderIcon provider={provider} />}
      </span>
      {isBusy ? "연결 중…" : children}
    </button>
  );
}

function Spinner() {
  return (
    <Icon name="progress_activity" size={20} className="animate-spin [animation-duration:900ms]" />
  );
}
