"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealWords } from "@/components/ui/reveal";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const PHRASES = [
  "FRAME RATE IS A FEATURE.",
  "EASING IS TASTE.",
  "WHITESPACE IS CONFIDENCE.",
  "MOTION IS LANGUAGE.",
];

export function MotionShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["6%", "-22%"]);
  const rot = useTransform(scrollYProgress, [0, 1], [-2.5, 2.5]);

  return (
    <section
      id="studio"
      ref={ref}
      className="relative overflow-hidden border-b border-line bg-ink py-32 md:py-40"
    >
      <div className="mx-auto mb-20 max-w-[1600px] px-5 md:px-10">
        <div className="grid grid-cols-12 items-end gap-y-8">
          <div className="col-span-12 md:col-span-6">
            <Eyebrow index="08">Studio · Motion</Eyebrow>
            <h2 className="mt-6 text-display size-h2 text-bone">
              <RevealWords text="Motion is the" />
              <br />
              <span className="italic text-accent">
                <RevealWords text="invisible script." delay={0.1} />
              </span>
            </h2>
          </div>
          <div className="col-span-12 md:col-span-5 md:col-start-8">
            <ScrollReveal
              className="text-sm leading-relaxed text-bone/90"
              text="Animations don't decorate the interface, they choreograph the user's attention. I treat every easing curve, stagger, and pause as a director treats a cut."
            />
          </div>
        </div>
      </div>

      {/* Horizontal-scroll style band — four unique phrases, no repetition */}
      <motion.div style={{ x, rotate: rot }} className="flex w-max items-center gap-8 will-change-transform">
        {PHRASES.map((p, i) => (
          <span
            key={i}
            className="flex items-center gap-8 text-display text-[clamp(2rem,6vw,5.5rem)] leading-none text-bone"
          >
            <span className={i % 2 ? "italic text-bone/80" : ""}>{p}</span>
            <span className="inline-block h-3 w-3 rounded-full bg-accent" />
          </span>
        ))}
      </motion.div>

      {/* Demo tiles row */}
      <div className="mx-auto mt-24 grid max-w-[1600px] grid-cols-12 gap-4 px-5 md:gap-6 md:px-10">
        <DemoTile
          title="Magnetic"
          subtitle="Cursor aware interaction"
          className="col-span-12 md:col-span-4"
        >
          <div className="relative flex h-full items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="h-32 w-32 rounded-full bg-gradient-to-br from-accent to-plasma blur-2xl"
            />
            <span className="absolute text-display text-[3.5rem] italic text-bone">pull.</span>
          </div>
        </DemoTile>

        <DemoTile
          title="Stagger"
          subtitle="Sequenced reveal logic"
          className="col-span-12 md:col-span-4"
        >
          <div className="flex h-full items-end justify-center gap-2 pb-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ height: 8 }}
                animate={{ height: [8, 60 + (i % 4) * 20, 8] }}
                transition={{
                  duration: 1.8,
                  delay: i * 0.08,
                  repeat: Infinity,
                  ease: [0.19, 1, 0.22, 1],
                }}
                className="w-2 rounded-full bg-bone"
              />
            ))}
          </div>
        </DemoTile>

        <DemoTile
          title="Iridescence"
          subtitle="GPU driven color"
          className="col-span-12 md:col-span-4"
        >
          <motion.div
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="h-full w-full"
            style={{
              backgroundImage:
                "linear-gradient(120deg, #7c3aed 0%, #22d3ee 25%, #ff4d1f 50%, #efeae2 75%, #7c3aed 100%)",
              backgroundSize: "300% 100%",
              filter: "blur(0.3px)",
            }}
          />
        </DemoTile>
      </div>
    </section>
  );
}

function DemoTile({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-line bg-ash ${className}`}>
      <div className="absolute left-6 top-6 z-10">
        <p className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40">{subtitle}</p>
        <p className="mt-1 text-display text-2xl italic text-bone">{title}</p>
      </div>
      <div className="relative aspect-[4/3]">{children}</div>
    </div>
  );
}
