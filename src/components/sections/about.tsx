"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal, RevealWords } from "@/components/ui/reveal";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const STATS = [
  { v: "07+", l: "Years shipping" },
  { v: "40+", l: "Products" },
  { v: "12", l: "Studios" },
  { v: "98", l: "Avg Lighthouse" },
];

export function About() {
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
            <Eyebrow index="00">Profile</Eyebrow>
            <p className="mt-6 text-mono text-[11px] uppercase tracking-[0.22em] text-bone/50">
              About / Philosophy
            </p>
          </div>

          <div className="col-span-12 md:col-span-8">
            <h2 className="text-display size-h2 text-bone">
              <RevealWords text="I build software the way" />
              <br />
              <span className="italic text-bone/90">
                <RevealWords text="film directors build scenes —" delay={0.1} />
              </span>
              <br />
              <RevealWords text="every frame is a decision," delay={0.2} />
              <br />
              <span className="text-accent">
                <RevealWords text="nothing is incidental." delay={0.3} />
              </span>
            </h2>

            <div className="mt-16 grid grid-cols-1 gap-12 md:grid-cols-2">
              {/* words sharpen out of a blur in reading order as you scroll */}
              <ScrollReveal
                className="text-base leading-relaxed text-bone"
                text="I'm Amr — a creative developer working at the seam between brand, product, and motion. I lead frontend on flagship work for studios and product teams who care about the millisecond, the kerning, the easing curve."
              />
              <ScrollReveal
                className="text-base leading-relaxed text-bone"
                text="My discipline is restraint at high resolution. Less surface, more depth. Every transition has a reason; every empty pixel was chosen. The portfolio you're reading is itself the proof."
              />
            </div>

            <div className="mt-20 grid grid-cols-2 gap-8 border-t border-line pt-12 md:grid-cols-4">
              {STATS.map((s, i) => (
                <Reveal key={s.l} delay={i * 0.06}>
                  <div>
                    <div className="text-display text-[clamp(2.5rem,5vw,4rem)] leading-none text-bone">
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
        intention.
      </motion.div>
    </section>
  );
}
