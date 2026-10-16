"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SITE } from "@/lib/constants";
import { useCopy, useLang } from "@/lib/i18n";

const AR_CARDS = [
  {
    t: "شخص واحد من البداية للنهاية.",
    b: "الاستراتيجية والتصميم والحركة والبرمجة، بلا تسليم بين أقسام ولا رسائل تضيع في الطريق. من تشرح له المشروع هو من يسلّمه، ولا شيء يضيع بين أقسام غير موجودة أصلًا.",
  },
  {
    t: "حركة لها معنى.",
    b: "لا شيء يتحرّك على الشاشة بلا سبب. كل انتقال يوضّح تسلسلًا أو علاقة سبب ونتيجة أو عناية، ولا يكون زينة لمجرد الزينة. الحركة التي لا تستحق إطاراتها لا تُطلق.",
  },
  {
    t: "جاهز للإطلاق من اليوم الأول.",
    b: "جودة إنتاج من أول سطر برمجي: ميزانيات أداء، وإتاحة، وتحسين لمحركات البحث، وتحليلات مدمجة لا مُلحقة. التسليم مفتاح نشر، لا مجلد من الاحتمالات.",
  },
];

const CARDS = [
  {
    no: "01",
    t: "One pair of hands.",
    b: "Strategy, design, motion, and code, no hand offs, no telephone game. The person you brief is the person who ships, and nothing gets lost between departments that don't exist.",
  },
  {
    no: "02",
    t: "Motion with meaning.",
    b: "Nothing on screen moves without a reason. Every transition communicates hierarchy, causality, or care, never decoration for its own sake. If an animation doesn't earn its frame budget, it doesn't ship.",
  },
  {
    no: "03",
    t: "Ship ready, day one.",
    b: "Production quality from the first commit, performance budgets, accessibility, SEO, and analytics built in, not bolted on. The handover is a deploy key, not a folder of maybes.",
  },
];

const INK = "#0C0C0C";
const EMBER = "#FF4D1F";
const PAPER = "#F4F1EA";

/*
 * The Craft · In Writing. The three guarantees are a document, not cards: a
 * sheet of paper rises off the desk and flattens, then each clause is
 * written in as you scroll (a pen nib leads the ink across the title, the
 * terms settle under it, a tick lands in the margin). The sheet is signed
 * and stamped at the end. On phones and with reduced motion the same sheet
 * scrolls normally and each clause writes itself in as it arrives.
 */

function Clause({ no, t, b, q, rtl, label }: { no: string; t: string; b: string; q: MotionValue<number>; rtl: boolean; label: string }) {
  const ink = useTransform(q, [0, 0.55], [0, 1]);
  const cut = useTransform(ink, (v) => (rtl ? `inset(-20% 0 -30% ${(1 - v) * 100}%)` : `inset(-20% ${(1 - v) * 100}% -30% 0)`));
  const nib = useTransform(ink, (v) => `${v * 100}%`);
  const nibO = useTransform(ink, (v) => (v > 0.01 && v < 0.99 ? 1 : 0));
  const bodyO = useTransform(q, [0.4, 0.8], [0, 1]);
  const bodyY = useTransform(q, [0.4, 0.8], [14, 0]);
  const tick = useTransform(q, [0.78, 1], [0, 1]);
  const numO = useTransform(q, [0, 0.12], [0.18, 1]);

  return (
    <div className="relative grid grid-cols-[3.25rem_1fr] gap-x-4 border-t py-5 md:grid-cols-[5.5rem_0.85fr_1.15fr] md:gap-x-8 md:py-6" style={{ borderColor: `${INK}14` }}>
      {/* number, sitting in the margin */}
      <motion.div style={{ opacity: numO }} className="row-span-2 md:row-span-1">
        <span className="block font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: `${INK}80` }}>
          {label}
        </span>
        <span dir="ltr" className="mt-1 block text-display leading-none" style={{ fontSize: "clamp(1.6rem, 2.6vw, 2.4rem)", color: INK }}>
          <span className="font-serif italic" style={{ fontFamily: "var(--font-serif), serif", color: EMBER }}>§</span>
          {no}
        </span>
        <svg viewBox="0 0 24 24" className="mt-3 h-6 w-6" fill="none" aria-hidden>
          <motion.path d="M4 12.5l5 5L20 6.5" stroke={EMBER} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: tick }} />
        </svg>
      </motion.div>

      {/* the title, inked in behind a travelling nib */}
      <h3 className="relative text-display leading-[1.08] rtl:leading-[1.45]" style={{ fontSize: "clamp(1.35rem, 2.3vw, 2.15rem)" }}>
        <span aria-hidden style={{ color: `${INK}14` }}>
          {t}
        </span>
        <motion.span className="absolute inset-0" style={{ clipPath: cut, color: INK }}>
          {t}
        </motion.span>
        <motion.span
          aria-hidden
          className="absolute top-[12%] h-[76%] w-[3px] rounded-full"
          style={{ [rtl ? "right" : "left"]: nib, opacity: nibO, background: EMBER, boxShadow: `0 0 14px ${EMBER}` }}
        />
      </h3>

      <motion.p style={{ opacity: bodyO, y: bodyY, color: `${INK}B3` }} className="col-start-2 mt-2 text-[14px] leading-relaxed md:col-start-auto md:mt-0 md:text-[15px]">
        {b}
      </motion.p>
    </div>
  );
}

