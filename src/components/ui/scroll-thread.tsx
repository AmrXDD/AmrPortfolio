"use client";

import { useEffect, useRef } from "react";

/*
 * ScrollThread — a comet that draws a glowing thread down the page as you
 * scroll.
 *
 * The thread is defined in DOCUMENT space (two layered sine waves), so it is
 * stitched to the page and scrolls with it, while the comet's head rides at a
 * fixed height in the viewport, drawing the newest stretch. Scroll speed bends
 * it: fast flicks widen the weave and the head sheds sparks; at rest it
 * breathes. Crossing into a new section drops an expanding ripple.
 *
 * One fixed 2D canvas behind the content (pointer-events: none), ~120 path
 * points + ≤140 particles a frame, DPR capped at 1.5, paused when the tab is
 * hidden, and skipped entirely for prefers-reduced-motion.
 */

const HEAD_AT = 0.6; // head height, as a fraction of the viewport
const TRAIL_VH = 1.35; // how much thread trails behind the head, in viewports
const POINTS = 120;
const MAX_SPARKS = 140;

type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; hue: number };
type Ripple = { x: number; y: number; t: number };

export function ScrollThread() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mobile = window.matchMedia("(max-width: 767px)").matches;
    let W = 0;
    let H = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    // Section tops in document space, for the ripples.
    let sectionTops: number[] = [];
    const measureSections = () => {
      sectionTops = Array.from(document.querySelectorAll("main > section, main > footer"))
        .map((el) => (el as HTMLElement).getBoundingClientRect().top + window.scrollY)
        .filter((y) => y > 40);
    };
    measureSections();
    const ro = new ResizeObserver(measureSections);
    ro.observe(document.body);

    let smoothY = window.scrollY;
    let lastY = smoothY;
    let vel = 0; // px per frame, smoothed
    let amp = 1; // weave amplitude multiplier
    let lastHeadDoc = smoothY + H * HEAD_AT;
    const sparks: Spark[] = [];
    const ripples: Ripple[] = [];
    let raf = 0;
    let t0 = performance.now();

    // The thread: x as a function of document y.
    const xAt = (docY: number, time: number) => {
      const k1 = (Math.PI * 2) / (H * 1.7);
      const k2 = (Math.PI * 2) / (H * 0.55);
      const spread = (mobile ? 0.3 : 0.34) * amp;
      const wobble = 0.05 * Math.sin(time * 0.6 + docY * 0.002);
      return W * (0.5 + spread * Math.sin(docY * k1 + 0.7) + (0.07 + wobble) * Math.sin(docY * k2 + 1.9));
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const time = (now - t0) / 1000;
      const light = document.documentElement.classList.contains("light");

      // glide toward the real scroll position; speed bends the thread
      const y = window.scrollY;
      smoothY += (y - smoothY) * 0.14;
      const dy = smoothY - lastY;
      lastY = smoothY;
      vel += (dy - vel) * 0.2;
      const speed = Math.min(1, Math.abs(vel) / 38);
      amp += (1 + speed * 0.55 - amp) * 0.08;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = light ? "source-over" : "lighter";

      const headDoc = smoothY + H * HEAD_AT;
      const tailDoc = Math.max(0, headDoc - H * TRAIL_VH);

      // path points, tail → head, in viewport space
      const pts: [number, number][] = [];
      for (let i = 0; i <= POINTS; i++) {
        const d = tailDoc + ((headDoc - tailDoc) * i) / POINTS;
        pts.push([xAt(d, time), d - smoothY]);
      }

      // trail: chunks with rising alpha + width; violet tail → ember head
      const CH = 6;
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < POINTS; i += CH) {
          const f = i / POINTS; // 0 tail … 1 head
          const a = Math.pow(f, 1.6);
          ctx.beginPath();
          ctx.moveTo(pts[i][0], pts[i][1]);
          for (let j = i + 1; j <= Math.min(POINTS, i + CH); j++) ctx.lineTo(pts[j][0], pts[j][1]);
          const r = Math.round(124 + (255 - 124) * f);
          const g = Math.round(58 + (77 - 58) * f);
          const b = Math.round(237 + (31 - 237) * f);
          if (pass === 0) {
            // soft glow underlay
            ctx.strokeStyle = `rgba(${r},${g},${b},${(light ? 0.1 : 0.14) * a})`;
            ctx.lineWidth = 10 + 10 * f + speed * 8;
          } else {
            ctx.strokeStyle = `rgba(${r},${g},${b},${(light ? 0.75 : 0.85) * a})`;
            ctx.lineWidth = 0.6 + 2.2 * f;
          }
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
        }
      }

      const [hx, hy] = pts[POINTS];

      // section ripples, dropped as the head crosses a section top
      for (const top of sectionTops) {
        if ((lastHeadDoc < top && headDoc >= top) || (lastHeadDoc > top && headDoc <= top)) {
          ripples.push({ x: xAt(top, time), y: top, t: 0 });
        }
      }
      lastHeadDoc = headDoc;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.t += 1 / 60;
        if (rp.t > 1.4) {
          ripples.splice(i, 1);
          continue;
        }
        const k = rp.t / 1.4;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y - smoothY, 6 + k * 70, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,140,90,${0.55 * (1 - k)})`;
        ctx.lineWidth = 1.5 * (1 - k) + 0.3;
        ctx.stroke();
      }

      // sparks shed by the head, more when moving fast
      const emit = (mobile ? 1 : 2) * speed * 3 + (Math.random() < 0.08 ? 1 : 0);
      for (let i = 0; i < emit && sparks.length < MAX_SPARKS; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 0.4 + Math.random() * 1.6 * (0.5 + speed);
        sparks.push({
          x: hx,
          y: hy,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - Math.sign(vel) * speed * 1.5,
          life: 0,
          max: 0.6 + Math.random() * 0.9,
          r: 0.6 + Math.random() * 1.8,
          hue: Math.random(),
        });
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += 1 / 60;
        if (s.life >= s.max) {
          sparks.splice(i, 1);
          continue;
        }
        s.x += s.vx;
        s.y += s.vy - dy * 0.25; // drift with the page a little
        s.vx *= 0.97;
        s.vy *= 0.97;
        const k = 1 - s.life / s.max;
        const col = s.hue < 0.55 ? "255,120,60" : s.hue < 0.8 ? "255,190,130" : "34,211,238";
        ctx.fillStyle = `rgba(${col},${0.9 * k})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * k, 0, Math.PI * 2);
        ctx.fill();
      }

      // the head: hot core, soft halo, and the brand ring orbiting it
      const pulse = 1 + 0.12 * Math.sin(time * 3) + speed * 0.5;
      const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, 34 * pulse);
      halo.addColorStop(0, light ? "rgba(255,77,31,0.55)" : "rgba(255,170,120,0.75)");
      halo.addColorStop(0.35, "rgba(255,77,31,0.28)");
      halo.addColorStop(1, "rgba(124,58,237,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(hx, hy, 34 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = light ? "#ff4d1f" : "#fff4ec";
      ctx.beginPath();
      ctx.arc(hx, hy, 3.2, 0, Math.PI * 2);
      ctx.fill();

      const spin = time * 1.4 + smoothY * 0.004;
      const anyCtx = ctx as CanvasRenderingContext2D & {
        createConicGradient?: (a: number, x: number, y: number) => CanvasGradient;
      };
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = anyCtx.createConicGradient
        ? (() => {
            const g = anyCtx.createConicGradient!(spin, hx, hy);
            g.addColorStop(0, "rgba(255,77,31,0.95)");
            g.addColorStop(0.38, "rgba(124,58,237,0.9)");
            g.addColorStop(0.68, "rgba(34,211,238,0.9)");
            g.addColorStop(1, "rgba(255,77,31,0.95)");
            return g;
          })()
        : "rgba(255,77,31,0.9)";
      ctx.beginPath();
      ctx.arc(hx, hy, 9 + speed * 4, spin, spin + Math.PI * 1.5);
      ctx.stroke();
    };

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        t0 = performance.now() - 0;
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[1]" />;
}
