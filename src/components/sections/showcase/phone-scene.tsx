"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Logo } from "@/components/ui/logo";
import { useIsMobile } from "@/lib/use-mobile";

const PhoneCanvas = dynamic(() => import("./phone-3d"), { ssr: false });

/* A composed, branded mobile app screen (static fallback for mobile/reduced). */
function MobileUI({ tall = false }: { tall?: boolean }) {
  const rows = [
    { t: "Scenarios", s: "Featured", c: "#FF4D1F" },
    { t: "Quipmed", s: "Live", c: "#7DD3A8" },
    { t: "LivFunctional", s: "Shipped", c: "#E0A45C" },
    { t: "Smartee", s: "Building", c: "#E0303A" },
  ];
  return (
    <div className="flex h-full w-full flex-col bg-ink text-bone">
      <div className="flex items-center justify-between px-5 pt-3 text-[10px] text-bone/70">
        <span className="font-mono tabular-nums">9:41</span>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-bone/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-bone/30" />
          <span className="h-2.5 w-4 rounded-[3px] bg-bone/40" />
        </div>
      </div>

      <div className="flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-2">
          <Logo size={22} />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bone">amr/studio</span>
        </div>
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-bone/70">
          <span className="text-base leading-none">≡</span>
        </span>
      </div>

      <div className="px-5 pt-5">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-ash p-5">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/40 blur-2xl" />
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone/50">Now booking · Q3</p>
          <p className="mt-2 text-display text-[26px] italic leading-[0.95]">Cinematic<br />interfaces.</p>
          <button className="mt-4 rounded-full bg-bone px-4 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-ink">
            Start a project →
          </button>
        </div>
      </div>

      <div className="mt-5 px-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone/40">Selected work</p>
        <div className="mt-3 space-y-2.5">
          {rows.map((r) => (
            <div key={r.t} className="flex items-center gap-3 rounded-xl border border-line bg-ash/60 p-3">
              <span className="h-9 w-9 rounded-lg" style={{ background: `linear-gradient(135deg, ${r.c}, #0a0a0a)` }} />
              <div className="flex-1">
                <p className="text-[13px]">{r.t}</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-bone/40">{r.s}</p>
              </div>
              <span className="text-bone/40">↗</span>
            </div>
          ))}
        </div>
      </div>

      {tall ? (
        <div className="mt-6 px-5 pb-4">
          <div className="rounded-2xl border border-line bg-gradient-to-br from-plasma/30 to-accent/20 p-5">
            <p className="text-display text-[22px] italic leading-tight">Let&apos;s build.</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-bone/60">Salmiya · GMT+3</p>
            <button className="mt-3 rounded-full bg-emerald-500 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white">WhatsApp →</button>
          </div>
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-around border-t border-line px-5 py-3 text-bone/50">
        {["◇", "▦", "✦", "○"].map((g, i) => (
          <span key={i} className={i === 0 ? "text-bone" : ""}>{g}</span>
        ))}
      </div>
    </div>
  );
}

export function PhoneScene() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Mount eagerly + keep mounted; off-screen the canvas frameloop fully stops.
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const activeRef = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    const el = ref.current;
    let io: IntersectionObserver | undefined;
    if (el) {
      io = new IntersectionObserver(
        ([e]) => {
          activeRef.current = e.isIntersecting;
          setActive(e.isIntersecting);
        },
        { rootMargin: "30% 0px 30% 0px" }
      );
      io.observe(el);
    }
    return () => {
      clearTimeout(t);
      io?.disconnect();
    };
  }, []);

  const introOpacity = useTransform(scrollYProgress, [0, 0.12, 0.2], [1, 1, 0]);
  const labelOpacity = useTransform(scrollYProgress, [0.46, 0.54, 0.8, 0.88], [0, 1, 1, 0]);

  // Mobile / reduced-motion: a clean static presentation instead of WebGL.
  if (reduce || isMobile) {
    return (
      <section className="border-b border-line px-5 py-24 md:px-10">
        <div className="mx-auto max-w-[320px]">
          <Eyebrow index="A2">The Craft · Mobile</Eyebrow>
          <div className="mt-8 overflow-hidden rounded-[2.4rem] border border-line" style={{ aspectRatio: "9 / 19" }}>
            <MobileUI tall />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative" style={{ height: "520vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-plasma/10 blur-[120px]" />

        {/* The real iPhone 15 Pro Max — frameloop stops entirely off-screen */}
        <div className="absolute inset-0">
          {mounted ? <PhoneCanvas progress={scrollYProgress} activeRef={activeRef} frameloop={active ? "always" : "never"} /> : null}
        </div>

        <motion.div style={{ opacity: introOpacity }} className="pointer-events-none absolute right-5 top-24 z-30 text-right md:right-10 md:top-28">
          <Eyebrow index="A2" className="justify-end">The Craft · Mobile</Eyebrow>
          <h2 className="mt-4 max-w-md text-display text-[clamp(1.75rem,4vw,3.25rem)] leading-[1.02] text-bone">
            Award-winning <span className="italic text-bone/70">on the small screen too.</span>
          </h2>
        </motion.div>

        <motion.div style={{ opacity: labelOpacity }} className="pointer-events-none absolute bottom-12 left-1/2 z-30 -translate-x-1/2 text-center">
          <Eyebrow index="LIVE">Live · the app shell, scrolling</Eyebrow>
        </motion.div>
      </div>
    </section>
  );
}
