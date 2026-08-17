"use client";

import { useEffect, useState } from "react";

/**
 * Counts up to `value` and stops — used for every score figure in the app so
 * a number never just appears, it visibly settles. Opens `from` points below
 * the target (default 6, floored at 0); respects reduced-motion.
 */
export function AnimatedNumber({ value, from }: { value: number; from?: number }) {
  const start = from ?? Math.max(0, value - 6);
  const [display, setDisplay] = useState(start);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    const duration = 900;
    const t0 = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(start + (value - start) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(frame);
  }, [value, start]);

  return <>{display}</>;
}
