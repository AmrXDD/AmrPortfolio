"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { cn } from "@/lib/cn";

function Char({
  c,
  i,
  total,
  progress,
}: {
  c: string;
  i: number;
  total: number;
  progress: MotionValue<number>;
}) {
  // each character brightens from 0.2 → 1 as the scroll sweep passes it
  const opacity = useTransform(progress, [i / total, (i + 1) / total], [0.2, 1]);
  return <motion.span style={{ opacity }}>{c}</motion.span>;
}

/**
 * Character-by-character scroll reveal: the paragraph sits at 20% opacity and
 * each character lights up in reading order as it crosses the viewport band
 * (start 0.8 → end 0.2) — the text literally reads itself in as you scroll.
 * Split per word (chars inside) so words never break mid-line.
 */
export function AnimatedChars({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.2"],
  });

  if (reduce) {
    return <p className={className}>{text}</p>;
  }

  const words = text.split(" ");
  const total = text.length;
  let idx = 0;

  return (
    <p ref={ref} className={cn(className)} aria-label={text}>
      {words.map((w, wi) => {
        const start = idx;
        idx += w.length + 1; // + the following space
        return (
          <span key={wi} className="inline-block whitespace-nowrap" aria-hidden>
            {w.split("").map((c, ci) => (
              <Char key={ci} c={c} i={start + ci} total={total} progress={scrollYProgress} />
            ))}
            {wi < words.length - 1 ? <span>&nbsp;</span> : null}
          </span>
        );
      })}
    </p>
  );
}
