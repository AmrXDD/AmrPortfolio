"use client";

import { motion, useInView, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useIsMobile } from "@/lib/use-mobile";
import { useCopy, useLang } from "@/lib/i18n";

/*
 * Full Stack · "The Line". The whole stack drawn as a metro map: one line,
 * six stations, from what you see down to what runs it. Scroll drives a
 * train along the line; each station lights as it arrives and its sign
 * comes up in both scripts (the way Gulf metro signage reads), while a
 * split-flap departures board flips, letter by letter, to the station and
 * its tech. Phones get the same line, vertical.
 */

const COPY = {
  en: {
    eyebrow: "Full Stack",
    h1: "One developer,",
    h2: "the whole stack.",
    sub: "Every layer, end to end, shipped by one pair of hands.",
    line: "Line 01 · The whole stack",
    station: "Station",
    stack: "Stack",
    stop: "Stop",
    next: "Next",
    end: "Terminus",
    you: "You are here",
  },
  ar: {
    eyebrow: "كامل الطبقات",
    h1: "مطوّر واحد،",
    h2: "لكل الطبقات.",
    sub: "كل طبقة من البداية إلى النهاية، ينفّذها شخص واحد.",
    line: "الخط 01 · كل الطبقات",
    station: "المحطة",
    stack: "التقنيات",
    stop: "التوقّف",
    next: "التالية",
    end: "نهاية الخط",
    you: "أنت هنا",
  },
};

/* the line runs from the surface down to the metal */
const STATIONS = [
  { en: "Motion & 3D", ar: "الحركة والأبعاد الثلاثية", tech: "Framer · R3F · GLSL" },
  { en: "Frontend", ar: "الواجهة الأمامية", tech: "React · Next.js · Tailwind" },
  { en: "API / Edge", ar: "الواجهات البرمجية / Edge", tech: "REST · tRPC · Server Actions" },
  { en: "Backend", ar: "الخادم", tech: "Node · RSC · Streaming" },
  { en: "Database", ar: "قاعدة البيانات", tech: "Postgres · Supabase · Prisma" },
  { en: "Infra / DevOps", ar: "البنية التحتية / DevOps", tech: "Vercel · CI/CD · Docker" },
];

const EMBER = "#FF4D1F";

/* metro geometry: only horizontals and 45° bends, on a 1200 × 470 board */
const VB_W = 1200;
const VB_H = 470;
const PTS_LTR: [number, number][] = [
  [110, 120],
  [360, 120],
  [490, 250],
  [720, 250],
  [850, 380],
  [1090, 380],
];
// signs sit above or below their station, alternating, so they never collide
const SIGN_SIDE: ("up" | "down")[] = ["down", "up", "down", "up", "down", "up"];

/* ── split-flap board ─────────────────────────────────────────────────── */
const CHARSET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&/·.-";

function Flap({ ch, delay }: { ch: string; delay: number }) {
  // a short burst of random flips, then it lands: reads like a real board
  // without walking the whole alphabet (and re-rendering) every change
  const [shown, setShown] = useState(ch);
  const first = useRef(true);
  useEffect(() => {
    const tgt = CHARSET.includes(ch) ? ch : " ";
    if (first.current) {
      first.current = false;
      setShown(tgt);
      return;
    }
    let n = 4 + Math.floor(Math.random() * 5);
    let id = 0;
    const start = window.setTimeout(() => {
      id = window.setInterval(() => {
        n -= 1;
        if (n <= 0) {
          setShown(tgt);
          clearInterval(id);
        } else setShown(CHARSET[1 + Math.floor(Math.random() * (CHARSET.length - 1))]);
      }, 46);
    }, delay);
    return () => {
      clearTimeout(start);
      clearInterval(id);
    };
  }, [ch, delay]);
  return (
    <span className="relative inline-flex h-[1.9em] w-[1.18em] items-center justify-center overflow-hidden rounded-[3px] bg-[#141414] text-chalk shadow-[inset_0_-1px_0_rgba(255,255,255,0.06),0_1px_0_rgba(0,0,0,0.6)] [perspective:120px]">
      <span key={shown} className="flap-in inline-block">
        {shown === " " ? "\u00a0" : shown}
      </span>
      {/* the split */}
      <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/80" />
    </span>
  );
}

