"use client";

import { motion, useInView, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealWords } from "@/components/ui/reveal";
import { PROJECTS, SITE, SITE_AR } from "@/lib/constants";
import { useCopy, useLang } from "@/lib/i18n";
import { useIsMobile } from "@/lib/use-mobile";

/*
 * About · "The Slate". The headline says software is built the way a
 * director builds a scene, so the section is the set: a clapperboard that
 * carries the real facts (case studies, languages, services, one contact)
 * and snaps shut as you arrive, beside a screenplay page that writes
 * itself, from FADE IN to CUT TO: THE WORK. Every figure here is checkable
 * on this page.
 */

const COPY = {
  en: {
    eyebrow: "Profile",
    label: "About / Philosophy",
    h: ["I build software the way", "film directors build scenes", "every frame is a decision,", "nothing is incidental."],
    p1: "I'm Amr, a web developer and designer working at the seam between brand, product, and motion. I design and build websites, consult on design and structure, and shape brand identities for studios and founders who care about the millisecond, the kerning, the easing curve.",
    p2: "My discipline is restraint at high resolution. Less surface, more depth. Every transition has a reason; every empty pixel was chosen. The portfolio you're reading is itself the proof.",
    slate: {
      prod: "Prod.",
      studio: "Amr Studio",
      roll: "Roll",
      scene: "Scene",
      take: "Take",
      rollL: "Case studies below",
      sceneL: "Bilingual, RTL native",
      takeL: "Services",
      director: "Director",
      contact: "Contact",
      contactL: "Point of contact",
      date: "Date",
    },
    script: {
      fade: "FADE IN:",
      heading: `INT. AMR STUDIO, ${(SITE.city as string).split(",")[0].toUpperCase()} — NIGHT`,
      action: "A quiet studio. One screen glows.",
      who: "AMR",
      cont: "AMR (CONT'D)",
      cut: "CUT TO: THE WORK.",
    },
  },
  ar: {
    eyebrow: "نبذة",
    label: "عنّي / فلسفتي",
    h: ["أبني البرمجيات كما", "يبني المخرجون مشاهدهم", "كل إطار قرار،", "ولا شيء عشوائي."],
    p1: "أنا عمرو، مطوّر ومصمّم مواقع أعمل عند التقاء الهوية والمنتج والحركة. أصمّم المواقع وأبنيها، وأقدّم الاستشارات في التصميم والبنية، وأصوغ الهويات البصرية للاستوديوهات والمؤسسين الذين يهتمّون بأجزاء الثانية، وبالمسافات بين الحروف، وبمنحنى كل حركة.",
    p2: "منهجي هو ضبط النفس بأعلى دقة. سطح أقل وعمق أكبر. لكل انتقال سبب، وكل بكسل فارغ اختير عن قصد. الموقع الذي تتصفّحه الآن هو الدليل.",
    slate: {
      prod: "الإنتاج",
      studio: "Amr Studio",
      roll: "البكرة",
      scene: "المشهد",
      take: "اللقطة",
      rollL: "دراسات حالة أدناه",
      sceneL: "ثنائي اللغة، يدعم RTL",
      takeL: "خدمات",
      director: "الإخراج",
      contact: "التواصل",
      contactL: "جهة تواصل واحدة",
      date: "التاريخ",
    },
    script: {
      fade: "ظهور تدريجي:",
      heading: `داخلي. استوديو عمرو، ${SITE_AR.city.split("،")[0]} — ليل`,
      action: "استوديو هادئ. شاشة واحدة مضيئة.",
      who: "عمرو",
      cont: "عمرو (يتابع)",
      cut: "قطع إلى: الأعمال.",
    },
  },
};

const PAPER = "#F4F1EA";
const INK = "#121212";
const EMBER = "#FF4D1F";

