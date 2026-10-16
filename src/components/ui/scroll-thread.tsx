"use client";

import { useEffect, useRef } from "react";

/*
 * ScrollThread — a stream of light that runs down the page as you scroll,
 * made of the same stuff as the hero headline: thousands of small square
 * particles.
 *
 * The stream is defined in DOCUMENT space (two layered sine waves), so it is
 * stitched to the page, while its head rides at a fixed height in the
 * viewport. Particles flow along it from tail to head inside a ribbon that
 * thickens toward the head and widens with scroll speed.
 *
 * When the head reaches a section title, part of the stream peels off and
 * writes that title in light, holds, then streams back into the head and
 * carries on. The real text is never hidden or moved: the light sits on
 * top of it and leaves. Each title is written once per visit.
 *
 * Nothing but particles: no stroke, halo or ring frames the stream.
 *
 * Two fixed canvases, pointer-events none: the stream behind the content
 * (z-1) and the writing above it (z-11, idle and blank when nothing is
 * being written). Scroll position comes from scroll events, never read in
 * the frame. Paused when the tab is hidden; skipped for reduced motion.
 */

const HEAD_AT = 0.6; // head height, as a fraction of the viewport
const TRAIL_VH = 1.35; // how much stream trails behind the head, in viewports

type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; hue: number };

/** A title being written: particle homes in document space + live state. */
type Writing = {
  n: number;
  hx: Float32Array; // home, document space
  hy: Float32Array;
  x: Float32Array; // live, document space
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  seed: Float32Array;
  c: Uint8Array; // colour bucket
  t: number;
  light: boolean; // written on a light surface
  size: number;
};

const ARRIVE = 1.05;
const HOLD = 0.75;
const LEAVE = 1.25;

