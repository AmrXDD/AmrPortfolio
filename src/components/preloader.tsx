"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { SITE } from "@/lib/constants";

const EASE = [0.76, 0, 0.24, 1] as const;
const LOADER_SCALE = 2.6; // how much bigger the logo is on the loader vs its final size

export function Preloader() {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<"count" | "ready" | "exit">("count");
  const [mounted, setMounted] = useState(true);
  // vertical offset (from viewport centre) the logo glides to on exit
  const [targetY, setTargetY] = useState(0);
  const [wordW, setWordW] = useState(0);
  const wordRef = useRef<HTMLSpanElement>(null);
  const lockedRef = useRef(false);

  // Measure the wordmark's natural width so we can wipe it open cleanly.
  useLayoutEffect(() => {
    if (wordRef.current) setWordW(wordRef.current.scrollWidth || wordRef.current.offsetWidth);
  }, []);

  // Lock scroll immediately, and keep it locked until the visitor chooses.
  useEffect(() => {
    document.documentElement.classList.add("preloading");
    (window as unknown as { __lenis?: { stop?: () => void } }).__lenis?.stop?.();
    lockedRef.current = true;
    return () => unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Count 00 → 100, then reveal the wordmark + sound choice.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduce ? 500 : 1900;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const e = Math.min(1, (t - start) / dur);
      setCount(Math.round((1 - Math.pow(1 - e, 3)) * 100));
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
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  // NO auto-enter and NO auto-sound: the loader waits indefinitely for a click.

  function enter(sound: boolean) {
    if (phase === "exit") return;
    // Both the loader group and the top-bar group are horizontally centred, so
    // we only need the vertical glide: measure the top-bar brand row's centre.
    const tc = document.querySelector('a[aria-label="Back to top"]') as HTMLElement | null;
    if (tc) {
      const r = tc.getBoundingClientRect();
      setTargetY(r.top + r.height / 2 - window.innerHeight / 2);
    } else {
      setTargetY(-(window.innerHeight / 2 - 34));
    }
    window.dispatchEvent(new CustomEvent("ambient:start", { detail: { on: sound } }));
    unlock();
    setPhase("exit");
    // Reveal the top-bar logo exactly when the glide lands (matches the 1.05s
    // transition), then unmount the loader just after so the handoff is seamless.
    setTimeout(() => window.dispatchEvent(new CustomEvent("brand:reveal")), 1050);
    setTimeout(() => setMounted(false), 1300);
  }

  function unlock() {
    if (!lockedRef.current) return;
    lockedRef.current = false;
    document.documentElement.classList.remove("preloading");
    (window as unknown as { __lenis?: { start?: () => void } }).__lenis?.start?.();
    window.scrollTo(0, 0);
  }

  if (!mounted) return null;

  const exiting = phase === "exit";
  const showWord = phase !== "count";

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden" style={{ pointerEvents: exiting ? "none" : "auto" }}>
      {/* Black backdrop that fades away as we glide out */}
      <motion.div
        className="absolute inset-0 bg-black"
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ duration: 0.9, ease: EASE, delay: exiting ? 0.2 : 0 }}
      />

      {/* Centre stage: the logo + wordmark group, centred, that glides up to
          its resting place on the top bar. Only the group is centred, so both
          loader and top-bar align horizontally and we only move vertically. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="flex items-center"
          animate={{ y: exiting ? targetY : 0, scale: exiting ? 1 : LOADER_SCALE }}
          transition={{ duration: 1.05, ease: EASE }}
        >
          <Logo size={26} />
          {/* wordmark wipes open from the logo's edge once loaded, then rides
              along to its resting spot next to the top-bar logo */}
          <motion.div
            className="overflow-hidden"
            initial={false}
            animate={{ width: showWord ? wordW : 0, marginLeft: showWord ? 10 : 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: showWord && !exiting ? 0.15 : 0 }}
          >
            <span
              ref={wordRef}
              className="text-mono block w-max whitespace-nowrap text-[11px] uppercase tracking-[0.24em] text-[#f5f5f5]"
            >
              {SITE.name}/studio
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Sound choice — appears once loaded, fades on exit */}
      <motion.div
        className="absolute inset-x-0 top-[58%] flex flex-col items-center gap-4"
        animate={{ opacity: phase === "ready" ? 1 : 0, y: phase === "ready" ? 0 : 14 }}
        transition={{ duration: 0.55, ease: EASE, delay: phase === "ready" ? 0.55 : 0 }}
        style={{ pointerEvents: phase === "ready" ? "auto" : "none" }}
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

      {/* Loading percentage */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#F5F5F5]/60 md:bottom-10"
        style={{ fontFamily: "var(--font-mono)" }}
        animate={{ opacity: phase === "count" ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="text-[11px] uppercase tracking-[0.4em] tabular-nums">{String(count).padStart(2, "0")}</span>
      </motion.div>
    </div>
  );
}
