"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * A hairline scroll-progress bar pinned to the top of the viewport — a quiet,
 * premium signal of where you are in the page. Spring-smoothed so it glides with
 * the Lenis inertia rather than snapping.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="pointer-events-none fixed left-0 top-0 z-[130] h-[2px] w-full origin-left bg-accent"
    />
  );
}
