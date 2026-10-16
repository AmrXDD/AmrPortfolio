"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState } from "react";
import { CAPABILITIES } from "@/lib/constants";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal, RevealWords } from "@/components/ui/reveal";
import { useCopy, useLang } from "@/lib/i18n";

/*
 * Capabilities · an index set like a type specimen. Each service is one
 * huge row; on hover an ember sheet wipes across it, the type flips to ink
 * and a lens follows the cursor playing that discipline's little loop
 * (code being typed, a grid composing, a page being scanned, the mark
 * drawing itself, a cube turning, the script switching).
 */

const EASE = [0.19, 1, 0.22, 1] as const;

function Glyph({ i }: { i: number }) {
  switch (i) {
    case 0:
      return (
        <span dir="ltr" className="font-mono text-[34px] text-bone">
          {"</"}
          <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.9, repeat: Infinity }} className="text-accent">
            |
          </motion.span>
          {">"}
        </span>
      );
    case 1:
      return (
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 9 }, (_, k) => (
            <motion.span
              key={k}
              animate={{ opacity: [0.15, 1, 0.15], scale: [0.7, 1, 0.7] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: ((k % 3) + Math.floor(k / 3)) * 0.12 }}
              className={`h-5 w-5 rounded-[4px] ${k === 4 ? "bg-accent" : "bg-bone"}`}
            />
          ))}
        </div>
      );
    case 2:
      return (
        <div className="relative h-16 w-20">
          {[0, 1, 2, 3].map((k) => (
            <span key={k} className="absolute start-0 h-1 rounded-full bg-bone/40" style={{ top: 8 + k * 14, width: `${[90, 70, 84, 60][k]}%` }} />
          ))}
          <motion.span
            animate={{ x: [0, 40, 10, 0], y: [0, 18, 36, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -start-1 -top-1 h-8 w-8 rounded-full border-2 border-accent"
          />
        </div>
      );
    case 3:
      return (
        <svg viewBox="0 0 80 80" className="h-20 w-20" fill="none">
          <motion.circle cx="40" cy="40" r="34" stroke="#FF4D1F" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 1] }} transition={{ duration: 2.4, repeat: Infinity }} />
          <text x="40" y="54" textAnchor="middle" className="fill-bone" style={{ font: "italic 44px var(--font-display, serif)" }}>
            a
          </text>
        </svg>
      );
    case 4:
      return (
        <div className="h-14 w-14 [perspective:300px]">
          <motion.div animate={{ rotateX: 360, rotateY: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className="relative h-full w-full [transform-style:preserve-3d]">
            {["rotateY(0deg)", "rotateY(90deg)", "rotateY(180deg)", "rotateY(-90deg)", "rotateX(90deg)", "rotateX(-90deg)"].map((r, k) => (
              <span key={r} className={`absolute inset-0 border ${k === 0 ? "border-accent bg-accent/20" : "border-bone/70"}`} style={{ transform: `${r} translateZ(28px)` }} />
            ))}
          </motion.div>
        </div>
      );
    default:
      return (
        <div className="relative h-14 w-24 text-center">
          <motion.span animate={{ opacity: [1, 1, 0, 0, 1] }} transition={{ duration: 3, repeat: Infinity, times: [0, 0.4, 0.5, 0.9, 1] }} className="absolute inset-0 text-display text-[42px] leading-[56px] text-bone">
            Aa
          </motion.span>
          <motion.span animate={{ opacity: [0, 0, 1, 1, 0] }} transition={{ duration: 3, repeat: Infinity, times: [0, 0.4, 0.5, 0.9, 1] }} className="absolute inset-0 text-[38px] leading-[56px] text-accent" style={{ fontFamily: "var(--font-ar-display), var(--font-ar-sans), sans-serif" }} lang="ar">
            أب
          </motion.span>
        </div>
      );
  }
}

