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
 * hidden, and skipped entirely for prefers-reduced-motion. Phones get a
 * lighter cut: 1x density, fewer points, it sleeps when nothing moves, it
 * ignores the URL bar resizing the screen, and it rises out of the hero
 * instead of sitting on its copy.
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
    const touch = window.matchMedia("(pointer: coarse)").matches;
    // lean: phones, and weak machines once the governor says so (html.lite)
    let lean = mobile || document.documentElement.classList.contains("lite");
    let P = lean ? 64 : POINTS;
    let W = 0;
    let H = 0;
    let dpr = 1;
    const resize = () => {
      // a phone's URL bar showing/hiding changes only the height a little:
      // keep the canvas (re-allocating it, and the thread's wavelength
      // jumping with it, read as a glitch)
      if (touch && W && window.innerWidth === W && Math.abs(window.innerHeight - H) < 160) return;
      dpr = Math.min(lean ? 1 : 1.5, window.devicePixelRatio || 1);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
    };
    resize();
    window.addEventListener("resize", resize);
    const goLean = () => {
      if (lean) return;
      lean = true;
      P = 64;
      W = 0; // force the canvas down to 1x
      resize();
    };
    window.addEventListener("perf:lite", goLean);

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

    // Scroll position comes from scroll events, never read inside the frame:
    // reading scrollY in rAF forces a full layout whenever anything on the
    // page has touched styles that frame (the marquees do, every frame).
    let scrollY = window.scrollY;
    const onScroll = () => {
      scrollY = window.scrollY;
      wake();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // In RTL the page reads from the right, and the hero title sits on the
    // right; the comet's path mirrors with it so it keeps to the open side
    // instead of cutting through the words. A language switch glides it over.
    const html = document.documentElement;
    let mirrorTarget = html.dir === "rtl" ? 1 : 0;
    let mirror = mirrorTarget;
    // (a theme change also wakes a sleeping comet, to redraw in its colours)
    const dirMo = new MutationObserver(() => {
      mirrorTarget = html.dir === "rtl" ? 1 : 0;
      wake();
    });
    dirMo.observe(html, { attributes: true, attributeFilter: ["dir", "class"] });

    let smoothY = scrollY;
    let lastY = smoothY;
    let vel = 0; // px per frame, smoothed
    let amp = 1; // weave amplitude multiplier
    let lastHeadDoc = smoothY + H * HEAD_AT;
    const sparks: Spark[] = [];
    const ripples: Ripple[] = [];
    let raf = 0;
    let t0 = performance.now();
    let last = t0;
    // phones: when nothing has moved for a moment, stop drawing until a scroll
    let sleeping = false;
    let stillFor = 0;
    function wake() {
      if (!sleeping || document.hidden) return;
      sleeping = false;
      stillFor = 0;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    // The thread: x as a function of document y.
    const xAt = (docY: number, time: number) => {
      const k1 = (Math.PI * 2) / (H * 1.7);
      const k2 = (Math.PI * 2) / (H * 0.55);
      const spread = (mobile ? 0.3 : 0.34) * amp;
      // a slow, page-anchored breath (no per-frame wobble: that read as shimmer)
      const breath = 0.012 * Math.sin(time * 0.35);
      const x = W * (0.5 + spread * Math.sin(docY * k1 + 0.7) + (0.07 + breath) * Math.sin(docY * k2 + 1.9));
      return x + (W - 2 * x) * mirror;
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const time = (now - t0) / 1000;
      const light = document.documentElement.classList.contains("light");

      // Glide toward the real scroll position. Frame-rate independent
      // (exponential smoothing on real elapsed time), so 60Hz and 120Hz
      // screens follow at the same pace and nothing steps.
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const ease = (rate: number) => 1 - Math.exp(-rate * dt);
      const y = scrollY;
      smoothY += (y - smoothY) * ease(7);
      mirror += (mirrorTarget - mirror) * ease(2.6);
      const dy = smoothY - lastY;
      lastY = smoothY;
      vel += (dy / Math.max(dt * 60, 0.001) - vel) * ease(6);
      const speed = Math.min(1, Math.abs(vel) / 42);
      amp += (1 + speed * 0.35 - amp) * ease(2.5);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      if (lean) {
        // asleep once still (no scroll glide, sparks, ripples or mirroring)
        const still = Math.abs(y - smoothY) < 0.5 && Math.abs(dy) < 0.05 && !sparks.length && !ripples.length && Math.abs(mirrorTarget - mirror) < 0.002;
        stillFor = still ? stillFor + dt : 0;
        if (stillFor > 0.8) sleeping = true;
      }
      // phones: on the hero the fire is the show, and the head would sit on
      // the copy; the comet rises in over the first half-screen of scroll
      const vis = mobile ? Math.min(1, Math.max(0, smoothY / (H * 0.5))) : 1;
      if (vis <= 0) {
        if (sleeping) cancelAnimationFrame(raf);
        return;
      }
      ctx.globalAlpha = vis;
      ctx.globalCompositeOperation = light ? "source-over" : "lighter";

      const headDoc = smoothY + H * HEAD_AT;
      const tailDoc = Math.max(0, headDoc - H * TRAIL_VH);

      // path points, tail → head, in viewport space
      const pts: [number, number][] = [];
      for (let i = 0; i <= P; i++) {
        const d = tailDoc + ((headDoc - tailDoc) * i) / P;
        pts.push([xAt(d, time), d - smoothY]);
      }

      // Trail: one continuous curve (midpoint quadratics, no joints), drawn
      // in a few passes that each start further along — wide soft glow,
      // a mid body, a thin bright core — so it tapers without the bright
      // beads that overlapping segment caps used to leave.
      const trace = (from: number) => {
        ctx.beginPath();
        ctx.moveTo(pts[from][0], pts[from][1]);
        for (let i = from + 1; i < P; i++) {
          const mx = (pts[i][0] + pts[i + 1][0]) / 2;
          const my = (pts[i][1] + pts[i + 1][1]) / 2;
          ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
        }
        ctx.lineTo(pts[P][0], pts[P][1]);
      };
      const fade = (from: number, alpha: number) => {
        const g = ctx.createLinearGradient(pts[from][0], pts[from][1], pts[P][0], pts[P][1]);
        g.addColorStop(0, "rgba(124,58,237,0)");
        g.addColorStop(0.55, `rgba(214,70,110,${alpha * 0.55})`);
        g.addColorStop(1, `rgba(255,77,31,${alpha})`);
        return g;
      };
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const passes: [number, number, number][] = [
        // [start point, width, alpha]
        [0, 16 + speed * 8, light ? 0.1 : 0.16],
        [Math.round(P * 0.35), 5 + speed * 2, light ? 0.3 : 0.38],
        [0, 1.4, light ? 0.8 : 0.9],
        [Math.round(P * 0.7), 2.6, light ? 0.85 : 0.95],
      ];
      for (const [from, width, alpha] of passes) {
        trace(from);
        ctx.strokeStyle = fade(from, alpha);
        ctx.lineWidth = width;
        ctx.stroke();
      }

      const [hx, hy] = pts[P];

      // section ripples, dropped as the head crosses a section top
      for (const top of sectionTops) {
        if ((lastHeadDoc < top && headDoc >= top) || (lastHeadDoc > top && headDoc <= top)) {
          ripples.push({ x: xAt(top, time), y: top, t: 0 });
        }
      }
      lastHeadDoc = headDoc;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.t += dt;
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
        s.life += dt;
        if (s.life >= s.max) {
          sparks.splice(i, 1);
          continue;
        }
        const f = dt * 60; // per-60Hz-frame units
        s.x += s.vx * f;
        s.y += s.vy * f - dy * 0.25; // drift with the page a little
        s.vx *= Math.pow(0.97, f);
        s.vy *= Math.pow(0.97, f);
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

      // the ring orbits on time alone (no scroll term): a steady, even spin
      const spin = time * 1.1;
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
      ctx.arc(hx, hy, 9 + speed * 3, spin, spin + Math.PI * 1.5);
      ctx.stroke();
      ctx.globalAlpha = 1;
      if (sleeping) cancelAnimationFrame(raf);
    };

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        t0 = performance.now() - 0;
        sleeping = false;
        stillFor = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("perf:lite", goLean);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      ro.disconnect();
      dirMo.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[1]" />;
}
