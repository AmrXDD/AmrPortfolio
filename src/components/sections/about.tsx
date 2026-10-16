"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal, RevealWords } from "@/components/ui/reveal";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { PROJECTS } from "@/lib/constants";
import { useCopy, useLang } from "@/lib/i18n";

/* Facts only — every figure here is checkable on this page. */
const COPY = {
  en: {
    eyebrow: "Profile",
    label: "About / Philosophy",
    h: ["I build software the way", "film directors build scenes", "every frame is a decision,", "nothing is incidental."],
    p1: "I'm Amr, a web developer and designer working at the seam between brand, product, and motion. I design and build websites, consult on design and structure, and shape brand identities for studios and founders who care about the millisecond, the kerning, the easing curve.",
    p2: "My discipline is restraint at high resolution. Less surface, more depth. Every transition has a reason; every empty pixel was chosen. The portfolio you're reading is itself the proof.",
    stats: [
      { v: String(PROJECTS.length).padStart(2, "0"), l: "Case studies below" },
      { v: "EN / AR", l: "Bilingual, RTL native" },
      { v: "03", l: "Services" },
      { v: "01", l: "Point of contact" },
    ],
    watermark: "intention.",
  },
  ar: {
    eyebrow: "نبذة",
    label: "عنّي / فلسفتي",
    h: ["أبني البرمجيات كما", "يبني المخرجون مشاهدهم", "كل إطار قرار،", "ولا شيء عشوائي."],
    p1: "أنا عمرو، مطوّر ومصمّم مواقع أعمل عند التقاء الهوية والمنتج والحركة. أصمّم المواقع وأبنيها، وأقدّم الاستشارات في التصميم والبنية، وأصوغ الهويات البصرية للاستوديوهات والمؤسسين الذين يهتمّون بأجزاء الثانية، وبالمسافات بين الحروف، وبمنحنى كل حركة.",
    p2: "منهجي هو ضبط النفس بأعلى دقة. سطح أقل وعمق أكبر. لكل انتقال سبب، وكل بكسل فارغ اختير عن قصد. الموقع الذي تتصفّحه الآن هو الدليل.",
    stats: [
      { v: String(PROJECTS.length).padStart(2, "0"), l: "دراسات حالة أدناه" },
      { v: "EN / AR", l: "ثنائي اللغة، يدعم RTL" },
      { v: "03", l: "خدمات" },
      { v: "01", l: "جهة تواصل واحدة" },
    ],
    watermark: "قصد.",
  },
};

export function About() {
  const c = useCopy(COPY);
  const { lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yWord = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);

  return (
    <section
      ref={ref}
      className="relative border-b border-line bg-ink px-5 py-32 md:px-10 md:py-48"
    >
      <div className="mx-auto max-w-[1600px]">
        <div className="grid grid-cols-12 gap-y-16">
          <div className="col-span-12 md:col-span-4">
            <Eyebrow index="00">{c.eyebrow}</Eyebrow>
            <p className="mt-6 text-mono text-[11px] uppercase tracking-[0.22em] text-bone/50">
              {c.label}
            </p>
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

            <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2">
              {/* words sharpen out of a blur in reading order as you scroll */}
              <ScrollReveal key={`${lang}-1`} className="text-base leading-relaxed text-bone" text={c.p1} />
              <ScrollReveal key={`${lang}-2`} className="text-base leading-relaxed text-bone" text={c.p2} />
            </div>

            <div className="mt-20 grid grid-cols-2 gap-8 border-t border-line pt-12 md:grid-cols-4">
              {c.stats.map((s, i) => (
                <Reveal key={s.l} delay={i * 0.06}>
                  <div>
                    <div dir="ltr" className="text-display text-[clamp(2.5rem,5vw,4rem)] leading-none text-bone rtl:text-right">
                      {s.v}
                    </div>
                    <div className="mt-3 text-mono text-[10px] uppercase tracking-[0.22em] text-bone/50">
                      {s.l}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.div
        style={{ y: yWord }}
        className="pointer-events-none absolute bottom-6 left-0 right-0 select-none whitespace-nowrap text-center text-display text-[clamp(2.75rem,12vw,12rem)] italic leading-none text-bone/[0.05]"
      >
        {c.watermark}
      </motion.div>
    </section>
  );
}
