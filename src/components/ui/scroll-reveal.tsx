"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { cn } from "@/lib/cn";

function Word({
  word,
  progress,
  start,
  end,
  blur,
}: {
  word: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
  blur: number;
}) {
  // Opacity + a small lift only. A per-word CSS blur looked similar but made
  // every word its own filter layer, re-rasterised on every scroll frame.
  const opacity = useTransform(progress, [start, end], [0.12, 1]);
  const y = useTransform(progress, [start, end], [blur, 0]);
  return (
    <motion.span style={{ opacity, y }} className="inline-block">
      {word}&nbsp;
    </motion.span>
  );
}

/**
 * ScrollReveal — the paragraph eases from a faint tilt while each word
 * lights up (opacity 0.12 → 1, a small lift) in reading order, scrubbed by scroll.
 */
export function ScrollReveal({
  text,
  className,
  baseRotation = 2.5,
  blurStrength = 4,
}: {
  text: string;
  className?: string;
  baseRotation?: number;
  blurStrength?: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "start 0.4"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [baseRotation, 0]);

  if (reduce) return <p className={className}>{text}</p>;

  const words = text.split(/\s+/);
  return (
    <motion.p ref={ref} style={{ rotate, transformOrigin: "left center" }} className={cn(className)} aria-label={text}>
      {words.map((w, i) => {
        const start = (i / words.length) * 0.85;
        return <Word key={i} word={w} progress={scrollYProgress} start={start} end={start + 0.15} blur={blurStrength} />;
      })}
    </motion.p>
  );
}
