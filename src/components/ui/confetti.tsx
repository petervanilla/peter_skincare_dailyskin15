"use client";

import { useEffect, useRef } from "react";

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  zIndex?: number;
}

/** Brand palette only — greens and lavenders, no generic party colours. */
const COLORS = ["#004339", "#97d2c4", "#cbbeff", "#3d2d7b", "#cfe8dc", "#ffffff"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  size: number;
  color: string;
}

/**
 * Lightweight canvas confetti burst — no canvas-confetti dependency, since
 * this is the only place in the app that needs one. Mount it (or remount via
 * a changing `key`) to fire a burst; it clears itself after `duration`.
 */
export function Confetti({ isActive, duration = 2200, zIndex = 100 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = Array.from({ length: 90 }, () => ({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 140,
      y: window.innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 8,
      vy: -Math.random() * 10 - 4,
      rotation: Math.random() * 360,
      spin: (Math.random() - 0.5) * 14,
      size: 6 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    const gravity = 0.35;
    const start = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const life = Math.max(0, 1 - elapsed / duration);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (const p of particles) {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;

        ctx.save();
        ctx.globalAlpha = life;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      frame = elapsed < duration ? requestAnimationFrame(tick) : 0;
    };

    frame = requestAnimationFrame(tick);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [isActive, duration]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{ zIndex }}
    />
  );
}
