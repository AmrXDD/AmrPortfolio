"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { PROCESS } from "@/lib/constants";
import { useCopy, useLang } from "@/lib/i18n";

/*
 * Process · the method, on the warm-white sheet. The section pins; scroll
 * walks the five beats. A giant numeral rolls inside a five-segment dial,
 * the beat's name and note swap in, and the right-hand card plays a live
 * artefact for each beat: the brief being read, the frame closing on one
 * idea, the layout composing itself, the build shipping, the frame-time
 * graph settling flat.
 */

const INK = "#0C0C0C";
const EASE = [0.19, 1, 0.22, 1] as const;

const COPY = {
  en: {
    eyebrow: "06 · Process",
    h: "Method",
    sub: "A five beat method for inevitable software, the same sequence, every engagement, no improvisation where it counts.",
    artefacts: ["brief.md", "frame.fig", "layout.fig", "deploy.log", "perf.trace"],
    oneIdea: "One idea.",
    ship: ["build", "test", "preview", "deploy"],
    shipped: "live",
    frameTime: "frame time",
  },
  ar: {
    eyebrow: "06 · المنهجية",
    h: "المنهج",
    sub: "منهج من خمس مراحل لبرمجيات تبدو حتمية؛ التسلسل نفسه في كل مشروع، ولا ارتجال حيث يهمّ الأمر.",
    artefacts: ["brief.md", "frame.fig", "layout.fig", "deploy.log", "perf.trace"],
    oneIdea: "فكرة واحدة.",
    ship: ["build", "test", "preview", "deploy"],
    shipped: "live",
    frameTime: "زمن الإطار",
  },
};
type Copy = (typeof COPY)["en"];

/* ── artefacts ─────────────────────────────────────────────────────────── */

const BRIEF = [0.92, 0.7, 0.84, 0.56, 0.78, 0.64, 0.88];
const REAL = 4; // the line the problem is actually hiding in

function Listen() {
  // the brief as a page of lines: everything but one gets read past and
  // struck, the real problem gets circled in ember
  return (
    <div className="flex h-full flex-col justify-center gap-[14px] px-8">
      {BRIEF.map((w, i) => {
        const real = i === REAL;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.09, duration: 0.5, ease: EASE }}
            className="relative h-[10px] rounded-full"
            style={{ width: `${w * 100}%`, background: real ? INK : `${INK}1f` }}
          >
            {real ? (
              <motion.svg
                viewBox="0 0 200 40"
                preserveAspectRatio="none"
                className="absolute -inset-x-4 -inset-y-4 h-[calc(100%+32px)] w-[calc(100%+32px)] overflow-visible"
                fill="none"
              >
                <motion.path
                  d="M6 22 C 10 4, 190 2, 195 18 C 199 34, 20 40, 8 26 C 2 18, 30 6, 60 6"
                  stroke="#FF4D1F"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1.2, duration: 0.9, ease: EASE }}
                />
              </motion.svg>
            ) : (
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6 + i * 0.07, duration: 0.4, ease: EASE }}
                className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 origin-left rtl:origin-right"
                style={{ background: `${INK}55` }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function Frame({ c }: { c: Copy }) {
  const corners = ["left-0 top-0 border-l-2 border-t-2", "right-0 top-0 border-r-2 border-t-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"];
  return (
    <div className="relative flex h-full items-center justify-center">
      <motion.div initial={{ width: "92%", height: "86%" }} animate={{ width: "52%", height: "34%" }} transition={{ duration: 1.4, ease: EASE, delay: 0.1 }} className="absolute">
        {corners.map((k) => (
          <span key={k} className={`absolute h-7 w-7 ${k}`} style={{ borderColor: "#FF4D1F" }} />
        ))}
      </motion.div>
      <motion.p
        initial={{ opacity: 0, scale: 1.3, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ delay: 0.9, duration: 0.9, ease: EASE }}
        className="text-display text-[clamp(1.6rem,3vw,2.6rem)] italic"
        style={{ color: INK }}
      >
        {c.oneIdea}
      </motion.p>
    </div>
  );
}

const LAYOUTS = [
  [0, 1, 2, 3, 4, 5],
  [3, 0, 1, 5, 2, 4],
  [5, 3, 0, 4, 1, 2],
];
const SPANS = ["col-span-4 row-span-2", "col-span-2", "col-span-2", "col-span-3", "col-span-3", "col-span-6"];

function Compose() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((v) => (v + 1) % LAYOUTS.length), 1500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="grid h-full grid-cols-6 grid-rows-4 gap-2 p-6" dir="ltr">
      {LAYOUTS[n].map((b, i) => (
        <motion.div
          key={b}
          layout
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className={`rounded-lg ${SPANS[i]}`}
          style={{ background: b === 0 ? "#FF4D1F" : b === 5 ? INK : `${INK}${["1a", "26", "33", "40"][b % 4]}` }}
        />
      ))}
    </div>
  );
}