export function Expertise() {
  const { lang } = useLang();
  const c = useCopy({
    en: {
      eyebrow: "Capabilities",
      h1: "Full stack",
      h2: "of taste & craft.",
      p: "I'm a one person studio for three things: building websites, designing them (and advising on them), and designing the brand identity they carry. For anything bigger I assemble teams I trust and lead them on the work.",
      next: "Next",
      ctaA: "Have something in mind?",
      ctaB: "Let's build it.",
      cta: "Start a project",
      cursor: "Contact",
    },
    ar: {
      eyebrow: "القدرات",
      h1: "كل ما يلزم",
      h2: "من ذوق وحِرفة.",
      p: "أنا استوديو من شخص واحد لثلاثة أمور: بناء المواقع، وتصميمها وتقديم الاستشارات فيها، وتصميم الهوية البصرية التي تحملها. وللمشاريع الأكبر أجمع فرقًا أثق بها وأقودها في العمل.",
      next: "التالي",
      ctaA: "لديك فكرة؟",
      ctaB: "لنبنِها معًا.",
      cta: "ابدأ مشروعًا",
      cursor: "تواصل",
    },
  });

  const listRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 26, mass: 0.6 });
  const y = useSpring(my, { stiffness: 260, damping: 26, mass: 0.6 });

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const r = listRef.current!.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  return (
    <section id="services" className="relative z-10 -mt-10 scroll-mt-24 border-b border-line sm:-mt-12 md:-mt-14">
      {/* opaque dark panel with rounded top — slides up over the white Process sheet */}
      <div className="rounded-t-[40px] bg-ink px-5 py-32 sm:rounded-t-[50px] md:rounded-t-[60px] md:px-10 md:py-40">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-16 grid grid-cols-12 items-end gap-y-8 md:mb-20">
            <div className="col-span-12 md:col-span-6">
              <Eyebrow index="07">{c.eyebrow}</Eyebrow>
              <h2 key={lang} className="mt-6 text-display size-h2 text-bone">
                <RevealWords text={c.h1} />
                <br />
                <span className="italic text-bone/80">
                  <RevealWords text={c.h2} delay={0.1} />
                </span>
              </h2>
            </div>
            <div className="col-span-12 md:col-span-5 md:col-start-8">
              <Reveal>
                <p className="text-sm leading-relaxed text-bone/65">{c.p}</p>
              </Reveal>
            </div>
          </div>

          <div ref={listRef} onPointerMove={onMove} onPointerLeave={() => setHover(null)} className="relative">
            {CAPABILITIES.map((cap, i) => {
              const item = lang === "ar" ? cap.ar : cap;
              const on = hover === i;
              return (
                <motion.div
                  key={cap.title}
                  data-tick
                  onPointerEnter={(e) => e.pointerType !== "touch" && setHover(i)}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-8% 0px" }}
                  transition={{ duration: 0.9, ease: EASE, delay: 0.04 * i }}
                  className="relative overflow-hidden border-t border-line"
                >
                  {/* the ember sheet */}
                  <span
                    aria-hidden
                    className="absolute inset-0 origin-left bg-accent transition-transform duration-[650ms] ease-[cubic-bezier(0.19,1,0.22,1)] rtl:origin-right"
                    style={{ transform: `scaleX(${on ? 1 : 0})` }}
                  />
                  <div className="relative grid grid-cols-12 items-center gap-x-6 gap-y-4 px-1 py-7 md:px-6 md:py-9">
                    <span className={`col-span-2 text-mono text-[11px] uppercase tracking-[0.22em] transition-colors duration-500 md:col-span-1 ${on ? "text-ink/70" : "text-bone/40"}`}>
                      <span dir="ltr">0{i + 1}</span>
                    </span>
                    <h3
                      className={`col-span-10 text-display leading-[0.95] rtl:leading-[1.3] transition-[color,transform] duration-[650ms] ease-[cubic-bezier(0.19,1,0.22,1)] md:col-span-7 ${on ? "translate-x-4 text-ink rtl:-translate-x-4" : "text-bone"}`}
                      style={{ fontSize: "clamp(2rem, 5.4vw, 5.6rem)" }}
                    >
                      {item.title}
                    </h3>
                    <ul className="col-span-12 flex flex-wrap gap-x-5 gap-y-1.5 md:col-span-4 md:block md:space-y-1.5">
                      {item.items.map((it) => (
                        <li key={it} className={`flex items-center gap-2.5 text-[13px] transition-colors duration-500 ${on ? "text-ink/80" : "text-bone/55"}`}>
                          <span className={`h-px w-3 ${on ? "bg-ink/50" : "bg-bone/30"}`} />
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}

            {/* the lens */}
            <motion.div style={{ x, y }} className="pointer-events-none absolute left-0 top-0 z-20 hidden md:block" aria-hidden>
              <AnimatePresence>
                {hover !== null ? (
                  <motion.div
                    key="lens"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 24 }}
                    className="-ml-[80px] -mt-[80px] flex h-[160px] w-[160px] items-center justify-center rounded-full bg-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div key={hover} initial={{ opacity: 0, scale: 0.6, rotate: -20 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.6, rotate: 20 }} transition={{ duration: 0.25 }}>
                        <Glyph i={hover} />
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>

            {/* the last row: the way in */}
            <a
              href="#contact"
              data-cursor="link"
              data-cursor-label={c.cursor}
              className="group relative flex flex-col gap-6 overflow-hidden border-y border-line py-10 md:flex-row md:items-center md:justify-between md:py-14"
            >
              <span className="pointer-events-none absolute -end-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl transition-opacity duration-500 group-hover:opacity-100 md:opacity-60" />
              <div className="relative">
                <span className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40">{c.next}</span>
                <h3 className="mt-4 max-w-3xl text-display leading-[1.02] text-bone" style={{ fontSize: "clamp(1.8rem, 3.6vw, 3.6rem)" }}>
                  {c.ctaA} <span className="italic text-accent">{c.ctaB}</span>
                </h3>
              </div>
              <span className="relative inline-flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-bone/20 text-mono text-[10px] uppercase tracking-[0.18em] text-bone transition-[background-color,border-color,color,transform] duration-500 group-hover:scale-110 group-hover:border-accent group-hover:bg-accent group-hover:text-ink md:h-32 md:w-32">
                <span className="max-w-[5.5rem] text-center leading-snug">{c.cta}</span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