function Signature({ s, rtl, signed, ring }: { s: MotionValue<number>; rtl: boolean; signed: string; ring: string }) {
  const line = useTransform(s, [0, 0.35], [0, 1]);
  const draw = useTransform(s, [0.2, 0.75], [420, 0]);
  const fill = useTransform(s, [0.65, 0.85], [0, 1]);
  const stampO = useTransform(s, [0.78, 0.86], [0, 1]);
  const stampS = useTransform(s, [0.78, 0.9], [2.2, 1]);
  return (
    <div className="mt-2 flex items-end justify-between gap-6 border-t pt-6" style={{ borderColor: `${INK}14` }}>
      <div className="min-w-0 flex-1">
        {/* LTR inside so the anchor means what it says; RTL pages sign on the right */}
        <svg viewBox="0 0 260 70" className="h-14 w-auto md:h-16" style={{ direction: "ltr" }} aria-label={SITE.name}>
          <motion.text
            x={rtl ? 250 : 6}
            y="54"
            textAnchor={rtl ? "end" : "start"}
            style={{
              fontFamily: "var(--font-serif), serif",
              fontStyle: "italic",
              fontSize: 58,
              stroke: INK,
              strokeWidth: 1.2,
              strokeDasharray: 420,
              strokeDashoffset: draw,
              fill: INK,
              fillOpacity: fill,
            }}
          >
            {SITE.name}
          </motion.text>
        </svg>
        <motion.div style={{ scaleX: line }} className="h-px w-full max-w-[280px] origin-left rtl:origin-right">
          <div className="h-px w-full" style={{ background: `${INK}55` }} />
        </motion.div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: `${INK}80` }}>
          {signed}
        </p>
      </div>

      {/* the stamp lands last */}
      <motion.div style={{ opacity: stampO, scale: stampS, rotate: -9 }} className="relative h-[104px] w-[104px] shrink-0 md:h-[120px] md:w-[120px]" aria-hidden>
        <svg viewBox="0 0 120 120" className="h-full w-full" style={{ direction: "ltr" }}>
          <circle cx="60" cy="60" r="56" fill="none" stroke={EMBER} strokeWidth="2.5" />
          <circle cx="60" cy="60" r="44" fill="none" stroke={EMBER} strokeWidth="1" />
          <defs>
            <path id="stamp-ring" d="M60,60 m-50,0 a50,50 0 1,1 100,0 a50,50 0 1,1 -100,0" />
          </defs>
          <text style={{ fontSize: rtl ? 11 : 9.6, letterSpacing: rtl ? 0 : "0.16em", fontFamily: rtl ? "var(--font-ar-sans), sans-serif" : "var(--font-mono), monospace", fill: EMBER, fontWeight: 600 }}>
            <textPath href="#stamp-ring">{ring}</textPath>
          </text>
          <path d="M42 61l12 12 25-27" fill="none" stroke={EMBER} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </div>
  );
}

/** A 0→1 value that plays once when the element scrolls into view (phones, reduced motion). */
function useArrive(ref: React.RefObject<HTMLElement | null>, duration: number, instant: boolean) {
  const v = useMotionValue(instant ? 1 : 0);
  const seen = useInView(ref, { once: true, margin: "0px 0px -18% 0px" });
  useEffect(() => {
    if (!seen || instant) return;
    const c = animate(v, 1, { duration, ease: [0.45, 0, 0.2, 1] });
    return () => c.stop();
  }, [seen, instant, v, duration]);
  return v;
}