function Ship({ c }: { c: Copy }) {
  return (
    <div dir="ltr" className="flex h-full flex-col justify-center gap-3 px-8 font-mono text-[13px]" style={{ color: INK }}>
      {c.ship.map((step, i) => (
        <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.45 }} className="flex items-center gap-3">
          <span className="w-20 uppercase tracking-[0.18em] opacity-60">{step}</span>
          <span className="relative h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: `${INK}14` }}>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.25 + i * 0.45, duration: 0.45, ease: "easeOut" }}
              className="absolute inset-0 origin-left rounded-full"
              style={{ background: i === c.ship.length - 1 ? "#FF4D1F" : INK }}
            />
          </span>
          <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 + i * 0.45 }}>
            ✓
          </motion.span>
        </motion.div>
      ))}
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.3 }} className="mt-2 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.22em]">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> {c.shipped}
      </motion.p>
    </div>
  );
}

function Tune({ c }: { c: Copy }) {
  // a jagged frame-time trace that relaxes into a flat, steady line
  const jag = "M0 70 L20 40 L35 82 L50 30 L68 76 L85 44 L100 88 L118 36 L135 70 L150 52 L170 80 L190 46 L210 64 L230 58 L250 62 L270 60 L300 60";
  const flat = "M0 60 L20 60 L35 60 L50 60 L68 60 L85 60 L100 60 L118 60 L135 60 L150 60 L170 60 L190 60 L210 60 L230 60 L250 60 L270 60 L300 60";
  return (
    <div className="flex h-full flex-col justify-center px-8">
      <svg viewBox="0 0 300 110" className="w-full" fill="none">
        <path d="M0 60 H300" stroke={`${INK}22`} strokeDasharray="3 5" />
        <motion.path initial={{ d: jag }} animate={{ d: flat }} transition={{ delay: 0.5, duration: 1.8, ease: EASE }} stroke="#FF4D1F" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: `${INK}88` }}>
        {c.frameTime}
      </p>
    </div>
  );
}

/* ── the stage ─────────────────────────────────────────────────────────── */