function FlapRow({ text, len, className = "" }: { text: string; len: number; className?: string }) {
  const s = text.toUpperCase().padEnd(len, " ").slice(0, len);
  return (
    <span dir="ltr" className={`inline-flex gap-[2px] font-mono font-semibold ${className}`}>
      {s.split("").map((c, i) => (
        <Flap key={i} ch={c} delay={i * 18} />
      ))}
    </span>
  );
}

/* ── desktop: the map ─────────────────────────────────────────────────── */
function MetroMap() {
  const c = useCopy(COPY);
  const { lang } = useLang();
  const ar = lang === "ar";
  const reduce = !!useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const path = useRef<SVGPathElement>(null);
  const train = useRef<SVGGElement>(null);
  const [at, setAt] = useState(-1); // last station reached
  const [len, setLen] = useState(0);
  const [stops, setStops] = useState<number[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  const seen = useInView(stage, { once: true, amount: 0.4 });

  // mirror the map for Arabic so the train runs in reading direction
  const pts = useMemo(() => PTS_LTR.map(([x, y]) => [ar ? VB_W - x : x, y] as [number, number]), [ar]);
  const d = useMemo(() => `M${pts.map(([x, y]) => `${x},${y}`).join(" L")}`, [pts]);

  // measure the route once: total length and where along it each station sits
  useLayoutEffect(() => {
    const p = path.current;
    if (!p) return;
    const total = p.getTotalLength();
    const samples = 600;
    const at: number[] = pts.map(([sx, sy]) => {
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i <= samples; i++) {
        const l = (total * i) / samples;
        const q = p.getPointAtLength(l);
        const dd = (q.x - sx) ** 2 + (q.y - sy) ** 2;
        if (dd < bestD) {
          bestD = dd;
          best = l;
        }
      }
      return best;
    });
    setLen(total);
    setStops(at);
  }, [d, pts]);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  // a little dwell at both ends, then the run
  const run = useTransform(scrollYProgress, [0.06, 0.9], [0, 1], { clamp: true });
  const p = useSpring(run, { stiffness: 90, damping: 24, mass: 0.6 });
  const dash = useTransform(p, (v) => (len ? len * (1 - (reduce ? 1 : v)) : 0));

  const place = (v: number) => {
    const pth = path.current;
    const g = train.current;
    if (!pth || !g || !len) return;
    const l = Math.max(0.01, Math.min(len - 0.01, v * len));
    const a = pth.getPointAtLength(Math.max(0, l - 4));
    const b = pth.getPointAtLength(Math.min(len, l + 4));
    const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    const q = pth.getPointAtLength(l);
    g.setAttribute("transform", `translate(${q.x} ${q.y}) rotate(${ang})`);
    let reached = -1;
    for (let i = 0; i < stops.length; i++) if (l >= stops[i] - 6) reached = i;
    setAt((cur) => (cur === reached ? cur : reached));
  };
  useMotionValueEvent(p, "change", place);
  useEffect(() => place(reduce ? 1 : p.get()), [len, stops, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  const cur = Math.max(0, at);
  const nextI = Math.min(STATIONS.length - 1, cur + 1);
  const st = STATIONS[cur];
  const terminus = at >= STATIONS.length - 1;

  return (
    <section id="stack" ref={section} className="relative bg-ink" style={{ height: reduce ? "auto" : "330vh" }}>
      <div ref={stage} className={`${reduce ? "relative py-24" : "sticky top-0 h-screen"} flex flex-col overflow-hidden`}>
        {/* engineering-paper grid */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:linear-gradient(rgb(var(--bone-rgb)/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--bone-rgb)/0.05)_1px,transparent_1px)] [background-size:48px_48px]" />

        {/* heading + legend */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1600px] items-start justify-between gap-8 px-10 pt-24 lg:pt-28">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={seen ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
            <Eyebrow index="01">{c.eyebrow}</Eyebrow>
            <h2 className="mt-4 max-w-md text-display text-[clamp(1.75rem,3.6vw,3.25rem)] leading-[0.98] text-bone rtl:leading-[1.35]">
              {c.h1} <span className="italic text-bone/70">{c.h2}</span>
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-bone/55">{c.sub}</p>
          </motion.div>

          {/* the departures board (it doubles as the legend) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={seen ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hidden w-fit shrink-0 rounded-xl border border-white/10 bg-[#0a0a0a] p-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] lg:block"
          >
            <div className="flex items-center justify-between gap-6 border-b border-white/10 pb-2 text-mono text-[9px] uppercase tracking-[0.24em] text-chalk/45 rtl:tracking-normal">
              <span className="flex items-center gap-2">
                <span className="h-[5px] w-6 rounded-full" style={{ background: EMBER }} />
                {c.line}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                {terminus ? c.end : `${c.next} · 0${nextI + 1}`}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
              <span className="text-mono text-[9px] uppercase tracking-[0.2em] text-chalk/50 rtl:tracking-normal">{c.station}</span>
              <FlapRow text={st.en} len={14} className="text-[15px]" />
              <span className="text-mono text-[9px] uppercase tracking-[0.2em] text-chalk/50 rtl:tracking-normal">{c.stack}</span>
              <FlapRow text={st.tech} len={28} className="text-[11px]" />
              <span className="text-mono text-[9px] uppercase tracking-[0.2em] text-chalk/50 rtl:tracking-normal">{c.stop}</span>
              <div className="flex items-center gap-4">
                <FlapRow text={`0${cur + 1}/06`} len={5} className="text-[11px]" />
                <motion.span
                  key={st.ar}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  dir="rtl"
                  lang="ar"
                  className="text-[14px] text-accent"
                  style={{ fontFamily: "var(--font-ar-sans), sans-serif" }}
                >
                  {st.ar}
                </motion.span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* the map */}
        <div className="relative z-0 mx-auto flex w-full max-w-[1600px] flex-1 items-center px-6">
          <div className="relative mx-auto" style={{ aspectRatio: `${VB_W} / ${VB_H}`, width: `min(100%, calc(54vh * ${VB_W / VB_H}))` }}>
            <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
              <defs>
                <filter id="train-glow" x="-50%" y="-200%" width="200%" height="500%">
                  <feGaussianBlur stdDeviation="6" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* the line, drawn in on arrival */}
              <motion.path
                d={d}
                fill="none"
                style={{ stroke: "rgb(var(--bone-rgb) / 0.14)" }}
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: reduce ? 1 : 0 }}
                animate={seen ? { pathLength: 1 } : {}}
                transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1] }}
              />
              {/* the travelled stretch */}
              <motion.path
                ref={path}
                d={d}
                fill="none"
                stroke={EMBER}
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={len || 1}
                style={{ strokeDashoffset: dash }}
              />
              {/* stations */}
              {pts.map(([x, y], i) => {
                const lit = i <= at;
                const here = i === at;
                return (
                  <g key={i} transform={`translate(${x} ${y})`}>
                    {here ? <circle r="30" fill="rgba(255,77,31,0.18)" className="animate-ping [transform-box:fill-box] [transform-origin:center]" /> : null}
                    <circle r="17" strokeWidth="5" style={{ fill: lit ? EMBER : "rgb(var(--ink-rgb))", stroke: lit ? "#fff4ec" : "rgb(var(--bone-rgb) / 0.7)", transition: "fill .4s, stroke .4s" }} />
                  </g>
                );
              })}
              {/* the train */}
              <g ref={train} filter="url(#train-glow)">
                <rect x="-30" y="-11" width="60" height="22" rx="11" fill={EMBER} />
                {[-16, -4, 8].map((wx) => (
                  <rect key={wx} x={wx} y="-5" width="8" height="10" rx="2" fill="#fff4ec" opacity="0.9" />
                ))}
                <circle cx="24" cy="0" r="3" fill="#fff4ec" />
              </g>
            </svg>

            {/* station signs: both scripts, always */}
            {pts.map(([x, y], i) => {
              const s = STATIONS[i];
              const lit = i <= at;
              const here = i === at;
              const up = SIGN_SIDE[i] === "up";
              return (
                <motion.div
                  key={s.en}
                  className="pointer-events-none absolute"
                  style={{ left: `${(x / VB_W) * 100}%`, top: `${(y / VB_H) * 100}%`, x: "-50%" }}
                  initial={false}
                  animate={{ opacity: lit ? (here ? 1 : 0.55) : 0.22, y: up ? (lit ? -96 : -84) : lit ? 34 : 22 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className={`w-max min-w-[150px] overflow-hidden rounded-md border ${here ? "border-accent/60" : "border-line"} bg-ash shadow-[0_10px_30px_-14px_rgba(0,0,0,0.5)]`}>
                    <div className="h-[5px]" style={{ background: lit ? EMBER : "rgb(var(--bone-rgb) / 0.18)" }} />
                    <div className="px-3 py-2">
                      <div className="flex items-baseline justify-between gap-4">
                        <span dir="ltr" className="text-[13px] font-semibold tracking-wide text-bone">
                          {s.en}
                        </span>
                        <span dir="ltr" className="font-mono text-[9px] text-bone/40">
                          0{i + 1}
                        </span>
                      </div>
                      <p dir="rtl" lang="ar" className="text-[13px] text-bone/80" style={{ fontFamily: "var(--font-ar-sans), sans-serif" }}>
                        {s.ar}
                      </p>
                      <p dir="ltr" className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-bone/45">
                        {s.tech}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}

/* ── phones: the same line, vertical ─────────────────────────────────── */
function MetroVertical() {
  const c = useCopy(COPY);
  const list = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: list, offset: ["start 0.65", "end 0.55"] });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 26 });
  const top = useTransform(p, (v) => `${Math.min(100, Math.max(0, v * 100))}%`);
  const [at, setAt] = useState(-1);
  useMotionValueEvent(p, "change", (v) => {
    const r = v <= 0.001 ? -1 : Math.min(STATIONS.length - 1, Math.floor(v * (STATIONS.length - 1) + 0.05));
    setAt((cur) => (cur === r ? cur : r));
  });

  return (
    <section id="stack" className="relative border-b border-line bg-ink px-5 py-24">
      <div className="mx-auto max-w-[560px]">
        <Eyebrow index="01">{c.eyebrow}</Eyebrow>
        <h2 className="mt-5 text-display size-h2 text-bone">
          {c.h1} <span className="italic text-bone/70">{c.h2}</span>
        </h2>
        <p className="mt-3 text-mono text-[10px] uppercase tracking-[0.2em] text-bone/45">{c.line}</p>

        <div ref={list} className="relative mt-10 ps-12">
          {/* the line */}
          <div className="absolute bottom-6 start-[18px] top-6 w-[8px] rounded-full bg-bone/15" />
          <motion.div className="absolute start-[18px] top-6 w-[8px] origin-top rounded-full" style={{ height: top, background: EMBER }} />
          {/* the train */}
          <motion.div className="absolute start-[10px] z-10 -mt-3 h-6 w-6 rounded-full shadow-[0_0_18px_rgba(255,77,31,0.9)]" style={{ top, background: EMBER }}>
            <span className="absolute inset-[6px] rounded-full bg-[#fff4ec]" />
          </motion.div>

          <div className="space-y-6">
            {STATIONS.map((s, i) => {
              const lit = i <= at;
              return (
                <div key={s.en} className="relative">
                  <span
                    className="absolute -start-[38px] top-4 h-5 w-5 rounded-full border-[4px] transition-colors duration-300"
                    style={{ background: lit ? EMBER : "rgb(var(--ink-rgb))", borderColor: lit ? "#fff4ec" : "rgb(var(--bone-rgb) / 0.7)" }}
                  />
                  <div className={`overflow-hidden rounded-md border bg-ash transition-opacity duration-300 ${lit ? "border-accent/50 opacity-100" : "border-line opacity-50"}`}>
                    <div className="h-[4px]" style={{ background: lit ? EMBER : "rgb(var(--bone-rgb) / 0.18)" }} />
                    <div className="px-3 py-2.5">
                      <p dir="ltr" className="text-[14px] font-semibold text-bone">
                        {s.en}
                      </p>
                      <p dir="rtl" lang="ar" className="text-[13px] text-bone/80" style={{ fontFamily: "var(--font-ar-sans), sans-serif" }}>
                        {s.ar}
                      </p>
                      <p dir="ltr" className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-bone/45">
                        {s.tech}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FullStack() {
  const isMobile = useIsMobile();
  return isMobile ? <MetroVertical /> : <MetroMap />;
}
