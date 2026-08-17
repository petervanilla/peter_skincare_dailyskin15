"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { LogoMark } from "@/components/Logo";

/**
 * Shared primary-tab header — left-aligned wordmark, right-aligned profile
 * avatar linking to /profile. Originally Today's bespoke header; now reused
 * across every primary tab (Today, Progress, Routine, Rank, Shop) so they
 * all read as one consistent app chrome.
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-outline-variant/60 bg-pure-white px-margin-main py-3.5">
      <LogoMark height={36} />
      <Link
        href="/profile"
        aria-label="프로필"
        className="relative h-10 w-10 overflow-hidden rounded-full transition-transform hover:opacity-80 active:scale-95"
      >
        <Avatar sizePx={40} />
      </Link>
    </header>
  );
}
