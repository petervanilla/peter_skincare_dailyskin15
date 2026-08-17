"use client";

import Image from "next/image";
import { StoredPhoto } from "@/components/StoredPhoto";
import { IMG } from "@/lib/assets";
import { useStore } from "@/lib/store";

/**
 * The user's profile photo, everywhere it's shown — falls back to the stock
 * avatar until they upload their own from the Profile page. The caller's
 * wrapper controls size/shape (e.g. `relative h-10 w-10 overflow-hidden
 * rounded-full`); this only fills it.
 */
export function Avatar({ sizePx = 40 }: { sizePx?: number }) {
  const { state } = useStore();

  return (
    <StoredPhoto
      photoKey={state.avatarPhotoKey}
      alt="프로필"
      className="h-full w-full object-cover"
      fallback={
        <Image
          src={IMG.avatar}
          alt="프로필"
          fill
          sizes={`${sizePx}px`}
          className="object-cover"
        />
      }
    />
  );
}
