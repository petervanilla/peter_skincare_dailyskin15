"use client";

import { StoredPhoto } from "@/components/StoredPhoto";
import { useStore } from "@/lib/store";

/**
 * The user's profile photo, everywhere it's shown. Uploading one (from the
 * Profile page) replaces the fallback everywhere at once; until then it
 * shows the nickname's first character as an initial, not a stock photo —
 * nobody in this app is a real person. The caller's wrapper controls
 * size/shape (e.g. `relative h-10 w-10 overflow-hidden rounded-full`); this
 * only fills it.
 */
export function Avatar({ sizePx = 40 }: { sizePx?: number }) {
  const { state } = useStore();
  const initial = state.nickname.trim().charAt(0).toUpperCase() || "?";

  return (
    <StoredPhoto
      photoKey={state.avatarPhotoKey}
      alt="프로필"
      className="h-full w-full object-cover"
      fallback={
        <div
          className="flex h-full w-full items-center justify-center bg-primary-container text-pure-white"
          aria-label="프로필"
        >
          <span
            className="font-headline-md leading-none font-bold"
            style={{ fontSize: sizePx * 0.42 }}
          >
            {initial}
          </span>
        </div>
      }
    />
  );
}
