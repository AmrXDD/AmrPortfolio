"use client";

import { useEffect, useRef } from "react";

/* Matte desert sand palette — NO glow */
const SAND = ["#bda06d", "#d4b270", "#8a6f43", "#c4a86a", "#9c7e4e", "#b8965c"];

/**
 * Ambient desert dust. Fixed, z-9999, pointer-events:none. Invisible over the
 * hero (so it never touches the galaxy); for every section below it drifts as
 * fine matte sand and INTENSIFIES as the mouse moves. No transitions, no walls —
 * purely the atmospheric particle layer.
 */
export function Sandstorm() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    // ---- matte soft "dust mist" sprite (earthy, NO white glow) ----
    const MS = 110;
    const mist = document.createElement("canvas");
    mist.width = mist.height = MS;
    const mc = mist.getContext("2d")!;
    const mg = mc.createRadialGradient(MS / 2, MS / 2, 0, MS / 2, MS / 2, MS / 2);
    mg.addColorStop(0, "rgba(168,140,90,0.5)");
    mg.addColorStop(0.55, "rgba(140,112,68,0.22)");
    mg.addColorStop(1, "rgba(120,96,58,0)");
    mc.fillStyle = mg;
    mc.beginPath();
    mc.arc(MS / 2, MS / 2, MS / 2, 0, Math.PI * 2);
    mc.fill();

    let w = 0;
    let h = 0;
    let vh = window.innerHeight;
    let gust = 0;
    let t = 0;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const pick = () => SAND[(Math.random() * SAND.length) | 0];

    type P = { x: number; y: number; vx: number; vy: number; s: number; a: number; col: string; mist: boolean };
    let idle: P[] = [];

    const seedIdle = () => {
      const grains = reduce ? 60 : coarse ? 120 : 230;
      const mists = reduce ? 8 : coarse ? 14 : 26;
      idle = [];
      for (let i = 0; i < grains; i++)
        idle.push({ x: rand(0, w), y: rand(0, h), vx: rand(0.2, 0.9), vy: rand(-0.1, 0.16), s: rand(0.8, 2.4), a: rand(0.12, 0.45), col: pick(), mist: false });
      for (let i = 0; i < mists; i++)
        idle.push({ x: rand(0, w), y: rand(0, h), vx: rand(0.1, 0.4), vy: rand(-0.05, 0.08), s: rand(45, 120), a: rand(0.03, 0.12), col: "", mist: true });
    };

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      vh = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedIdle();
    };

    // ---- mouse-move INTENSIFIES the ambient drift ----
    let lx = 0;
    let ly = 0;
    let mInit = false;
    const onMove = (e: MouseEvent) => {
      if (mInit) gust = Math.min(7, gust + (Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly)) * 0.05);
      lx = e.clientX;
      ly = e.clientY;
      mInit = true;
    };

    const wrap = (p: P, m: number) => {
      if (p.x > w + m) p.x = -m;
      if (p.x < -m) p.x = w + m;
      if (p.y > h + m) p.y = -m;
      if (p.y < -m) p.y = h + m;
    };

    let raf = 0;
    let running = true;
    const tick = () => {
      if (!running) return;
      t += 0.016;
      gust *= 0.94;
      const scrollY = window.scrollY;
      const V = window.innerHeight || vh;
      // ambient dust appears as you leave the hero (never over the galaxy)
      const op = Math.max(0, Math.min(1, (scrollY - V * 0.3) / (V * 0.45)));

      ctx.clearRect(0, 0, w, h);
      if (op > 0.004) {
        const boost = 1 + Math.min(1.4, gust * 0.22);
        for (const p of idle) {
          if (p.mist) {
            p.x += p.vx + gust * 0.7;
            p.y += p.vy;
            wrap(p, p.s);
            ctx.globalAlpha = p.a * op * boost;
            ctx.drawImage(mist, p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
          } else {
            p.x += p.vx + gust * 1.1;
            p.y += p.vy + Math.sin(t * 0.6 + p.x * 0.01) * 0.08;
            wrap(p, 4);
            ctx.globalAlpha = Math.min(0.9, p.a * op * boost);
            ctx.fillStyle = p.col;
            ctx.fillRect(p.x, p.y, p.s, p.s);
          }
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(tick);
    };

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    resize();
    canvas.style.opacity = "1"; // visibility handled per-draw via globalAlpha
    if (!reduce) raf = requestAnimationFrame(tick);

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ opacity: 0, position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 9999 }}
    />
  );
}
