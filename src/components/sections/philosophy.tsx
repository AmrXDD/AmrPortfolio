"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealWords } from "@/components/ui/reveal";

const TENETS = [
  { n: "01", t: "Restraint is a feature.", b: "Every element on screen is an obligation. Remove until it hurts. Then remove one more." },
  { n: "02", t: "Motion is meaning.", b: "If a transition doesn't communicate hierarchy or causality, it shouldn't exist." },
  { n: "03", t: "Speed is a love letter.", b: "Frame rate, time-to-interactive, latency — these are how a product respects the person using it." },
  { n: "04", t: "Brand lives in the details.", b: "The kerning of the caption. The easing of the toast. The empty state nobody will see." },
];

export function Philosophy() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-b border-line bg-ink px-5 py-32 md:px-10 md:py-40"
    >
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-20 grid grid-cols-12 gap-y-8">
          <div className="col-span-12 md:col-span-4">
            <Eyebrow index="09">Manifesto</Eyebrow>
          </div>
          <div className="col-span-12 md:col-span-8">
            <h2 className="text-display size-h2 text-bone">
              <RevealWords text="Four convictions" />
              <br />
              <span className="italic text-bone/80">
                <RevealWords text="I won't negotiate." delay={0.1} />
              </span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px bg-line md:grid-cols-2">
          {TENETS.map((t) => (
            <div
              key={t.n}
              data-tick
              className="group relative flex flex-col gap-8 bg-ink p-10 transition-colors duration-500 hover:bg-ash md:p-16"
            >
              <span className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40">
                {t.n}
              </span>
              <h3 className="text-display text-[clamp(2rem,3.6vw,3.5rem)] leading-[1] text-bone">
                {t.t}
              </h3>
              <p className="max-w-md text-base leading-relaxed text-bone/65">{t.b}</p>
              <div className="mt-auto h-px w-12 origin-left bg-accent transition-transform duration-700 group-hover:scale-x-[4]" />
            </div>
          ))}
        </div>
      </div>

      <motion.div
        style={{ y }}
        className="pointer-events-none absolute bottom-6 left-0 right-0 select-none whitespace-nowrap text-center text-display text-[clamp(2.75rem,12vw,12rem)] italic leading-none text-bone/[0.05]"
      >
        conviction.
      </motion.div>
    </section>
  );
}
