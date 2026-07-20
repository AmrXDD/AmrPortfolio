"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronsDown } from "lucide-react";

// Shared flag: true while a nav-anchor scroll is animating, so the section
// auto-scroll never fights a click-to-section navigation.
let anchorScrolling = false;

/**
 * Hands all in-page anchor clicks (a[href^="#"]) to Lenis so the
 * scroll is animated instead of an instant native jump.
 * Honors prefers-reduced-motion automatically (Lenis no-ops).
 */
function AnchorScrollGlue() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    // Expose for debugging / precise programmatic scrolling
    (window as unknown as { __lenis?: unknown }).__lenis = lenis;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const link = (e.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]'
      ) as HTMLAnchorElement | null;
      if (!link) return;

      // Same document only
      if (link.origin !== window.location.origin) return;
      if (link.pathname !== window.location.pathname) return;

      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      const id = decodeURIComponent(href.slice(1));
      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();

      // Offset for the floating nav (~76px) plus a little breathing room
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      const offset = isMobile ? -72 : -88;

      // Suppress the section auto-scroll for the duration of this navigation.
      anchorScrolling = true;
      lenis.scrollTo(target, {
        offset,
        duration: 1.4,
        easing: (t: number) => 1 - Math.pow(1 - t, 4), // easeOutQuart
        onComplete: () => setTimeout(() => (anchorScrolling = false), 250),
      });

      // Update the URL hash without triggering native scroll
      history.pushState(null, "", href);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [lenis]);

  return null;
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Auto-scroll ONLY carries you from the hero into the next section — after that
// the whole page scrolls freely with no further takeovers.
const STOP_IDS = ["top", "stack"];

/**
 * Auto-scroll between IMPORTANT sections only. As you approach one of the stops
 * (or take the very first scroll out of the hero) the page takes over and glides
 * you the rest of the way in with a long, cinematic easing — while a clear
 * "Auto-scrolling" indicator shows so it never feels like the page ran away.
 */
function AutoScroll() {
  const lenis = useLenis();
  const [gliding, setGliding] = useState(false);

  useEffect(() => {
    if (!lenis) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targets: number[] = [];
    let busy = false;
    const fired = new Set<number>();

    // absolute document tops of the important stops, in order
    const measure = () => {
      const sy = window.scrollY;
      targets = STOP_IDS.map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => !!el)
        .map((el) => Math.round(el.getBoundingClientRect().top + sy))
        .sort((a, b) => a - b);
    };
    measure();
    const t1 = setTimeout(measure, 600);
    const t2 = setTimeout(measure, 1600);
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);

    const APPROACH = 0.8; // glide arms only ~0.8 viewport before the next stop
    const DWELL = 1.05; // …and never before the current stop had a full screen of dwell

    // the absolute y at which the glide INTO stop (i + 1) arms. The hero
    // (i = 0) arms on the very first downward scroll. Every other stop arms
    // close to the section boundary so a section's content fully plays out
    // (reveals, explosions, counters) before the page carries you onward.
    const armAt = (i: number, vh: number) =>
      i === 0
        ? 0.04 * vh
        : Math.max(targets[i] + DWELL * vh, targets[i + 1] - APPROACH * vh);

    const fly = (toY: number, dist: number) => {
      busy = true;
      setGliding(true);
      // longer travel → longer, smoother glide (clamped so it never drags)
      const dur = Math.min(2.1, Math.max(1.35, (dist / window.innerHeight) * 1.45));
      lenis.scrollTo(toY, {
        duration: dur,
        lock: true,
        easing: easeInOutCubic,
        onComplete: () => {
          setGliding(false);
          setTimeout(() => (busy = false), 90);
        },
      });
    };

    const onScroll = (e: { scroll: number; direction: number }) => {
      // a nav-link OR dock navigation owns the scroll — never hijack it
      if (anchorScrolling || (window as unknown as { __navLock?: boolean }).__navLock) return;
      const y = e.scroll;
      const vh = window.innerHeight;
      if (targets.length < 2) return;

      // current stop index = last stop at/above the viewport top
      let cur = 0;
      for (let i = 0; i < targets.length; i++) if (targets[i] <= y + 6) cur = i;

      // scrolling up — re-arm any glide we've moved back above
      if (e.direction === -1) {
        for (const i of [...fired]) if (y < armAt(i, vh) - 8) fired.delete(i);
        return;
      }
      if (busy) return;
      if (cur >= targets.length - 1) return; // past the last stop — free scroll

      const nextTop = targets[cur + 1];
      if (!fired.has(cur) && y > armAt(cur, vh) && y < nextTop - 6) {
        fired.add(cur);
        fly(nextTop, nextTop - y);
      }
    };

    lenis.on("scroll", onScroll);
    return () => {
      lenis.off("scroll", onScroll);
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [lenis]);

  return <AutoScrollIndicator active={gliding} />;
}

/** A clear, unobtrusive sign that the page is auto-scrolling itself. */
function AutoScrollIndicator({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed bottom-7 left-1/2 z-[150] -translate-x-1/2"
        >
          <div className="flex items-center gap-2.5 rounded-full border border-bone/20 bg-ink/70 px-5 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <motion.span
              animate={{ y: [0, 4, 0], opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              className="flex text-bone"
            >
              <ChevronsDown size={15} strokeWidth={2.2} />
            </motion.span>
            <span className="text-mono text-[10px] uppercase tracking-[0.3em] text-bone/85">
              Auto-scrolling
            </span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.085,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
        gestureOrientation: "vertical",
      }}
    >
      <AnchorScrollGlue />
      <AutoScroll />
      {children}
    </ReactLenis>
  );
}
