"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Swarm cursor — the pointer is a small swarm of the same square particles
 * the hero headline and the scroll stream are made of.
 *
 *   • at rest:      a tight, slowly turning nucleus; moving drags a comet tail
 *                   (every particle has its own spring, so they arrive late)
 *   • links:        the swarm opens into a turning ring
 *   • [data-cursor-label]: it spells the label in particles under the ring
 *   • "drag":       ring plus two chevrons
 *   • text fields:  it collapses into an I-beam
 *   • press:        it tightens; release bursts it outward, then it re-forms
 *
 * A crisp square marks the exact hotspot, so precision never depends on the
 * swarm. One fixed canvas; the loop sleeps once everything has settled and
 * wakes on the next pointer event. Off on touch screens and for reduced
 * motion (the native cursor stays).
 */

type Mode = "default" | "link" | "view" | "drag" | "text";

const N = 360;
const EMBER = ["255,77,31", "255,138,76", "255,236,222"];

export function Cursor() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !reduce);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    document.documentElement.classList.add("cursor-none");

    let W = 0;
    let H = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    // particle state
    const x = new Float32Array(N);
    const y = new Float32Array(N);
    const vx = new Float32Array(N);
    const vy = new Float32Array(N);
    const k = new Float32Array(N); // spring stiffness (varies → the tail)
    const ang = new Float32Array(N);
    const rad = new Float32Array(N);
    const size = new Float32Array(N);
    const col = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      x[i] = -100;
      y[i] = -100;
      k[i] = 0.07 + Math.pow(Math.random(), 1.6) * 0.2;
      ang[i] = Math.random() * Math.PI * 2;
      rad[i] = Math.sqrt(Math.random());
      size[i] = 1.3 + Math.random() * 1.5;
      col[i] = rad[i] < 0.35 ? 2 : Math.random() < 0.6 ? 0 : 1;
    }

    const ptr = { x: -100, y: -100, seen: false, down: false };
    let mode: Mode = "default";
    let label = "";
    let onLight = false;
    let labelPts: Float32Array | null = null;
    const labelCache = new Map<string, Float32Array>();

    // the label, as particle homes centred on (0, 0)
    const rootCs = getComputedStyle(document.body);
    const mono = rootCs.getPropertyValue("--font-mono").trim() || "monospace";
    const arSans = rootCs.getPropertyValue("--font-ar-sans").trim() || "sans-serif";
    const sampleLabel = (text: string) => {
      const hit = labelCache.get(text);
      if (hit) return hit;
      const arabic = /[؀-ۿ]/.test(text);
      const t = arabic ? text : text.toUpperCase();
      const fs = 21;
      const off = document.createElement("canvas");
      const o = off.getContext("2d", { willReadFrequently: true });
      if (!o) return new Float32Array(0);
      const font = `700 ${fs}px ${arabic ? arSans : mono}, ${arSans}`;
      o.font = font;
      const ls = o as CanvasRenderingContext2D & { letterSpacing?: string };
      if (!arabic && "letterSpacing" in o) ls.letterSpacing = "3px";
      const w = Math.ceil(o.measureText(t).width) + 12;
      const h = fs + 14;
      off.width = w;
      off.height = h;
      o.font = font;
      if (!arabic && "letterSpacing" in o) ls.letterSpacing = "3px";
      o.direction = arabic ? "rtl" : "ltr";
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.fillStyle = "#fff";
      o.fillText(t, w / 2, h / 2);
      const data = o.getImageData(0, 0, w, h).data;
      const pts: number[] = [];
      const cap = Math.round(N * 0.78);
      for (let step = 2; step < 6; step++) {
        pts.length = 0;
        for (let yy = 0; yy < h; yy += step) for (let xx = 0; xx < w; xx += step) if (data[(yy * w + xx) * 4 + 3] > 140) pts.push(xx - w / 2, yy - h / 2);
        if (pts.length / 2 <= cap) break;
      }
      const out = Float32Array.from(pts);
      labelCache.set(text, out);
      return out;
    };

    // where particle i wants to be, relative to the pointer (written to HX/HY)
    let HX = 0;
    let HY = 0;
    const put = (a: number, b: number) => {
      HX = a;
      HY = b;
    };
    const home = (i: number, time: number) => {
      const press = ptr.down ? 0.6 : 1;
      if (mode === "text") {
        // an I-beam: a stem and two short serifs
        const u = i / N;
        if (u < 0.7) return put(((i % 3) - 1) * 0.8, (u / 0.7 - 0.5) * 24 * press);
        const s = u < 0.85 ? -1 : 1;
        return put(((u * 40) % 1 - 0.5) * 9, s * 12 * press);
      }
      if (labelPts && labelPts.length) {
        const L = labelPts.length / 2;
        if (i < L) return put(labelPts[i * 2], labelPts[i * 2 + 1] + 48);
        // the rest hold a small ring
        const a = ang[i] + time * 1.4;
        const R = 20 * press;
        return put(Math.cos(a) * R, Math.sin(a) * R);
      }
      if (mode === "drag" && i < 60) {
        // two chevrons, ‹ and ›, either side of the ring
        const side = i < 30 ? -1 : 1;
        const j = (i % 30) / 29; // 0..1 along the chevron
        const arm = j < 0.5 ? j * 2 : (1 - j) * 2;
        return put(side * (44 + (1 - arm) * 7), (j - 0.5) * 18);
      }
      if (mode !== "default") {
        const R = (mode === "view" ? 40 : 26) * press;
        const a = ang[i] + time * (mode === "view" ? 0.9 : 1.3);
        const jitter = (rad[i] - 0.5) * 3;
        return put(Math.cos(a) * (R + jitter), Math.sin(a) * (R + jitter));
      }
      // nucleus: denser at the centre, turning both ways
      const R = (3 + rad[i] * 11) * press;
      const a = ang[i] + time * (0.6 + rad[i] * 0.9) * (i % 2 ? 1 : -1);
      put(Math.cos(a) * R, Math.sin(a) * R);
    };

    let raf = 0;
    let running = false;
    let last = performance.now();
    let t = 0;
    let lastInput = performance.now();

    const frame = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      // the swarm only turns while something is happening; at rest it
      // stops turning, settles, and the loop goes to sleep
      const live = mode !== "default" || !!labelPts || now - lastInput < 1200;
      if (live) t += dt;
      const f = dt * 60;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!ptr.seen) {
        running = false;
        return;
      }
      const damp = Math.pow(0.74, f);
      let energy = 0;
      for (let i = 0; i < N; i++) {
        home(i, t);
        const dx = ptr.x + HX - x[i];
        const dy = ptr.y + HY - y[i];
        vx[i] = (vx[i] + dx * k[i] * f) * damp;
        vy[i] = (vy[i] + dy * k[i] * f) * damp;
        x[i] += vx[i] * f;
        y[i] += vy[i] * f;
        energy += Math.abs(vx[i]) + Math.abs(vy[i]);
      }

      ctx.globalCompositeOperation = onLight ? "source-over" : "lighter";
      const L = labelPts ? labelPts.length / 2 : 0;
      for (let b = 0; b < 3; b++) {
        ctx.fillStyle = onLight ? (b === 2 ? "rgba(12,12,12,0.9)" : `rgba(${EMBER[b]},0.95)`) : `rgba(${EMBER[b]},${b === 2 ? 0.95 : 0.8})`;
        for (let i = 0; i < N; i++) {
          const isLabel = i < L;
          if ((isLabel ? 2 : col[i]) !== b) continue;
          const s = isLabel ? 1.9 : size[i];
          ctx.fillRect(x[i] - s / 2, y[i] - s / 2, s, s);
        }
      }
      // the exact hotspot
      ctx.globalCompositeOperation = "source-over";
      const hs = ptr.down ? 4 : 5;
      ctx.fillStyle = onLight ? "#0C0C0C" : "#fff4ec";
      ctx.fillRect(ptr.x - hs / 2, ptr.y - hs / 2, hs, hs);

      // keep turning while hovering something or moving; sleep when settled
      const busy = live || energy > N * 0.02;
      if (busy) raf = requestAnimationFrame(frame);
      else running = false;
    };
    const wake = () => {
      lastInput = performance.now();
      if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const surfaceAt = (px: number, py: number) => {
      const el = document.elementFromPoint(px, py);
      onLight = !!el?.closest('[data-surface="light"]');
    };

    let lightTick = 0;
    const onMove = (e: MouseEvent) => {
      if (!ptr.seen) {
        // first sighting: start the swarm on the pointer, not the corner
        for (let i = 0; i < N; i++) {
          x[i] = e.clientX;
          y[i] = e.clientY;
        }
      }
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      ptr.seen = true;
      // the surface under the pointer, checked a few times a second
      const now = performance.now();
      if (now - lightTick > 120) {
        lightTick = now;
        surfaceAt(e.clientX, e.clientY);
      }
      wake();
    };
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const field = target?.closest?.('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, [contenteditable="true"]');
      const el = target?.closest?.("[data-cursor], a, button");
      if (field) {
        mode = "text";
        label = "";
      } else if (el) {
        const m = el.getAttribute("data-cursor");
        mode = m === "view" || m === "drag" ? m : "link";
        label = el.getAttribute("data-cursor-label") || "";
      } else {
        mode = "default";
        label = "";
      }
      labelPts = label ? sampleLabel(label) : null;
      wake();
    };
    const onDown = () => {
      ptr.down = true;
      wake();
    };
    const onUp = () => {
      ptr.down = false;
      // burst outward, then the springs pull everything home
      for (let i = 0; i < N; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 3 + Math.random() * 7;
        vx[i] += Math.cos(a) * sp;
        vy[i] += Math.sin(a) * sp;
      }
      wake();
    };
    const onLeave = () => {
      ptr.seen = false;
      wake();
    };
    const onScroll = () => {
      // what is under a resting pointer changes as the page moves
      if (ptr.seen) surfaceAt(ptr.x, ptr.y);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.classList.remove("cursor-none");
    };
  }, [enabled]);

  if (!enabled) return null;
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[210]" />;
}
