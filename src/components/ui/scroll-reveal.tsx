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
  const opacity = useTransform(progress, [start, end], [0.12, 1]);
  const filter = useTransform(progress, [start, end], [`blur(${blur}px)`, "blur(0px)"]);
  return (
    <motion.span style={{ opacity, filter }} className="inline-block">
      {word}&nbsp;
    </motion.span>
  );
}

/**
 * ScrollReveal — the paragraph eases from a faint tilt while each word
 * sharpens (opacity 0.12 → 1, blur → 0) in reading order, scrubbed by scroll.
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
