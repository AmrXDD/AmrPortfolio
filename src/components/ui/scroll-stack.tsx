"use client";

import { Children, useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { cn } from "@/lib/cn";

function Item({
  children,
  i,
  n,
  progress,
  reduce,
}: {
  children: ReactNode;
  i: number;
  n: number;
  progress: MotionValue<number>;
  reduce: boolean;
}) {
  // cards already passed shrink slightly so the pile reads as layered sheets
  const scale = useTransform(progress, [i / n, 1], [1, 1 - (n - 1 - i) * 0.05]);
  if (reduce) return <div className="mb-6">{children}</div>;
  return (
    <div className="h-[72vh]">
      <motion.div
        style={{ scale, top: `calc(96px + ${i * 26}px)`, transformOrigin: "top center" }}
        className="sticky will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Sticky-stacking cards: each card pins and scales down as the next covers it. */
export function ScrollStack({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const items = Children.toArray(children);
  return (
    <div ref={ref} className={className}>
      {items.map((c, i) => (
        <Item key={i} i={i} n={items.length} progress={scrollYProgress} reduce={!!reduce}>
          {c}
        </Item>
      ))}
    </div>
  );
}

export function ScrollStackItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[32px] border border-line bg-ash shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] sm:rounded-[40px]",
        className
      )}
    >
      {children}
    </div>
  );
}