/* ── the clapperboard ─────────────────────────────────────────────────── */
function Clapper({ shut, reduce }: { shut: boolean; reduce: boolean }) {
  const c = useCopy(COPY);
  const tc = useRef<HTMLSpanElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const live = useInView(box);
  const mobile = useIsMobile();
  const [date, setDate] = useState("—");

  useEffect(() => {
    const d = new Date();
    setDate(`${String(d.getDate()).padStart(2, "0")} · ${String(d.getMonth() + 1).padStart(2, "0")} · ${d.getFullYear()}`);
  }, []);

  // a running timecode (24 fps), written straight to the DOM, only on screen
  useEffect(() => {
    if (!live || reduce) return;
    const t0 = performance.now();
    const id = window.setInterval(() => {
      const f = Math.floor(((performance.now() - t0) / 1000) * 24);
      const ff = f % 24;
      const s = Math.floor(f / 24);
      const pad = (n: number) => String(n).padStart(2, "0");
      if (tc.current) tc.current.textContent = `00:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(ff)}`;
    }, 1000 / 24);
    return () => clearInterval(id);
  }, [live, reduce]);

  const stripes = (flip: boolean) =>
    `repeating-linear-gradient(${flip ? 55 : -55}deg, ${PAPER} 0 22px, #0c0c0c 22px 44px)`;

  return (
    <motion.div
      ref={box}
      animate={shut && !reduce ? { x: [0, -5, 4, -2, 0], rotate: [0, -0.6, 0.4, 0] } : {}}
      transition={{ duration: 0.35, delay: 0.12 }}
      data-surface="dark"
      className="relative mx-auto w-full max-w-[460px] select-none"
    >
      {/* the clapper stick, hinged at the left */}
      <motion.div
        className="relative z-10 h-11 rounded-t-[6px] border border-black/60 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.8)]"
        style={{ background: stripes(false), transformOrigin: "10px 100%" }}
        initial={false}
        // phones open it less, so it never swings up over the headline
        animate={{ rotate: shut || reduce ? 0 : mobile ? -14 : -28 }}
        transition={shut ? { type: "spring", stiffness: 900, damping: 22, mass: 0.6 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="absolute left-[6px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#888] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]" />
      </motion.div>
      <div className="h-9 border-x border-black/60" style={{ background: stripes(true) }} />

      {/* the slate */}
      <div className="relative overflow-hidden rounded-b-[12px] border border-white/10 bg-[#161616] p-5 text-chalk shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)] sm:p-6">
        {/* chalk dust */}
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] [background-size:7px_7px]" />
        {/* the flash when it snaps */}
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 bg-white" initial={false} animate={{ opacity: shut && !reduce ? [0, 0.22, 0] : 0 }} transition={{ duration: 0.4 }} />

        <div className="relative grid grid-cols-3 gap-px overflow-hidden rounded-md border border-white/15 bg-white/15">
          <Cell label={c.slate.prod} className="col-span-3">
            <span dir="ltr" className="text-[clamp(1.8rem,2.8vw,2.5rem)] italic leading-none" style={{ fontFamily: "var(--font-serif), serif" }}>
              {c.slate.studio}
            </span>
          </Cell>
          <Cell label={c.slate.roll} note={c.slate.rollL}>
            <Big dir="ltr">{String(PROJECTS.length).padStart(2, "0")}</Big>
          </Cell>
          <Cell label={c.slate.scene} note={c.slate.sceneL}>
            <Big dir="ltr">EN/AR</Big>
          </Cell>
          <Cell label={c.slate.take} note={c.slate.takeL}>
            <Big dir="ltr">03</Big>
          </Cell>
          <Cell label={c.slate.director} className="col-span-2">
            <span dir="ltr" className="text-[clamp(1.5rem,2.2vw,1.9rem)] italic leading-none" style={{ fontFamily: "var(--font-serif), serif" }}>
              {SITE.name}
            </span>
          </Cell>
          <Cell label={c.slate.contact} note={c.slate.contactL}>
            <Big dir="ltr">01</Big>
          </Cell>
        </div>

        <div className="relative mt-4 flex items-center justify-between text-mono text-[11px] uppercase tracking-[0.18em]">
          <span className="text-chalk/50">
            {c.slate.date} <span dir="ltr" className="text-chalk/80">{date}</span>
          </span>
          <span className="flex items-center gap-2 text-accent">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            <span ref={tc} dir="ltr" className="tabular-nums">
              00:00:00:00
            </span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function Cell({ label, note, className = "", children }: { label: string; note?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`bg-[#161616] px-3 py-2.5 ${className}`}>
      <p className="text-mono text-[10.5px] uppercase tracking-[0.2em] text-chalk/60 rtl:tracking-normal">{label}</p>
      <div className="mt-1.5">{children}</div>
      {note ? <p className="mt-1 text-[11.5px] leading-tight text-chalk/60">{note}</p> : null}
    </div>
  );
}

function Big({ children, dir }: { children: React.ReactNode; dir?: "ltr" }) {
  return (
    <span dir={dir} className="block text-display text-[clamp(1.7rem,2.6vw,2.4rem)] leading-none text-chalk">
      {children}
    </span>
  );
}

/* ── the screenplay page ──────────────────────────────────────────────── */
const lineV: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.018 } },
};
const wordV: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.01 } },
};

