"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealWords } from "@/components/ui/reveal";
import { useLang } from "@/lib/i18n";

const TENETS = {
  en: [
    { n: "01", t: "Restraint is a feature.", b: "Every element on screen is an obligation. Remove until it hurts. Then remove one more." },
    { n: "02", t: "Motion is meaning.", b: "If a transition doesn't communicate hierarchy or causality, it shouldn't exist." },
    { n: "03", t: "Speed is a love letter.", b: "Frame rate, time to interactive, latency, these are how a product respects the person using it." },
    { n: "04", t: "Brand lives in the details.", b: "The kerning of the caption. The easing of the toast. The empty state nobody will see." },
  ],
  ar: [
    { n: "01", t: "ضبط النفس ميزة.", b: "كل عنصر على الشاشة التزام. احذف حتى يؤلمك الحذف، ثم احذف عنصرًا آخر." },
    { n: "02", t: "الحركة معنى.", b: "إن لم يوضّح الانتقال تسلسلًا أو علاقة سبب ونتيجة، فلا داعي لوجوده." },
    { n: "03", t: "السرعة رسالة حب.", b: "معدّل الإطارات وزمن التفاعل وسرعة الاستجابة، هكذا يحترم المنتج من يستخدمه." },
    { n: "04", t: "الهوية تعيش في التفاصيل.", b: "المسافات بين حروف التعليق. انسياب الإشعار. الحالة الفارغة التي لن يراها أحد." },
  ],
};

/*
 * Manifesto · each conviction is set huge, in outline, and inks itself in
 * word by word as it crosses the viewport, like a press laying it down. The
 * numeral fills alongside, the reasoning surfaces once the line is solid and
 * an ember rule draws under it.
 */

function Word({ word, p, from, to, rtl }: { word: string; p: MotionValue<number>; from: number; to: number; rtl: boolean }) {
  const cut = useTransform(p, [from, to], [100, 0], { clamp: true });
  const clip = useTransform(cut, (c) => (rtl ? `inset(-10% 0 -20% ${c}%)` : `inset(-10% ${c}% -20% 0)`));
  return (
    <span className="relative inline-block whitespace-nowrap">
      {/* Arabic glyphs overlap at the joins, so an outline shows seams; use a dim fill instead */}
      <span aria-hidden className={rtl ? "text-bone/[0.14]" : "text-transparent"} style={rtl ? undefined : { WebkitTextStroke: "1px rgb(var(--bone-rgb) / 0.28)" }}>
        {word}
      </span>
      <motion.span className="absolute inset-0 text-bone" style={{ clipPath: clip }}>
        {word}
      </motion.span>
    </span>
  );
}

function Tenet({ n, t, b, rtl, reduce }: { n: string; t: string; b: string; rtl: boolean; reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start 0.9", "end 0.5"] });
  const words = t.split(" ");
  const span = 0.72 / words.length;
  const numFill = useTransform(p, [0, 0.72], [100, 0], { clamp: true });
  const numClip = useTransform(numFill, (c) => `inset(${c}% 0 0 0)`);
  const bodyO = useTransform(p, [0.66, 0.9], [0, 1]);
  const bodyY = useTransform(p, [0.66, 0.9], [18, 0]);
  const rule = useTransform(p, [0.72, 1], [0, 1]);

  return (
    <div ref={ref} data-tick className="grid grid-cols-12 items-start gap-x-6 gap-y-6 border-t border-line py-14 md:py-24">
      {/* numeral, filling bottom-up */}
      <div dir="ltr" className="relative col-span-12 text-display leading-[0.8] md:col-span-3" style={{ fontSize: "clamp(4rem, 11vw, 10rem)" }}>
        <span className="text-transparent" style={{ WebkitTextStroke: "1px rgb(var(--bone-rgb) / 0.22)" }}>
          {n}
        </span>
        <motion.span className="absolute inset-0 text-accent" style={{ clipPath: reduce ? undefined : numClip }}>
          {n}
        </motion.span>
      </div>

      <div className="col-span-12 md:col-span-9">
        <h3 className="text-display leading-[1.02] rtl:leading-[1.4]" style={{ fontSize: "clamp(2.4rem, 6.6vw, 7rem)" }}>
          {reduce ? (
            <span className="text-bone">{t}</span>
          ) : (
            words.map((w, i) => (
              <span key={i}>
                <Word word={w} p={p} from={i * span} to={(i + 1) * span} rtl={rtl} />
                {i < words.length - 1 ? " " : ""}
              </span>
            ))
          )}
        </h3>
        <motion.p style={reduce ? undefined : { opacity: bodyO, y: bodyY }} className="mt-8 max-w-xl text-[clamp(1rem,1.4vw,1.25rem)] leading-relaxed text-bone/65">
          {b}
        </motion.p>
        <motion.div style={{ scaleX: reduce ? 1 : rule }} className="mt-8 h-px w-40 origin-left bg-accent rtl:origin-right" />
      </div>
    </div>
  );
}

export function Philosophy() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = !!useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["10%", "-30%"]);
  const { lang } = useLang();
  const ar = lang === "ar";

  return (
    <section ref={ref} className="relative overflow-hidden border-b border-line bg-ink px-5 py-32 md:px-10 md:py-40">
      {/* the word behind it all, drifting */}
      {/* set in SVG and fitted to the viewBox, so the word spans the width at
          any screen size without running off the edge */}
      <motion.div style={{ y }} aria-hidden className="pointer-events-none absolute inset-x-0 top-1/3 select-none px-[3vw]">
        <svg viewBox="0 0 1000 240" className="block h-auto w-full overflow-visible">
          <text
            x="500"
            y="180"
            textAnchor="middle"
            {...(ar ? {} : { textLength: 980, lengthAdjust: "spacingAndGlyphs" })}
            style={{
              fontFamily: ar ? "var(--font-ar-serif), var(--font-ar-display), serif" : "var(--font-serif), serif",
              fontStyle: ar ? "normal" : "italic",
              fontSize: ar ? 230 : 210,
              fill: "rgb(var(--bone-rgb) / 0.05)",
            }}
          >
            {ar ? "قناعة." : "conviction."}
          </text>
        </svg>
      </motion.div>

      <div className="relative mx-auto max-w-[1600px]">
        <div className="mb-16 grid grid-cols-12 gap-y-8 md:mb-24">
          <div className="col-span-12 md:col-span-3">
            <Eyebrow index="10">{ar ? "البيان" : "Manifesto"}</Eyebrow>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 key={lang} className="text-display size-h2 text-bone">
              <RevealWords text={ar ? "أربع قناعات" : "Four convictions"} />
              <br />
              <span className="italic text-bone/80">
                <RevealWords text={ar ? "لا أتفاوض عليها." : "I won't negotiate."} delay={0.1} />
              </span>
            </h2>
          </div>
        </div>

        <div key={lang}>
          {TENETS[lang].map((t) => (
            <Tenet key={t.n} {...t} rtl={ar} reduce={reduce} />
          ))}
          <div className="border-t border-line" />
        </div>
      </div>
    </section>
  );
}
