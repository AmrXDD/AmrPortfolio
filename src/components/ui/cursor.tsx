"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/*
 * Telemetry-reticle cursor — a targeting bracket + orbiting tick that matches
 * the hero's "ORBITAL · TELEMETRY" language. Corner brackets snap open on
 * interactive elements and surface a label; a thin ring keeps orbiting.
 */
export function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  // fast dot, slower reticle for a little lag/inertia
  const dotX = useSpring(x, { stiffness: 900, damping: 60, mass: 0.3 });
  const dotY = useSpring(y, { stiffness: 900, damping: 60, mass: 0.3 });
  const ringX = useSpring(x, { stiffness: 220, damping: 26, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 220, damping: 26, mass: 0.6 });

  const [mode, setMode] = useState<"default" | "link" | "view" | "drag">("default");
  const [label, setLabel] = useState("");
  const [visible, setVisible] = useState(false);
  const [down, setDown] = useState(false);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setTouch(coarse);
    if (coarse) return;
    document.documentElement.classList.add("cursor-none");

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!visible) setVisible(true);
    };
    const onLeave = () => setVisible(false);
    const onDown = () => setDown(true);
    const onUp = () => setDown(false);
    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest?.("[data-cursor]");
      if (!el) {
        setMode("default");
        setLabel("");
        return;
      }
      const m = (el.getAttribute("data-cursor") || "link") as typeof mode;
      setMode(m);
      setLabel(el.getAttribute("data-cursor-label") || "");
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mouseover", onOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mouseover", onOver);
      document.documentElement.classList.remove("cursor-none");
    };
  }, [x, y, visible]);

  if (touch) return null;

  const active = mode !== "default";
  const size = mode === "view" ? 92 : mode === "link" ? 58 : mode === "drag" ? 74 : 34;
  const gap = active ? 0 : 8; // brackets pull in tight when idle
  const bracket = "absolute h-3 w-3 border-accent";

  return (
    <>
      {/* soft accent glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[210] rounded-full"
        style={{
          translateX: dotX,
          translateY: dotY,
          width: active ? 70 : 30,
          height: active ? 70 : 30,
          x: "-50%",
          y: "-50%",
          background:
            "radial-gradient(circle, rgba(255,77,31,0.5) 0%, rgba(255,77,31,0.12) 45%, transparent 72%)",
          filter: "blur(7px)",
          opacity: visible ? 1 : 0,
          transition: "width 0.25s ease, height 0.25s ease",
        }}
      />

      {/* orbiting reticle: 4 corner brackets + a rotating hairline ring */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[211] flex items-center justify-center"
        style={{
          translateX: ringX,
          translateY: ringY,
          width: size,
          height: size,
          x: "-50%",
          y: "-50%",
          opacity: visible ? 1 : 0,
        }}
        transition={{ width: { duration: 0.25 }, height: { duration: 0.25 } }}
      >
        {/* rotating hairline ring */}
        <motion.span
          className="absolute inset-0 rounded-full border border-dashed border-bone/25"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{ scale: down ? 0.86 : 1 }}
        />
        {/* corner brackets */}
        <motion.span animate={{ x: -gap, y: -gap }} className={`${bracket} left-0 top-0 border-l-2 border-t-2`} />
        <motion.span animate={{ x: gap, y: -gap }} className={`${bracket} right-0 top-0 border-r-2 border-t-2`} />
        <motion.span animate={{ x: -gap, y: gap }} className={`${bracket} bottom-0 left-0 border-b-2 border-l-2`} />
        <motion.span animate={{ x: gap, y: gap }} className={`${bracket} bottom-0 right-0 border-b-2 border-r-2`} />

        {label ? (
          <span className="text-mono absolute -bottom-6 whitespace-nowrap text-[9px] uppercase tracking-[0.24em] text-accent">
            {label}
          </span>
        ) : null}
      </motion.div>

      {/* precise center dot */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[212] rounded-full bg-accent"
        style={{
          translateX: dotX,
          translateY: dotY,
          width: down ? 4 : 6,
          height: down ? 4 : 6,
          x: "-50%",
          y: "-50%",
          opacity: visible ? 1 : 0,
          boxShadow: "0 0 8px rgba(255,77,31,0.9)",
        }}
      />
    </>
  );
}
