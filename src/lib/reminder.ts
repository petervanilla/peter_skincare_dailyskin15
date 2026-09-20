import type { DayRecord, Settings } from "./types.ts";

/**
 * Same-time capture reminder (settings › 알림).
 *
 * Nothing here schedules anything in the background — a web MVP cannot.
 * Instead the app checks on open whether the reminder is *due* and shows an
 * in-app banner, plus a one-per-day browser notification when permission
 * was granted. Native push is the iOS step in the roadmap.
 */

export function todayKey(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function minutesOf(hhmm: string) {
  const [h, m] = hhmm.split(":").map((v) => Number.parseInt(v, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/**
 * True when the reminder is on, today is one of its weekdays, the reminder
 * time has passed, and no capture has been filed for today yet.
 */
export function isReminderDue(
  settings: Pick<Settings, "reminderEnabled" | "reminderTime" | "reminderDays">,
  records: Pick<DayRecord, "date">[],
  now = new Date(),
): boolean {
  if (!settings.reminderEnabled) return false;
  if (!settings.reminderDays.includes(now.getDay())) return false;
  const target = minutesOf(settings.reminderTime);
  if (target === null) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  if (current < target) return false;
  const today = todayKey(now);
  return !records.some((r) => r.date === today);
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  try {
    if (Notification.permission === "granted" || Notification.permission === "denied") {
      return Notification.permission;
    }
    return await Notification.requestPermission();
  } catch {
    return "unsupported";
  }
}

const NOTIFIED_PREFIX = "dailyskin15:notified:";

/** Fires one browser notification per calendar day, only with permission. */
export function maybeNotifyOnce(title: string, body: string, now = new Date()) {
  if (typeof window === "undefined" || typeof Notification === "undefined") return false;
  try {
    if (Notification.permission !== "granted") return false;
    const key = `${NOTIFIED_PREFIX}${todayKey(now)}`;
    if (window.localStorage.getItem(key)) return false;
    new Notification(title, { body });
    window.localStorage.setItem(key, "1");
    return true;
  } catch {
    return false;
  }
}
