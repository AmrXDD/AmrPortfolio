"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EASE = [0.76, 0, 0.24, 1] as const;

export function Preloader() {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<"count" | "ready" | "exit">("count");
  const [mounted, setMounted] = useState(true);
  const lockedRef = useRef(false);

  // Lock scroll immediately
  useEffect(() => {
    document.documentElement.classList.add("preloading");
    (window as unknown as { __lenis?: { stop?: () => void } }).__lenis?.stop?.();
    lockedRef.current = true;
    return () => unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Count 00 → 100, then reveal the sound choice.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduce ? 400 : 1700;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const e = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - e, 3);
      setCount(Math.round(eased * 100));
      if (e < 1) raf = requestAnimationFrame(tick);
      else setPhase((p) => (p === "count" ? "ready" : p));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Safety: never get stuck on the counter if rAF is throttled.
  useEffect(() => {
    const t = setTimeout(() => {
      setCount(100);
      setPhase((p) => (p === "count" ? "ready" : p));
    }, 2600);
    return () => clearTimeout(t);
  }, []);

  // If the visitor doesn't choose within a while, enter silently so it never hangs.
  useEffect(() => {
    if (phase !== "ready") return;
    const t = setTimeout(() => enter(false), 8000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Release the scroll lock as the overlay begins to fade, and HARD-unmount
  // after the transition even if onExitComplete never fires (e.g. rAF throttled
  // on a backgrounded/slow load) — so the overlay can never get stuck.
  useEffect(() => {
    if (phase !== "exit") return;
    unlock();
    const t = setTimeout(() => setMounted(false), 1300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function enter(sound: boolean) {
    if (phase === "exit") return;
    window.dispatchEvent(new CustomEvent("ambient:start", { detail: { on: sound } }));
    setPhase("exit");
  }

  function unlock() {
    if (!lockedRef.current) return;
    lockedRef.current = false;
    document.documentElement.classList.remove("preloading");
    (window as unknown as { __lenis?: { start?: () => void } }).__lenis?.start?.();
    window.scrollTo(0, 0);
  }

  if (!mounted) return null;

  const split = phase !== "count";

  return (
    <AnimatePresence onExitComplete={() => setMounted(false)}>
      {phase !== "exit" && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.12, filter: "blur(6px)" }}
          transition={{ duration: 0.9, ease: EASE }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#000000]"
        >
          {/* Wordmark */}
          <div
            className="flex select-none items-center justify-center text-[#F5F5F5]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.25rem, 7.5vw, 5.5rem)",
              letterSpacing: "0",
              lineHeight: 1,
            }}
          >
            <motion.span
              animate={split ? { x: "-0.5ch", marginRight: "clamp(2rem,11vw,9rem)" } : {}}
              transition={{ duration: 0.9, ease: EASE }}
            >
              Amr
            </motion.span>
            <motion.span
              className="italic"
              style={{ fontFamily: "var(--font-serif)" }}
              animate={split ? { x: "0.5ch" } : {}}
              transition={{ duration: 0.9, ease: EASE }}
            >
              Studio
            </motion.span>
          </div>

          {/* Sound choice — appears once loaded */}
          <AnimatePresence>
            {phase === "ready" ? (
              <motion.div
                key="choice"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.35, duration: 0.6, ease: EASE }}
                className="mt-12 flex flex-col items-center gap-4"
              >
                <span className="text-mono text-[10px] uppercase tracking-[0.34em] text-[#F5F5F5]/45">
                  Best experienced with sound
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => enter(true)}
                    className="rounded-full bg-[#F5F5F5] px-6 py-3 text-mono text-[11px] uppercase tracking-[0.18em] text-[#000] transition-transform duration-300 hover:scale-[1.04]"
                  >
                    Enter with sound
                    <span className="ml-2 text-[#FF4D1F]">●</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => enter(false)}
                    className="rounded-full border border-[#F5F5F5]/25 px-6 py-3 text-mono text-[11px] uppercase tracking-[0.18em] text-[#F5F5F5]/70 transition-colors duration-300 hover:border-[#F5F5F5]/60 hover:text-[#F5F5F5]"
                  >
                    Enter silent
                  </button>
                </div>
                <span className="text-mono text-[9px] uppercase tracking-[0.3em] text-[#F5F5F5]/30">
                  Recommended: sound on
                </span>
                <span className="mt-1 max-w-[280px] text-center text-mono text-[9px] uppercase leading-relaxed tracking-[0.22em] text-[#FF4D1F]/70">
                  For the best experience, visit on a laptop / desktop
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Loading percentage */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#F5F5F5]/60 md:bottom-10" style={{ fontFamily: "var(--font-mono)" }}>
            <motion.span
              animate={phase !== "count" ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-[11px] uppercase tracking-[0.4em] tabular-nums"
            >
              {String(count).padStart(2, "0")}
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
