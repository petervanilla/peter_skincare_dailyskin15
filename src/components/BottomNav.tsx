"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const TABS = [
  { href: "/today", icon: "calendar_today", label: "Today" },
  { href: "/progress", icon: "insights", label: "Progress" },
  { href: "/routine", icon: "favorite", label: "Routine" },
  // Lands on the school/class board first; the personal 7-Day Glow
  // Challenge (rivals + the shareable card) is one tap further in.
  { href: "/leaderboard", icon: "military_tech", label: "Rank" },
  { href: "/profile", icon: "person", label: "Profile" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[430px] -translate-x-1/2 items-center justify-around border-t border-outline-variant/60 bg-pure-white px-2 pt-2 pb-5">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center rounded-full px-2.5 py-1 transition-all duration-200 active:scale-95 ${
              active
                ? "bg-secondary-container text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            <Icon name={tab.icon} className="mb-1" filled={active} />
            <span className="font-label-sm text-label-sm">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
