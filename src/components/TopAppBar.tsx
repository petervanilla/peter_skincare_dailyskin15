"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { IMG } from "@/lib/assets";
import { Icon } from "./Icon";

interface TopAppBarProps {
  title: ReactNode;
  /** Shows a back chevron on the left when true. */
  back?: boolean;
  onBack?: () => void;
  action?: ReactNode;
  transparent?: boolean;
  /** Shows the account avatar on the left instead of a back button. */
  avatar?: boolean;
}

export function TopAppBar({
  title,
  back = false,
  onBack,
  action,
  transparent = false,
  avatar = false,
}: TopAppBarProps) {
  const router = useRouter();

  return (
    <header
      // Same white-on-a-hairline treatment as BottomNav, so the two frame the
      // scrolling content identically.
      className={`sticky top-0 z-40 flex w-full items-center justify-between px-margin-main py-3.5 ${
        transparent ? "bg-transparent" : "border-b border-outline-variant/60 bg-pure-white"
      }`}
    >
      <div className="flex w-10 justify-start">
        {back ? (
          <button
            type="button"
            aria-label="뒤로"
            onClick={() => (onBack ? onBack() : router.back())}
            className="text-primary transition-transform hover:opacity-80 active:scale-95"
          >
            <Icon name="arrow_back_ios_new" />
          </button>
        ) : avatar ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-full">
            <Image src={IMG.avatar} alt="프로필" fill sizes="40px" className="object-cover" />
          </div>
        ) : null}
      </div>
      <div className="font-headline-md text-headline-md font-bold text-primary">{title}</div>
      <div className="flex w-10 justify-end">{action}</div>
    </header>
  );
}
