"use client";

import Image from "next/image";
import { StoredPhoto } from "@/components/StoredPhoto";
import { IMG } from "@/lib/assets";
import { useStore } from "@/lib/store";

/**
 * The user's profile photo, everywhere it's shown. Uploading one (from the
 * Profile page) replaces the fallback everywhere at once; until then it
 * shows the demo portrait for the demo account and an initial for other
 * accounts. The caller's wrapper controls
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
      fallback={state.user?.id === "demo-user" ? (
        <Image src={IMG.avatar} alt="데모 프로필" fill sizes={`${sizePx}px`} className="object-cover" />
      ) : (
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
      )}
    />
  );
}
