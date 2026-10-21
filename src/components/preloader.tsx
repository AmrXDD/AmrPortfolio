"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Btn } from "@/components/ui/btn";
import { CITIES, timeIn, useMinute } from "@/components/ui/studio-clocks";
import * as sfx from "@/lib/fire-sfx";
import { SITE } from "@/lib/constants";
import { useCopy, useLang } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/*
 * The Enter screen: ignition.
 *
 * A single ember draws the logo's ring as a glowing filament; the ring
 * catches and becomes the logo; the wordmark is forged in letter by letter,
 * hot then cooling; a line says where the studio is, with the cities'
 * live times; then the choice, sound or silent (the tap is what lets the
 * site play sound). On the tap the black burns away from the finger like
 * paper, an ember edge running out to the corners, while the logo glides up
 * into the top bar: the opening shot of the hero, where a lighter is rising.
 *
 * The build-up is CSS animation only (globals.css, "The Enter screen"), so the
 * main thread stays free while the hero's fire compiles behind it; the burn
 * is one short-lived 2D canvas. Returning visitors get it compressed (choice
 * in about half a second); reduced motion gets a plain fade.
 */

const COPY = {
  en: {
    where: "Based in Cairo & Kuwait · working with UK studios",
    withSound: "Enter with sound",
    silent: "Enter silent",
    hint: "Best with sound on",
  },
  ar: {
    where: "من القاهرة والكويت · أعمل مع استوديوهات في المملكة المتحدة",
    withSound: "الدخول مع الصوت",
    silent: "الدخول بدون صوت",
    hint: "التجربة أجمل مع الصوت",
  },
};

const EASE = [0.76, 0, 0.24, 1] as const;
const SEEN = "amr-intro-seen";
const MAX_SCALE = 2.6; // the logo group on the loader vs its size in the top bar
const WORD = `${SITE.name}/studio`;
// the build-up's pace (CSS --t): a first visit, and a return (same story,
// a little quicker, never skipped)
const FIRST = 1.3;
const FAST = 0.85;