export function ScrollThread() {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = backRef.current;
    const fcanvas = frontRef.current;
    if (!canvas || !fcanvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    const fctx = fcanvas.getContext("2d");
    if (!ctx || !fctx) return;

    const mobile = window.matchMedia("(max-width: 767px)").matches;
    let W = 0;
    let H = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      W = window.innerWidth;
      H = window.innerHeight;
      for (const c of [canvas, fcanvas]) {
        c.width = Math.round(W * dpr);
        c.height = Math.round(H * dpr);
        c.style.width = `${W}px`;
        c.style.height = `${H}px`;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    // Scroll position comes from scroll events, never read inside the frame:
    // reading scrollY in rAF forces a full layout whenever anything on the
    // page has touched styles that frame.
    let scrollY = window.scrollY;
    const onScroll = () => (scrollY = window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });

    let smoothY = scrollY;
    let lastY = smoothY;
    let vel = 0; // px per frame, smoothed
    let amp = 1; // weave amplitude multiplier
    let raf = 0;
    let t0 = performance.now();
    let last = t0;

    // The stream: x as a function of document y.
    const xAt = (docY: number, time: number) => {
      const k1 = (Math.PI * 2) / (H * 1.7);
      const k2 = (Math.PI * 2) / (H * 0.55);
      const spread = (mobile ? 0.3 : 0.34) * amp;
      const breath = 0.012 * Math.sin(time * 0.35);
      return W * (0.5 + spread * Math.sin(docY * k1 + 0.7) + (0.07 + breath) * Math.sin(docY * k2 + 1.9));
    };

    /* ── the ribbon's particles: each has a place along the stream (u), a
       lane across it, a size and a colour. Positions are recomputed from
       the analytic path every frame, so nothing accumulates or drifts. ── */
    const N = mobile ? 900 : 2300;
    const pu = new Float32Array(N);
    const lane = new Float32Array(N);
    const flow = new Float32Array(N);
    const psz = new Float32Array(N);
    const ph = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pu[i] = Math.random();
      // lanes bunch toward the centre (sum of two uniforms ≈ triangular)
      lane[i] = (Math.random() + Math.random() - 1) * 1.05;
      flow[i] = 0.05 + Math.random() * 0.07;
      psz[i] = (mobile ? 1.7 : 1.9) + Math.random() * (mobile ? 1.3 : 1.7);
      ph[i] = Math.random() * Math.PI * 2;
    }
    // colour buckets along the stream, tail → head; the last is the hot core
    const STREAM_RGB = ["124,58,237", "190,64,150", "235,72,80", "255,77,31", "255,138,76", "255,236,222"];
    const bucketsX: number[][] = STREAM_RGB.map(() => []);
    const bucketsY: number[][] = STREAM_RGB.map(() => []);
    const bucketsS: number[][] = STREAM_RGB.map(() => []);

    const sparks: Spark[] = [];
    const MAX_SPARKS = mobile ? 60 : 120;

    /* ── writing titles ── */
    const writings: Writing[] = [];
    const written = new WeakSet<Element>();
    let frontDirty = false;

    const sample = (el: HTMLElement): Writing | null => {
      const r = el.getBoundingClientRect();
      if (r.width < 20 || r.height < 12 || r.bottom < 0 || r.top > H) return null;
      const pad = 6;
      const w = Math.ceil(r.width) + pad * 2;
      const h = Math.ceil(r.height) + pad * 2;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const o = off.getContext("2d", { willReadFrequently: true });
      if (!o) return null;
      o.fillStyle = "#fff";
      // draw every word where the browser laid it out, in its own font
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
        const parent = node.parentElement;
        if (!parent) continue;
        const cs = getComputedStyle(parent);
        if (cs.visibility === "hidden" || cs.opacity === "0") continue;
        o.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const oo = o as CanvasRenderingContext2D & { letterSpacing?: string };
        if ("letterSpacing" in o) oo.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
        const rtl = cs.direction === "rtl";
        o.direction = rtl ? "rtl" : "ltr";
        o.textAlign = rtl ? "right" : "left";
        o.textBaseline = "alphabetic";
        const text = node.data;
        const re = /\S+/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text))) {
          range.setStart(node, m.index);
          range.setEnd(node, m.index + m[0].length);
          const wr = range.getBoundingClientRect();
          if (!wr.width) continue;
          let word = m[0];
          if (cs.textTransform === "uppercase") word = word.toUpperCase();
          const mt = o.measureText(word);
          const asc = mt.fontBoundingBoxAscent ?? parseFloat(cs.fontSize) * 0.8;
          const desc = mt.fontBoundingBoxDescent ?? parseFloat(cs.fontSize) * 0.2;
          const y = wr.top - r.top + pad + (wr.height - (asc + desc)) / 2 + asc;
          const x = (rtl ? wr.right : wr.left) - r.left + pad;
          o.fillText(word, x, y);
        }
      }
      const data = o.getImageData(0, 0, w, h).data;
      let ink = 0;
      for (let i = 3; i < data.length; i += 16) if (data[i] > 128) ink++;
      if (!ink) return null;
      const budget = mobile ? 650 : 1700;
      const step = Math.max(2, Math.round(Math.sqrt((ink * 4) / budget)));
      const hx: number[] = [];
      const hy: number[] = [];
      for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (data[(y * w + x) * 4 + 3] > 128) {
        hx.push(r.left - pad + x);
        hy.push(r.top - pad + y + scrollY);
      }
      const n = hx.length;
      const out: Writing = {
        n,
        hx: Float32Array.from(hx),
        hy: Float32Array.from(hy),
        x: new Float32Array(n),
        y: new Float32Array(n),
        vx: new Float32Array(n),
        vy: new Float32Array(n),
        seed: new Float32Array(n),
        c: new Uint8Array(n),
        t: 0,
        light: !!el.closest('[data-surface="light"]') || document.documentElement.classList.contains("light"),
        size: Math.max(1.5, Math.min(2.6, step * 0.62)),
      };
      // they leave from the head of the stream
      const hxv = xAt(smoothY + H * HEAD_AT, (performance.now() - t0) / 1000);
      const hyd = H * HEAD_AT + scrollY;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const rr = Math.random() * 26;
        out.x[i] = hxv + Math.cos(a) * rr;
        out.y[i] = hyd + Math.sin(a) * rr;
        out.vx[i] = (Math.random() - 0.5) * 2;
        out.vy[i] = (Math.random() - 0.5) * 2;
        out.seed[i] = Math.random();
        out.c[i] = (Math.random() * 3) | 0;
      }
      return out;
    };

    // Titles animate in on their own (words sliding up, lines gliding in).
    // Only write a title once it has come to rest, or the light lands where
    // the words were mid-flight; one still moving after ~1.5s is skipped.
    const moved = (n: Element) => {
      const tf = getComputedStyle(n).transform;
      return !!tf && tf !== "none" && tf !== "matrix(1, 0, 0, 1, 0, 0)";
    };
    const settled = (el: HTMLElement) => {
      // the title's own words…
      for (const n of [el, ...Array.from(el.querySelectorAll("*"))]) if (moved(n)) return false;
      // …and anything carrying it (a sheet still rising, a line gliding in)
      for (let n = el.parentElement; n && n.tagName !== "MAIN"; n = n.parentElement) if (moved(n)) return false;
      return true;
    };
    const tryWrite = (el: HTMLElement, tries: number) => {
      if (!settled(el)) {
        if (tries < 12) window.setTimeout(() => tryWrite(el, tries + 1), 130);
        return;
      }
      const w = sample(el);
      if (w) writings.push(w);
    };

    // a title is written when it crosses the head's height on the way down
    const band = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || written.has(e.target)) continue;
          // only when the title arrives from below (scrolling down)
          if (e.boundingClientRect.top < H * (HEAD_AT - 0.04)) continue;
          if (writings.length >= 2) continue;
          written.add(e.target);
          tryWrite(e.target as HTMLElement, 0);
        }
      },
      { rootMargin: `-${Math.round(HEAD_AT * 100)}% 0px -${Math.round((1 - HEAD_AT) * 100 - 3)}% 0px` }
    );
    const watched = new Set<Element>();
    const scan = () => {
      document.querySelectorAll("main section h2").forEach((h) => {
        if (watched.has(h)) return;
        const txt = (h.textContent || "").trim();
        if (!txt || txt.length > 80) return;
        watched.add(h);
        band.observe(h);
      });
    };
    scan();
    // titles re-mount on a language switch: watch for new ones
    let scanT = 0;
    const mo = new MutationObserver(() => {
      clearTimeout(scanT);
      scanT = window.setTimeout(scan, 400);
    });
    const main = document.querySelector("main");
    if (main) mo.observe(main, { childList: true, subtree: true });

    const WRITE_RGB_DARK = ["255,77,31", "255,150,90", "255,236,222"];
    const WRITE_RGB_LIGHT = ["255,77,31", "230,60,20", "255,120,60"];

    const drawWritings = (dt: number, hx: number, hy: number) => {
      if (!writings.length) {
        if (frontDirty) {
          fctx.setTransform(1, 0, 0, 1, 0, 0);
          fctx.clearRect(0, 0, fcanvas.width, fcanvas.height);
          frontDirty = false;
        }
        return;
      }
      frontDirty = true;
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fctx.clearRect(0, 0, W, H);
      const f = dt * 60;
      const headDocX = hx;
      const headDocY = hy + scrollY;
      for (let wi = writings.length - 1; wi >= 0; wi--) {
        const w = writings[wi];
        w.t += dt;
        const t = w.t;
        if (t > ARRIVE + HOLD + LEAVE + 0.4) {
          writings.splice(wi, 1);
          continue;
        }
        fctx.globalCompositeOperation = w.light ? "source-over" : "lighter";
        const rgb = w.light ? WRITE_RGB_LIGHT : WRITE_RGB_DARK;
        const s = w.size;
        // phase constants
        const a = Math.min(1, t / ARRIVE);
        const ease = a * a * (3 - 2 * a);
        const arriving = t < ARRIVE;
        const leaving = t > ARRIVE + HOLD;
        // a tight spiral from the head into the letters, not a wide cloud
        const k = arriving ? 0.014 + ease ** 2 * 0.16 : 0.22;
        const swirl = arriving ? (1 - ease) * 0.03 : 0;
        const damp = Math.pow(arriving ? 0.9 - ease * 0.12 : 0.72, f);
        const lt = leaving ? t - ARRIVE - HOLD : 0;
        for (let b = 0; b < 3; b++) {
          fctx.fillStyle = `rgba(${rgb[b]},1)`;
          for (let i = 0; i < w.n; i++) {
            if (w.c[i] !== b) continue;
            let tx = w.hx[i];
            let ty = w.hy[i];
            let alpha = 1;
            // staggered departure: each point lets go at its own moment
            const go = leaving ? Math.max(0, lt - w.seed[i] * 0.45) : 0;
            if (go > 0) {
              tx = headDocX;
              ty = headDocY;
              alpha = Math.max(0, 1 - go / (LEAVE - 0.35));
            }
            const dx = tx - w.x[i];
            const dy = ty - w.y[i];
            if (go > 0) {
              const pull = 0.02 + go * 0.05;
              w.vx[i] += dx * pull * f;
              w.vy[i] += dy * pull * f;
              w.vx[i] *= Math.pow(0.86, f);
              w.vy[i] *= Math.pow(0.86, f);
            } else {
              const sw = swirl * (0.6 + w.seed[i] * 0.8);
              w.vx[i] += (dx * k - dy * sw) * f;
              w.vy[i] += (dy * k + dx * sw) * f;
              w.vx[i] *= damp;
              w.vy[i] *= damp;
            }
            w.x[i] += w.vx[i] * f;
            w.y[i] += w.vy[i] * f;
            if (alpha <= 0.02) continue;
            // the light is brightest while it is the title
            const glow = arriving ? 0.55 + ease * 0.45 : leaving ? alpha : 1;
            fctx.globalAlpha = glow * (w.light ? 0.95 : 0.9);
            fctx.fillRect(w.x[i] - s / 2, w.y[i] - scrollY - s / 2, s, s);
          }
        }
      }
      fctx.globalAlpha = 1;
      fctx.globalCompositeOperation = "source-over";
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const time = (now - t0) / 1000;
      const light = document.documentElement.classList.contains("light");

      // Glide toward the real scroll position (frame-rate independent).
      // rAF timestamps can predate the setup time on the first frame: clamp
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      const ease = (rate: number) => 1 - Math.exp(-rate * dt);
      smoothY += (scrollY - smoothY) * ease(7);
      const dy = smoothY - lastY;
      lastY = smoothY;
      vel += (dy / Math.max(dt * 60, 0.001) - vel) * ease(6);
      const speed = Math.min(1, Math.abs(vel) / 42);
      amp += (1 + speed * 0.35 - amp) * ease(2.5);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = light ? "source-over" : "lighter";

      const headDoc = smoothY + H * HEAD_AT;
      const tailDoc = Math.max(0, headDoc - H * TRAIL_VH);
      const span = headDoc - tailDoc;
      const hx = xAt(headDoc, time);
      const hy = headDoc - smoothY;

      // the ribbon: particles flowing tail → head, thicker toward the head
      for (const b of bucketsX) b.length = 0;
      for (const b of bucketsY) b.length = 0;
      for (const b of bucketsS) b.length = 0;
      const eps = 2;
      const flowBoost = 1 + speed * 2.5;
      for (let i = 0; i < N; i++) {
        let u = pu[i] + flow[i] * dt * flowBoost;
        u -= Math.floor(u); // wrap into [0, 1)
        pu[i] = u;
        const d = tailDoc + span * u;
        const x = xAt(d, time);
        // unit normal of the curve (x(y), y)
        const slope = (xAt(d + eps, time) - xAt(d - eps, time)) / (2 * eps);
        const inv = 1 / Math.sqrt(1 + slope * slope);
        const nx = inv;
        const ny = -slope * inv;
        const half = (2.5 + 18 * Math.pow(u, 1.35)) * (1 + speed * 0.7);
        const wob = Math.sin(time * 1.7 + ph[i]) * 1.4;
        const off = lane[i] * half + wob;
        const px = x + nx * off;
        const py = d - smoothY + ny * off;
        if (py < -10 || py > H + 10) continue;
        // colour by place along the stream; the centre near the head runs hot
        let bkt = Math.min(4, Math.floor(u * 5));
        if (u > 0.82 && Math.abs(lane[i]) < 0.28) bkt = 5;
        bucketsX[bkt].push(px);
        bucketsY[bkt].push(py);
        bucketsS[bkt].push(psz[i] * (0.55 + u * 0.6));
      }
      for (let b = 0; b < STREAM_RGB.length; b++) {
        const xs = bucketsX[b];
        if (!xs.length) continue;
        const ys = bucketsY[b];
        const ss = bucketsS[b];
        // tail buckets are fainter
        const alpha = [0.3, 0.5, 0.68, 0.85, 0.93, 0.96][b] * (light ? 0.9 : 1);
        ctx.fillStyle = light && b === 5 ? `rgba(255,77,31,${alpha})` : `rgba(${STREAM_RGB[b]},${alpha})`;
        for (let i = 0; i < xs.length; i++) {
          const s = ss[i];
          ctx.fillRect(xs[i] - s / 2, ys[i] - s / 2, s, s);
        }
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
          r: 1 + Math.random() * 2,
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
        const f = dt * 60;
        s.x += s.vx * f;
        s.y += s.vy * f - dy * 0.25;
        s.vx *= Math.pow(0.97, f);
        s.vy *= Math.pow(0.97, f);
        const k = 1 - s.life / s.max;
        const col = s.hue < 0.55 ? "255,120,60" : s.hue < 0.8 ? "255,190,130" : "34,211,238";
        ctx.fillStyle = `rgba(${col},${0.9 * k})`;
        const r = s.r * k;
        ctx.fillRect(s.x - r, s.y - r, r * 2, r * 2);
      }

      // the head: a dense knot of hot particles, no halo, no ring
      ctx.globalCompositeOperation = light ? "source-over" : "lighter";
      const knot = mobile ? 36 : 64;
      const reach = 7 + speed * 6;
      for (let i = 0; i < knot; i++) {
        const a = ph[i] + time * (1.2 + (i % 5) * 0.35) * (i % 2 ? 1 : -1);
        const r = reach * Math.sqrt(((i * 0.618) % 1) * 0.9 + 0.1) * (1 + 0.25 * Math.sin(time * 3 + i));
        const s = i < 10 ? 3 : 1.8 + ((i * 7) % 3) * 0.5;
        ctx.fillStyle = i < 10 ? (light ? "rgba(255,77,31,0.95)" : "rgba(255,244,236,0.95)") : `rgba(${i % 3 ? "255,138,76" : "255,77,31"},0.85)`;
        ctx.fillRect(hx + Math.cos(a) * r - s / 2, hy + Math.sin(a) * r - s / 2, s, s);
      }
      ctx.globalCompositeOperation = "source-over";

      drawWritings(dt, hx, hy);
    };

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      band.disconnect();
      mo.disconnect();
      clearTimeout(scanT);
    };
  }, []);

  return (
    <>
      <canvas ref={backRef} aria-hidden className="pointer-events-none fixed inset-0 z-[1]" />
      <canvas ref={frontRef} aria-hidden className="pointer-events-none fixed inset-0 z-[11]" />
    </>
  );
}