export function Process() {
  const c = useCopy(COPY);
  const { lang } = useLang();
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const dial = useTransform(scrollYProgress, [0.04, 0.96], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setStep(Math.min(PROCESS.length - 1, Math.max(0, Math.floor(((p - 0.04) / 0.92) * PROCESS.length))));
  });

  const s = PROCESS[step];
  const title = lang === "ar" ? s.ar.title : s.title;
  const body = lang === "ar" ? s.ar.body : s.body;
  const R = 140;
  const C = 2 * Math.PI * R;
  const dash = useTransform(dial, (d) => C * (1 - d));

  const art = [<Listen key="l" />, <Frame key="f" c={c} />, <Compose key="c" />, <Ship key="s" c={c} />, <Tune key="t" c={c} />];

  return (
    <section id="process" ref={ref} className="relative" style={{ height: reduce ? "auto" : `${PROCESS.length * 85 + 100}vh` }}>
      <div
        data-surface="light"
        className={`${reduce ? "relative" : "sticky top-0 h-screen"} overflow-hidden rounded-t-[40px] bg-[#F4F3EF] px-5 sm:rounded-t-[50px] md:rounded-t-[60px] md:px-10`}
        style={{ color: INK }}
      >
        <div className="mx-auto flex h-full max-w-[1400px] flex-col pb-32 pt-20 md:pb-10 md:pt-28">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-mono text-[11px] uppercase tracking-[0.3em]" style={{ color: `${INK}73` }}>
                {c.eyebrow}
              </p>
              <h2 className="mt-3 text-display uppercase leading-none" style={{ fontSize: "clamp(2.2rem, 6vw, 5.5rem)" }}>
                {c.h}
              </h2>
            </div>
            <p className="hidden max-w-xs text-sm md:block" style={{ color: `${INK}99` }}>
              {c.sub}
            </p>
          </div>

          <div className="mt-6 grid flex-1 grid-cols-1 content-center items-center gap-6 md:mt-10 md:grid-cols-[0.95fr_1.05fr] md:content-normal md:gap-14">
            {/* numeral in its dial + the beat */}
            <div className="flex flex-row items-center gap-5 md:gap-10">
              <div className="relative aspect-square w-[30vw] max-w-[300px] shrink-0 self-center md:w-[24vw]">
                <svg viewBox="0 0 320 320" className="absolute inset-0 -rotate-90" aria-hidden>
                  <circle cx="160" cy="160" r={R} fill="none" stroke={`${INK}14`} strokeWidth="2" />
                  <motion.circle
                    cx="160"
                    cy="160"
                    r={R}
                    fill="none"
                    stroke="#FF4D1F"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    style={{ strokeDashoffset: dash }}
                  />
                  {PROCESS.map((_, i) => {
                    const a = (i / PROCESS.length) * Math.PI * 2;
                    return <circle key={i} cx={160 + Math.cos(a) * R} cy={160 + Math.sin(a) * R} r={i <= step ? 7 : 5} fill={i <= step ? "#FF4D1F" : "#F4F3EF"} stroke={i <= step ? "#FF4D1F" : `${INK}33`} strokeWidth="2" />;
                  })}
                </svg>
                <div dir="ltr" className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={s.no}
                      initial={{ y: "70%", opacity: 0, filter: "blur(8px)" }}
                      animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                      exit={{ y: "-70%", opacity: 0, filter: "blur(8px)" }}
                      transition={{ duration: 0.7, ease: EASE }}
                      className="text-display leading-none"
                      style={{ fontSize: "clamp(2.6rem, 9vw, 8.5rem)" }}
                    >
                      {s.no}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              <div className="min-h-[8rem] flex-1 md:min-h-[9rem]">
                <AnimatePresence mode="wait">
                  <motion.div key={`${lang}-${s.no}`} initial="a" animate="b" exit="c">
                    <h3 className="overflow-hidden text-display uppercase leading-[1.05] rtl:leading-[1.45]" style={{ fontSize: "clamp(1.6rem, 3.2vw, 3rem)" }}>
                      <motion.span className="inline-block" variants={{ a: { y: "105%" }, b: { y: "0%", transition: { duration: 0.7, ease: EASE } }, c: { y: "-105%", transition: { duration: 0.3 } } }}>
                        {title}
                      </motion.span>
                    </h3>
                    <motion.p
                      variants={{ a: { opacity: 0, y: 12 }, b: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.6, ease: EASE } }, c: { opacity: 0, transition: { duration: 0.2 } } }}
                      className="mt-3 max-w-md font-light leading-relaxed md:mt-4"
                      style={{ fontSize: "clamp(0.82rem, 1.3vw, 1.1rem)", color: `${INK}99` }}
                    >
                      {body}
                    </motion.p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* the live artefact for this beat */}
            <div className="relative h-[30vh] overflow-hidden rounded-[22px] md:rounded-[28px] border bg-white shadow-[0_40px_90px_-50px_rgba(0,0,0,0.35)] md:h-[46vh]" style={{ borderColor: `${INK}14` }}>
              <div dir="ltr" className="flex items-center gap-2 border-b px-5 py-3 font-mono text-[11px]" style={{ borderColor: `${INK}10`, color: `${INK}88` }}>
                <span className="h-2 w-2 rounded-full bg-[#FF4D1F]" />
                {c.artefacts[step]}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="absolute inset-x-0 bottom-0 top-[42px]"
                >
                  {art[step]}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
