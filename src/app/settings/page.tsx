"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";
import { Icon } from "@/components/Icon";
import { Switch } from "@/components/Switch";
import { TopAppBar } from "@/components/TopAppBar";
import { haptic } from "@/lib/haptics";
import { requestNotificationPermission } from "@/lib/reminder";
import { useStore } from "@/lib/store";
import { PROVIDER_LABELS } from "@/lib/types";

/**
 * Settings — grouped icon rows (Withings / Fitbit pattern) with the
 * same-time capture reminder up front, since that is the single control
 * most tied to Day-15 completion.
 */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** Photo keys are device-local IndexedDB handles — meaningless off-device. */
function stripPhotoKeys<T extends { photoKeys: unknown }>(record: T): Omit<T, "photoKeys"> {
  const copy: Partial<T> = { ...record };
  delete copy.photoKeys;
  return copy as Omit<T, "photoKeys">;
}
const APP_VERSION = "0.2.0";

export default function SettingsPage() {
  const router = useRouter();
  const { state, hydrated, updateSettings, signOut } = useStore();
  const [permissionNote, setPermissionNote] = useState<string | null>(null);
  const [poppedDay, setPoppedDay] = useState<number | null>(null);

  if (!hydrated) return <div className="p-margin-main">불러오는 중…</div>;

  const s = state.settings;
  const user = state.user;

  const toggleReminder = async (on: boolean) => {
    updateSettings({ reminderEnabled: on });
    setPermissionNote(null);
    if (!on) return;
    const result = await requestNotificationPermission();
    if (result !== "granted") {
      setPermissionNote("브라우저 알림이 꺼져 있어요. 앱을 열면 배너로 알려드려요.");
    }
  };

  const toggleDay = (day: number) => {
    haptic("select");
    setPoppedDay(day);
    const has = s.reminderDays.includes(day);
    const next = has ? s.reminderDays.filter((d) => d !== day) : [...s.reminderDays, day].sort();
    updateSettings({ reminderDays: next });
  };

  const exportData = () => {
    haptic("tap");
    const payload = {
      app: "DailySkin 15",
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      user: user ? { provider: user.provider, name: user.name, email: user.email ?? null } : null,
      survey: state.survey,
      experiment: state.experiment,
      records: state.records.map(stripPhotoKeys),
      cycles: state.cycles.map((c) => ({ ...c, records: c.records.map(stripPhotoKeys) })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dailyskin15-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const logout = () => {
    haptic("warning");
    signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-dvh pb-32">
      <TopAppBar title="설정" back />

      <main className="flex flex-col gap-5 px-margin-main pt-4">
        {/* 계정 */}
        <Group title="계정">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
              <Avatar sizePx={56} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-label-bold text-label-bold text-on-surface">
                {user?.name ?? state.nickname}
              </p>
              <p className="truncate font-label-sm text-label-sm text-on-surface-variant">
                {user ? PROVIDER_LABELS[user.provider] : "로그인 안 됨"}
                {user?.email ? ` · ${user.email}` : ""}
              </p>
            </div>
          </div>
          <Row icon="edit" label="프로필 수정" href="/profile" />
          <Row icon="logout" label="로그아웃" onClick={logout} tone="error" />
        </Group>

        {/* 알림 · 리마인더 */}
        <Group title="알림 · 리마인더">
          <Row
            icon="notifications_active"
            label="같은 시간 촬영 알림"
            caption={permissionNote ?? "매일 같은 시간에 찍는 게 15일 비교의 핵심이에요."}
            trailing={
              <Switch
                checked={s.reminderEnabled}
                onChange={(on) => void toggleReminder(on)}
                label="같은 시간 촬영 알림"
              />
            }
          />
          <div
            className={`flex flex-col gap-3 px-5 py-4 transition-opacity ${
              s.reminderEnabled ? "" : "pointer-events-none opacity-40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-label-bold text-label-bold text-on-surface">알림 시간</span>
              <input
                type="time"
                value={s.reminderTime}
                onChange={(e) => updateSettings({ reminderTime: e.target.value || s.reminderTime })}
                aria-label="알림 시간"
                className="rounded-xl border border-outline-variant bg-pure-white px-3 py-2 font-label-bold text-label-bold text-primary outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between gap-1">
              {WEEKDAYS.map((label, day) => {
                const on = s.reminderDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={on}
                    aria-label={`${label}요일`}
                    onClick={() => toggleDay(day)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-label-bold text-label-bold ${
                      poppedDay === day ? "pop" : ""
                    } ${
                      on
                        ? "bg-primary text-pure-white"
                        : "bg-surface-container text-on-surface-variant"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </Group>

        {/* 촬영 */}
        <Group title="촬영">
          <Row
            icon="center_focus_strong"
            label="자동 촬영"
            caption="가이드에 맞으면 1초 뒤 자동으로 찍어요"
            trailing={
              <Switch
                checked={s.autoCapture}
                onChange={(v) => updateSettings({ autoCapture: v })}
                label="자동 촬영"
              />
            }
          />
          <Row
            icon="layers"
            label="이전 사진 겹쳐 보기"
            caption="Day 1 사진을 카메라 위에 흐리게 보여줘요"
            trailing={
              <Switch
                checked={s.ghostOverlay}
                onChange={(v) => updateSettings({ ghostOverlay: v })}
                label="이전 사진 겹쳐 보기"
              />
            }
          />
        </Group>

        {/* 화면 · 반응 */}
        <Group title="화면 · 반응">
          <Row
            icon="vibration"
            label="햅틱 진동"
            caption="탭할 때 짧게 진동해요 (지원 기기)"
            trailing={
              <Switch
                checked={s.haptics}
                onChange={(v) => updateSettings({ haptics: v })}
                label="햅틱 진동"
              />
            }
          />
          <Row
            icon="animation"
            label="모션 줄이기"
            caption="화면 전환과 장식 애니메이션을 최소화해요"
            trailing={
              <Switch
                checked={s.reduceMotion}
                onChange={(v) => updateSettings({ reduceMotion: v })}
                label="모션 줄이기"
              />
            }
          />
        </Group>

        {/* 개인정보 · 데이터 */}
        <Group title="개인정보 · 데이터">
          <Row
            icon="lock"
            label="이 기기에만 저장"
            caption="사진은 IndexedDB, 기록은 localStorage. 서버로 보내지 않아요."
          />
          <Row icon="download" label="내 기록 내보내기 (JSON)" onClick={exportData} />
          <Row icon="delete" label="모든 기록 초기화" href="/profile" tone="error" />
        </Group>

        {/* 정보 */}
        <Group title="정보">
          <Row icon="info" label="버전" value={`${APP_VERSION} · Web MVP`} />
          <Row icon="description" label="이용약관" href="#" />
          <Row icon="policy" label="개인정보 처리방침" href="#" />
          <Row icon="code" label="오픈소스 라이선스" href="#" />
        </Group>

        <p className="text-center font-label-sm text-[11px] text-on-surface-variant/70">
          DailySkin 15 · 셀프케어 기록 도구예요. 의학적 판단을 대신하지 않아요.
        </p>
      </main>

      <BottomNav />
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 font-label-sm text-label-sm tracking-[0.12em] text-on-surface-variant uppercase">
        {title}
      </h2>
      <div className="divide-y divide-outline-variant/40 overflow-hidden rounded-[24px] bg-pure-white shadow-[0_4px_20px_rgba(46,104,93,0.05)]">
        {children}
      </div>
    </section>
  );
}

function Row({
  icon,
  label,
  caption,
  value,
  href,
  onClick,
  trailing,
  tone = "default",
}: {
  icon: string;
  label: string;
  caption?: string;
  value?: string;
  href?: string;
  onClick?: () => void;
  trailing?: ReactNode;
  tone?: "default" | "error";
}) {
  const isError = tone === "error";
  const body = (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isError ? "bg-error-container text-on-error-container" : "bg-secondary-container text-primary"
        }`}
      >
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block font-label-bold text-label-bold ${isError ? "text-error" : "text-on-surface"}`}
        >
          {label}
        </span>
        {caption ? (
          <span className="mt-0.5 block font-label-sm text-label-sm break-keep text-on-surface-variant">
            {caption}
          </span>
        ) : null}
      </span>
      {trailing ??
        (value ? (
          <span className="font-label-sm text-label-sm text-on-surface-variant">{value}</span>
        ) : href || onClick ? (
          <Icon name="chevron_right" className="text-outline" />
        ) : null)}
    </>
  );
  const cls = "flex w-full items-center gap-4 px-5 py-4 text-left";

  if (href) {
    return (
      <Link href={href} onClick={() => haptic("tap")} className={`${cls} active:bg-surface-container-low`}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} active:bg-surface-container-low`}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}
