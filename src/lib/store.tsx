"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { clearPhotos, putPhoto } from "./photoStore";
import type { AppState, DayRecord, Survey } from "./types";
import { CHALLENGE_LENGTH } from "./types";

const STORAGE_KEY = "dailyskin15:state:v1";

const EMPTY_STATE: AppState = {
  survey: null,
  onboardedAt: null,
  records: [],
  challengeJoined: false,
  nickname: "Amy",
  heroPhoto: null,
  avatarPhotoKey: null,
};

interface StoreValue {
  state: AppState;
  /** false until the first client-side read of localStorage completes. */
  hydrated: boolean;
  saveSurvey: (survey: Survey) => void;
  upsertRecord: (record: DayRecord) => void;
  toggleAction: (day: number, actionId: string) => void;
  setSunExposure: (day: number, value: boolean) => void;
  joinChallenge: (nickname: string) => void;
  /** Edits the display name and age shown on the profile card. */
  updateProfile: (nickname: string, age: number | null) => void;
  /** Stores a picked cover photo and centres it. */
  saveHeroPhoto: (dataUrl: string) => Promise<void>;
  /** Persists the hand-adjusted `object-position`, in percent. */
  moveHeroPhoto: (x: number, y: number) => void;
  removeHeroPhoto: () => void;
  /** Stores a picked profile photo, replacing the stock avatar everywhere it's shown. */
  saveAvatarPhoto: (dataUrl: string) => Promise<void>;
  removeAvatarPhoto: () => void;
  reset: () => void;
  /** The day number a new capture should be filed under (1–15). */
  nextDay: number;
}

const StoreContext = createContext<StoreValue | null>(null);

function loadState(): AppState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return { ...EMPTY_STATE, ...parsed, records: parsed.records ?? [] };
  } catch {
    return EMPTY_STATE;
  }
}

/** Subscribing to nothing: this only distinguishes server from client render. */
const noopSubscribe = () => () => {};

export function StoreProvider({ children }: { children: ReactNode }) {
  // The server (and the first client render, so hydration matches) sees the
  // empty state; every render after mount reads localStorage.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const [override, setOverride] = useState<AppState | null>(null);
  const persisted = useMemo(() => (hydrated ? loadState() : EMPTY_STATE), [hydrated]);
  const state = override ?? persisted;

  const setState = useCallback((updater: (s: AppState) => AppState) => {
    setOverride((prev) => updater(prev ?? loadState()));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota or private mode — the session still works in memory */
    }
  }, [state, hydrated]);

  const saveSurvey = useCallback(
    (survey: Survey) => {
      setState((s) => ({
        ...s,
        survey,
        onboardedAt: s.onboardedAt ?? new Date().toISOString(),
      }));
    },
    [setState],
  );

  const upsertRecord = useCallback(
    (record: DayRecord) => {
      setState((s) => {
        const rest = s.records.filter((r) => r.day !== record.day);
        return { ...s, records: [...rest, record].sort((a, b) => a.day - b.day) };
      });
    },
    [setState],
  );

  const toggleAction = useCallback(
    (day: number, actionId: string) => {
      setState((s) => ({
        ...s,
        records: s.records.map((r) => {
          if (r.day !== day) return r;
          const done = r.completedActions.includes(actionId);
          return {
            ...r,
            completedActions: done
              ? r.completedActions.filter((a) => a !== actionId)
              : [...r.completedActions, actionId],
          };
        }),
      }));
    },
    [setState],
  );

  const setSunExposure = useCallback(
    (day: number, value: boolean) => {
      setState((s) => ({
        ...s,
        records: s.records.map((r) => (r.day === day ? { ...r, sunExposure: value } : r)),
      }));
    },
    [setState],
  );

  const joinChallenge = useCallback(
    (nickname: string) => {
      setState((s) => ({ ...s, challengeJoined: true, nickname: nickname || s.nickname }));
    },
    [setState],
  );

  const updateProfile = useCallback(
    (nickname: string, age: number | null) => {
      setState((s) => ({
        ...s,
        nickname: nickname || s.nickname,
        // Age lives on the survey — it's the same value the Skin Age Index
        // baseline uses (spec §7), not a separate field.
        survey: s.survey ? { ...s.survey, age: age ?? undefined } : s.survey,
      }));
    },
    [setState],
  );

  const saveHeroPhoto = useCallback(
    async (dataUrl: string) => {
      // A fresh key each time, so the <img> never shows a cached predecessor.
      const key = `hero-${Date.now()}`;
      await putPhoto(key, dataUrl);
      setState((s) => ({ ...s, heroPhoto: { key, x: 50, y: 50 } }));
    },
    [setState],
  );

  const moveHeroPhoto = useCallback(
    (x: number, y: number) => {
      setState((s) => (s.heroPhoto ? { ...s, heroPhoto: { ...s.heroPhoto, x, y } } : s));
    },
    [setState],
  );

  const removeHeroPhoto = useCallback(() => {
    setState((s) => ({ ...s, heroPhoto: null }));
  }, [setState]);

  const saveAvatarPhoto = useCallback(
    async (dataUrl: string) => {
      const key = `avatar-${Date.now()}`;
      await putPhoto(key, dataUrl);
      setState((s) => ({ ...s, avatarPhotoKey: key }));
    },
    [setState],
  );

  const removeAvatarPhoto = useCallback(() => {
    setState((s) => ({ ...s, avatarPhotoKey: null }));
  }, [setState]);

  const reset = useCallback(() => {
    void clearPhotos();
    setOverride(EMPTY_STATE);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const nextDay = useMemo(() => {
    if (!state.records.length) return 1;
    const max = Math.max(...state.records.map((r) => r.day));
    const today = new Date().toISOString().slice(0, 10);
    const latest = state.records.find((r) => r.day === max);
    // Re-recording on the same calendar date overwrites that day rather than
    // burning a slot in the 15-day programme.
    if (latest?.date === today) return max;
    return Math.min(max + 1, CHALLENGE_LENGTH);
  }, [state.records]);

  const value = useMemo<StoreValue>(
    () => ({
      state,
      hydrated,
      saveSurvey,
      upsertRecord,
      toggleAction,
      setSunExposure,
      joinChallenge,
      updateProfile,
      saveHeroPhoto,
      moveHeroPhoto,
      removeHeroPhoto,
      saveAvatarPhoto,
      removeAvatarPhoto,
      reset,
      nextDay,
    }),
    [
      state,
      hydrated,
      saveSurvey,
      upsertRecord,
      toggleAction,
      setSunExposure,
      joinChallenge,
      updateProfile,
      saveHeroPhoto,
      moveHeroPhoto,
      removeHeroPhoto,
      saveAvatarPhoto,
      removeAvatarPhoto,
      reset,
      nextDay,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