/** The burn: the black backdrop burns away from (ox, oy) like paper. */
function burnAway(canvas: HTMLCanvasElement, ox: number, oy: number, onDone: () => void) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return onDone();
  const W = window.innerWidth;
  const H = window.innerHeight;
  // fire edges don't need density: 1x, less on big screens (a full-screen
  // canvas redrawn every frame while the hero starts up underneath)
  const dpr = W > 1200 ? 0.75 : 1;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const far = Math.max(Math.hypot(ox, oy), Math.hypot(W - ox, oy), Math.hypot(ox, H - oy), Math.hypot(W - ox, H - oy)) + 90;
  const ph = [Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3];
  // a ragged edge: a few slow waves round the circle, drifting as it burns
  const edge = (a: number, R: number, t: number) =>
    R * (1 + 0.1 * Math.sin(a * 3 + ph[0] + t * 2) + 0.06 * Math.sin(a * 7 + ph[1] - t * 3) + 0.035 * Math.sin(a * 13 + ph[2] + t * 5));
  const N = 96;
  const D = 1150;
  const sparks: { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number }[] = [];
  const t0 = performance.now();
  let last = t0;
  let raf = 0;

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const k = Math.min(1, (now - t0) / D);
    // it catches slowly, then runs
    const e = k * k * (3 - 2 * k);
    const R = 4 + e * far;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    if (k < 1) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        const r = edge(a, R, k);
        const x = ox + Math.cos(a) * r;
        const y = oy + Math.sin(a) * r;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.closePath();
      // char, just beyond the edge
      ctx.strokeStyle = "rgba(74,26,8,0.92)";
      ctx.lineWidth = 28;
      ctx.stroke();
      // the hole
      ctx.globalCompositeOperation = "destination-out";
      ctx.fill();
      // the burning edge, glowing over both sides
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(255,77,31,0.32)";
      ctx.lineWidth = 18;
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,138,60,0.75)";
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,232,205,0.95)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      // embers lift off the edge
      for (let i = 0; i < 3 && sparks.length < 90; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = edge(a, R, k);
        const sp = 0.6 + Math.random() * 1.6;
        sparks.push({ x: ox + Math.cos(a) * r, y: oy + Math.sin(a) * r, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.8, life: 0, max: 0.4 + Math.random() * 0.6, r: 0.7 + Math.random() * 1.6 });
      }
    }
    ctx.globalCompositeOperation = "lighter";
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life += dt;
      if (s.life >= s.max) {
        sparks.splice(i, 1);
        continue;
      }
      const f = dt * 60;
      s.x += s.vx * f;
      s.y += s.vy * f;
      s.vy -= 0.02 * f;
      const q = 1 - s.life / s.max;
      ctx.fillStyle = `rgba(255,${150 + Math.round(80 * q)},90,${0.9 * q})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * q, 0, Math.PI * 2);
      ctx.fill();
    }
    if (k < 1 || sparks.length) raf = requestAnimationFrame(frame);
    else onDone();
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

export function Preloader() {
  const c = useCopy(COPY);
  const ar = useLang().lang === "ar";
  const now = useMinute();
  const [phase, setPhase] = useState<"build" | "ready" | "exit">("build");
  const [mounted, setMounted] = useState(true);
  const [fast, setFast] = useState(false);
  const [reduce, setReduce] = useState(false);
  // the logo group: its fitted scale on this screen, and where it glides to
  const [scale, setScale] = useState(MAX_SCALE);
  // while the ring is drawn it sits centred; the wordmark then unrolls out of it
  const [shift, setShift] = useState(0);
  const [target, setTarget] = useState({ x: 0, y: 0 });
  const groupRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lockedRef = useRef(false);
  const stopBurn = useRef<(() => void) | void>(undefined);

  // Lock scroll immediately, and keep it locked until the visitor chooses.
  useEffect(() => {
    document.documentElement.classList.add("preloading");
    (window as unknown as { __lenis?: { stop?: () => void } }).__lenis?.stop?.();
    lockedRef.current = true;
    return () => {
      unlock();
      stopBurn.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fit the logo group to the screen (it must never clip on a phone), once
  // the mono face has loaded and the wordmark has its real width.
  useLayoutEffect(() => {
    const fit = () => {
      const el = groupRef.current;
      if (!el) return;
      const w = el.offsetWidth;
      if (!w) return;
      setScale(Math.min(MAX_SCALE, (window.innerWidth - 48) / w));
      setShift((w - 26) / 2);
    };
    fit();
    document.fonts?.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // The build-up runs in CSS; the choice becomes tappable when it has landed.
  useEffect(() => {
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN) === "1";
    } catch {}
    setReduce(r);
    setFast(seen);
    const t = setTimeout(() => {
      setPhase((p) => (p === "build" ? "ready" : p));
    }, r ? 300 : Math.round((1.62 * (seen ? FAST : FIRST) + 0.45) * 1000));
    return () => clearTimeout(t);
  }, []);

  function enter(sound: boolean, from: HTMLElement | null) {
    if (phase === "exit") return;
    // the glide: from the logo group's centre to the top-bar brand's centre
    // (scaling about its centre, so the centres are what must meet)
    const g = groupRef.current?.getBoundingClientRect();
    const tc = (document.querySelector('a[aria-label="Back to top"]') as HTMLElement | null)?.getBoundingClientRect();
    if (g) {
      const gx = g.left + g.width / 2;
      const gy = g.top + g.height / 2;
      setTarget(tc ? { x: tc.left + tc.width / 2 - gx, y: tc.top + tc.height / 2 - gy } : { x: 0, y: 34 - gy });
    }
    // inside the tap: this is what lets the music and the fire's sounds play
    window.dispatchEvent(new CustomEvent("ambient:start", { detail: { on: sound } }));
    // (the lighter strikes its own flint a moment later; the tap only burns)
    if (sound) sfx.burn();
    try {
      localStorage.setItem(SEEN, "1");
    } catch {}
    unlock();
    setPhase("exit");
    // the black burns away from the finger
    const canvas = canvasRef.current;
    if (canvas && !reduce) {
      const r = from?.getBoundingClientRect();
      const ox = r ? r.left + r.width / 2 : window.innerWidth / 2;
      const oy = r ? r.top + r.height / 2 : window.innerHeight * 0.66;
      stopBurn.current = burnAway(canvas, ox, oy, () => {});
    }
    // Reveal the top-bar logo exactly when the glide lands (matches the 1.05s
    // transition), then unmount the loader once the burn has cleared.
    setTimeout(() => window.dispatchEvent(new CustomEvent("brand:reveal")), 1050);
    setTimeout(() => setMounted(false), 1500);
  }

  function unlock() {
    if (!lockedRef.current) return;
    lockedRef.current = false;
    document.documentElement.classList.remove("preloading");
    (window as unknown as { __lenis?: { start?: () => void } }).__lenis?.start?.();
    window.scrollTo(0, 0);
  }

  if (!mounted) return null;

  const exiting = phase === "exit";

  return (
    <div
      className={cn("intro fixed inset-0 z-[200] overflow-hidden", fast && "fast", exiting && "exiting")}
      style={{ pointerEvents: exiting ? "none" : "auto" }}
    >
      {/* the black (it burns away on the tap; with reduced motion it fades) */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={false}
        animate={{ opacity: exiting && reduce ? 0 : 1 }}
        transition={{ duration: 0.7, ease: EASE }}
        style={{ visibility: exiting && !reduce ? "hidden" : "visible" }}
      />
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />

      {/* Centre stage: the logo + wordmark, which glides up into the top bar */}
      <div className="absolute inset-x-0 top-[38%] flex justify-center md:top-[40%]">
        {/* the glide is a CSS transition: it runs on the compositor, smooth
            even while the hero starts up on the main thread */}
        <div
          dir="ltr"
          className="flex items-center will-change-transform"
          style={{
            transform: exiting ? `translate3d(${target.x}px, ${target.y}px, 0) scale(1)` : `translate3d(0, 0, 0) scale(${scale})`,
            transition: exiting ? "transform 1.05s cubic-bezier(0.76, 0, 0.24, 1)" : "none",
          }}
        >
          <div ref={groupRef} className="intro-group flex items-center" style={{ ["--shift" as string]: `${shift}px` }}>
            <span className="relative block h-[26px] w-[26px]">
              <span aria-hidden className="intro-flash pointer-events-none absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(255,150,80,0.9),rgba(255,77,31,0.35)_40%,transparent_70%)]" />
              <span className="intro-logo block">
                <Logo size={26} />
              </span>
              {/* the filament: an ember runs once round the ring with a glowing
                  tail, then the ring catches (transform and opacity only, so it
                  stays smooth however busy the page is underneath) */}
              <span aria-hidden className="intro-filament pointer-events-none absolute inset-0">
                <span className="intro-track absolute inset-0 rounded-full" />
                <span className="intro-orbit absolute inset-0">
                  <span className="intro-tail absolute inset-0 rounded-full" />
                  <span className="absolute left-1/2 top-[1.5px] h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(255,120,40,0.5)]" />
                  <span className="absolute left-1/2 top-[1.5px] h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff4e6]" />
                </span>
              </span>
            </span>
            <span className="ms-[10px] block whitespace-nowrap text-mono text-[11px] uppercase tracking-[0.24em] text-[#f5f5f5]">
              <span className="sr-only">{WORD}</span>
              {[...WORD].map((ch, i) => (
                <span key={i} aria-hidden data-ch={ch} className="intro-ch relative inline-block" style={{ ["--i" as string]: i }}>
                  {ch}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* where, when, and the choice */}
      <div
        className="intro-ui absolute inset-x-0 top-[50%] flex flex-col items-center px-6 text-center md:top-[52%]"
        style={{ pointerEvents: phase === "ready" ? "auto" : "none" }}
      >
        <p className="intro-rise max-w-[320px] text-balance text-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-[#F5F5F5]/55 sm:max-w-none" style={{ ["--d" as string]: "1.42s" }}>
          {c.where}
        </p>
        <p dir="ltr" className="intro-rise mt-2.5 text-mono text-[10px] uppercase tracking-[0.16em] text-[#F5F5F5]/35" style={{ ["--d" as string]: "1.52s" }}>
          {CITIES.map((city, i) => (
            <span key={city.tz}>
              {i ? <span className="mx-2 text-[#FF4D1F]/70">·</span> : null}
              {ar ? city.ar : city.en} <span className="tabular-nums text-[#F5F5F5]/70">{now ? timeIn(city.tz, now) : "--:--"}</span>
            </span>
          ))}
        </p>

        <div className="intro-rise mt-8 flex w-full max-w-[300px] flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center" style={{ ["--d" as string]: "1.62s" }}>
          <Btn
            variant="ember"
            magnetic={false}
            className="justify-between"
            icon={<Volume2 size={17} strokeWidth={1.8} className="rtl:-scale-x-100" />}
            onClick={(e) => enter(true, e.currentTarget)}
          >
            {c.withSound}
          </Btn>
          <Btn
            variant="ghost"
            magnetic={false}
            className="justify-between !bg-transparent ![--bone-rgb:245_245_245]"
            icon={<VolumeX size={17} strokeWidth={1.8} className="rtl:-scale-x-100" />}
            onClick={(e) => enter(false, e.currentTarget)}
          >
            {c.silent}
          </Btn>
        </div>
        <span className="intro-rise mt-4 text-mono text-[9px] uppercase tracking-[0.3em] text-[#F5F5F5]/35" style={{ ["--d" as string]: "1.72s" }}>
          {c.hint}
        </span>
      </div>
    </div>
  );
}
