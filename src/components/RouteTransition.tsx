"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useStore } from "@/lib/store";

/**
 * Wraps every route so a navigation re-mounts the page with the `.page-in`
 * rise animation (see globals.css). Keyed by pathname: a query-only change
 * (e.g. ?tab=) keeps the page and does not replay the entrance.
 *
 * Also mirrors two settings onto <html> so CSS and the haptic helper can read
 * them synchronously without a React context.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state } = useStore();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.haptics = state.settings.haptics ? "on" : "off";
    root.dataset.motion = state.settings.reduceMotion ? "reduce" : "full";
  }, [state.settings.haptics, state.settings.reduceMotion]);

  return (
    <div key={pathname} className="page-in">
      {children}
    </div>
  );
}