function ArriveClause(props: { no: string; t: string; b: string; rtl: boolean; label: string; reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const q = useArrive(ref, 1.8, props.reduce);
  return (
    <div ref={ref}>
      <Clause {...props} q={q} />
    </div>
  );
}

function ArriveSignature(props: { rtl: boolean; signed: string; ring: string; reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const s = useArrive(ref, 2.2, props.reduce);
  return (
    <div ref={ref}>
      <Signature s={s} {...props} />
    </div>
  );
}

export function Guarantees() {
  const { lang } = useLang();
  const rtl = lang === "ar";
  const reduce = !!useReducedMotion();
  const c = useCopy({
    en: { eyebrow: "The Craft · In Writing", h1: "Three guarantees,", h2: "in writing.", clause: "Clause", signed: "Amr Studio", ring: "AMR STUDIO · THE CRAFT · IN WRITING · " },
    ar: { eyebrow: "الحِرفة · مكتوبة", h1: "ثلاثة التزامات،", h2: "مكتوبة.", clause: "البند", signed: "Amr Studio", ring: "AMR STUDIO · الحِرفة · مكتوبة · AMR STUDIO · الحِرفة · مكتوبة · " },
  });
  const cards = rtl ? CARDS.map((card, i) => ({ ...card, ...AR_CARDS[i] })) : CARDS;

  // desktop gets the pinned, scroll-written version
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px) and (min-height: 620px)");
    const on = () => setPinned(mq.matches && !reduce);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [reduce]);

  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const rise = useTransform(p, [0, 0.1], [0, 1]);
  const rotX = useTransform(rise, [0, 1], [26, 0]);
  const lift = useTransform(rise, [0, 1], [120, 0]);
  const scale = useTransform(rise, [0, 1], [0.9, 1]);
  const q0 = useTransform(p, [0.12, 0.32], [0, 1]);
  const q1 = useTransform(p, [0.35, 0.55], [0, 1]);
  const q2 = useTransform(p, [0.58, 0.78], [0, 1]);
  const qs = [q0, q1, q2];
  const sig = useTransform(p, [0.82, 0.97], [0, 1]);

  // keep the whole sheet inside the viewport on shorter screens
  const sheet = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    if (!pinned || !sheet.current) return;
    const el = sheet.current;
    const measure = () => setFit(Math.min(1, (window.innerHeight - 110) / el.offsetHeight));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [pinned, lang]);

  const header = (
    <div className="flex items-start justify-between gap-6 pb-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.26em]" style={{ color: `${INK}80` }}>
          <span dir="ltr">Amr Studio</span> · {c.eyebrow}
        </p>
        <h2 className="mt-3 text-display leading-[1.02] rtl:leading-[1.4]" style={{ fontSize: "clamp(2rem, 4.2vw, 3.9rem)", color: INK }}>
          {c.h1} <span className="italic" style={{ color: EMBER }}>{c.h2}</span>
        </h2>
      </div>
    </div>
  );

  const paperStyle: React.CSSProperties = {
    background: PAPER,
    color: INK,
    // faint rules, like a legal pad
    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 33px, ${INK}0d 33px 34px)`,
  };

  return (
    <section ref={ref} className="relative border-b border-line" style={pinned ? { height: "430vh" } : undefined}>
      {pinned ? (
        <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden px-10 pt-10">
          {/* desk light */}
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[120vh] w-[120vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,77,31,0.10),transparent_60%)]" />
          <motion.div style={{ scale: fit }} className="relative w-full max-w-[1040px]">
            <motion.div
              ref={sheet}
              style={{ ...paperStyle, rotateX: rotX, y: lift, scale, transformPerspective: 1600, transformOrigin: "50% 100%" }}
              className="relative overflow-hidden rounded-[10px] px-12 py-10 shadow-[0_60px_140px_-40px_rgba(0,0,0,0.85)]"
            >
              <span aria-hidden className="absolute inset-y-0 start-[9.5rem] w-px" style={{ background: `${EMBER}55` }} />
              <div className="relative">
                {header}
                {cards.map((card, i) => (
                  <Clause key={card.no} no={card.no} t={card.t} b={card.b} q={qs[i]} rtl={rtl} label={c.clause} />
                ))}
                <Signature s={sig} rtl={rtl} signed={c.signed} ring={c.ring} />
              </div>
            </motion.div>
          </motion.div>
        </div>
      ) : (
        <div className="px-4 py-20 md:px-10 md:py-28">
          <div className="relative mx-auto max-w-[1040px] overflow-hidden rounded-[10px] px-5 py-8 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.8)] sm:px-10 sm:py-10" style={paperStyle}>
            <span aria-hidden className="absolute inset-y-0 start-[5rem] w-px sm:start-[6.25rem]" style={{ background: `${EMBER}55` }} />
            <div className="relative">
              {header}
              {cards.map((card) => (
                <ArriveClause key={`${lang}-${card.no}`} no={card.no} t={card.t} b={card.b} rtl={rtl} label={c.clause} reduce={reduce} />
              ))}
              <ArriveSignature key={lang} rtl={rtl} signed={c.signed} ring={c.ring} reduce={reduce} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