/** A block that types itself in, word by word, the first time it is seen. */
function Typed({ text, className = "", style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const reduce = !!useReducedMotion();
  if (reduce) return <p className={className} style={style}>{text}</p>;
  const words = text.split(" ");
  return (
    <motion.p className={className} style={style} variants={lineV} initial="hidden" whileInView="shown" viewport={{ once: true, margin: "0px 0px -12% 0px" }} aria-label={text}>
      {words.map((w, i) => (
        <motion.span key={i} variants={wordV} aria-hidden>
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.p>
  );
}

function Screenplay() {
  const c = useCopy(COPY);
  const { lang } = useLang();
  const ar = lang === "ar";
  const font: React.CSSProperties = { fontFamily: ar ? "var(--font-ar-sans), sans-serif" : "var(--font-mono), ui-monospace, monospace", color: INK };
  const s = c.script;

  return (
    <div className="relative mx-auto w-full max-w-[640px] -rotate-[0.8deg] rtl:rotate-[0.8deg]" style={font}>
      {/* a second sheet underneath */}
      <div aria-hidden className="absolute inset-0 translate-x-2 translate-y-2 rotate-[1.4deg] rounded-[3px] bg-[#e6e2d8] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)] rtl:-translate-x-2" />
      <div data-surface="light" className="relative rounded-[3px] px-6 py-12 shadow-[0_50px_100px_-40px_rgba(0,0,0,0.9)] sm:px-[10%] sm:py-16" style={{ background: PAPER }}>
        {/* brass brads */}
        {["18%", "82%"].map((t) => (
          <span key={t} aria-hidden className="absolute start-[4.5%] h-4 w-4 rounded-full shadow-[inset_0_-1px_2px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.4)]" style={{ top: t, background: "radial-gradient(circle at 35% 30%, #fff1b8, #c9a227 55%, #6d5410)" }} />
        ))}
        <span dir="ltr" className="absolute end-[7%] top-6 text-[12px] opacity-60">
          1.
        </span>

        <div className="space-y-5 text-[13px] leading-[1.65] sm:text-[14px]">
          <Typed text={s.fade} className="font-bold" />
          <Typed text={s.heading} className="font-bold uppercase tracking-wide" />
          <Typed text={s.action} />

          <div className="pt-2">
            <Typed text={s.who} className="ms-[30%] font-bold sm:ms-[38%]" />
            <Typed text={c.p1} className="mt-1 sm:mx-[12%]" />
          </div>
          <div>
            <Typed text={s.cont} className="ms-[30%] font-bold sm:ms-[38%]" />
            <Typed text={c.p2} className="mt-1 sm:mx-[12%]" />
          </div>

          <div className="flex items-center justify-end gap-1 pt-4 font-bold">
            <Typed text={s.cut} />
            <span className="inline-block h-[1.05em] w-[0.55em] animate-pulse" style={{ background: EMBER }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function About() {
  const c = useCopy(COPY);
  const { lang } = useLang();
  const reduce = !!useReducedMotion();
  const set = useRef<HTMLDivElement>(null);
  const [shut, setShut] = useState(false);

  // the clapper snaps shut as the set reaches the middle of the screen
  const { scrollYProgress } = useScroll({ target: set, offset: ["start end", "end start"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => setShut((cur) => (v > 0.28 ? true : v < 0.2 ? false : cur)));
  const pageY = useTransform(scrollYProgress, [0, 1], [40, -40]);

  return (
    <section className="relative border-b border-line bg-ink px-5 py-20 md:px-10 md:py-44">
      {/* a projector's light from above */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,rgba(255,77,31,0.10),transparent_70%)]" />

      <div className="relative mx-auto max-w-[1600px]">
        {/* the title card */}
        <div className="grid grid-cols-12 gap-y-12">
          <div className="col-span-12 md:col-span-4">
            <Eyebrow index="02">{c.eyebrow}</Eyebrow>
            <p className="mt-6 text-mono text-[11px] uppercase tracking-[0.22em] text-bone/50">{c.label}</p>
          </div>
          <div className="col-span-12 md:col-span-8">
            <h2 key={lang} className="text-display size-h2 text-bone">
              <RevealWords text={c.h[0]} />
              <br />
              <span className="italic text-bone/90">
                <RevealWords text={c.h[1]} delay={0.1} />
              </span>
              <br />
              <RevealWords text={c.h[2]} delay={0.2} />
              <br />
              <span className="text-accent">
                <RevealWords text={c.h[3]} delay={0.3} />
              </span>
            </h2>
          </div>
        </div>

        {/* the set: slate + script */}
        <div ref={set} className="mt-16 grid grid-cols-12 items-start gap-y-16 md:mt-32 md:gap-x-10">
          <div className="col-span-12 md:sticky md:top-28 md:col-span-5">
            <Clapper shut={shut} reduce={reduce} />
          </div>
          <motion.div style={reduce ? undefined : { y: pageY }} className="col-span-12 md:col-span-7">
            <Screenplay key={lang} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
