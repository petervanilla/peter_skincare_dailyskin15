/**
 * Tiny haptic helper. `navigator.vibrate` is Android/Chrome only — iOS Safari
 * ignores it — so this is a light "nice to have", never something a flow
 * depends on. Settings can turn it off; the flag is mirrored onto
 * <html data-haptics> by the settings effect so this stays synchronous.
 */
export type HapticKind = "tap" | "select" | "success" | "warning";

const PATTERNS: Record<HapticKind, number | number[]> = {
  tap: 6,
  select: 10,
  success: [12, 40, 18],
  warning: [20, 60, 20],
};

export function haptic(kind: HapticKind = "tap") {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  if (document.documentElement.dataset.haptics === "off") return;
  try {
    navigator.vibrate?.(PATTERNS[kind]);
  } catch {
    /* unsupported */
  }
}
