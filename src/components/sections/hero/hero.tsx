"use client";

import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Magnetic } from "@/components/ui/magnetic";
import { WhatsAppCTA } from "@/components/ui/wa-cta";
import { RevealWords } from "@/components/ui/reveal";
import { SITE } from "@/lib/constants";
import { useLang } from "@/lib/i18n";

const OrbitalCanvas = dynamic(() => import("./orbital"), { ssr: false });
const SideRays = dynamic(() => import("@/components/ui/side-rays").then((m) => m.SideRays), { ssr: false });

export function Hero() {
  const { t, lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  // Fade content out quickly so the time-travel warp plays over a clean,
  // text-free field as the hero scrolls away.
  const opacity = useTransform(scrollYProgress, [0, 0.32], [1, 0]);

  // Hold the hero's intro animations until the visitor actually enters the site
  // (clicks a choice in the preloader, which dispatches "ambient:start"), so the
  // reveal plays for them rather than behind the loading screen.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const onEnter = () => setEntered(true);
    window.addEventListener("ambient:start", onEnter);
    const fb = setTimeout(() => setEntered(true), 9000); // safety net
    return () => {
      window.removeEventListener("ambient:start", onEnter);
      clearTimeout(fb);
    };
  }, []);

  // Hero WebGL (orbital + rays) mounts the INSTANT the visitor enters — they
  // should already be there as the loader lifts, not fade in late. Nothing
  // mounts before entering, so the loader itself still stays jank-free.
  const heroGL = entered && !process.env.NEXT_PUBLIC_NO_WEBGL;

  return (
    <section id="top" ref={ref} className="relative min-h-[100svh] w-full overflow-hidden">
      {/* Volumetric ember light-rays sweeping from the top-right, behind the orb */}
      <motion.div style={{ opacity }} className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        {heroGL ? (
          <SideRays
            speed={2}
            rayColor1="#ff4d1f"
            rayColor2="#ffb066"
            intensity={1.5}
            spread={2.2}
            origin="top-right"
            tilt={0}
            saturation={1.4}
            blend={0.62}
            falloff={1.6}
            opacity={0.7}
          />
        ) : null}
      </motion.div>

      {/* Orbital telemetry sphere — fades into the cosmic field on its left edge
          so the hero reads as one continuous field, not two halves. */}
      <motion.div
        style={{
          opacity,
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 40%)",
          maskImage: "linear-gradient(to right, transparent 0%, #000 40%)",
        }}
        className="pointer-events-none absolute inset-y-0 right-0 z-0 w-full md:w-[74%]"
      >
        {heroGL ? <OrbitalCanvas /> : null}
      </motion.div>

      {/* Telemetry frame markers */}
      <div className="pointer-events-none absolute inset-x-5 top-24 z-10 hidden items-center justify-between text-mono text-[10px] uppercase tracking-[0.22em] text-bone/50 md:flex md:inset-x-10">
        <span>N 29°20&apos;21&quot; · E 48°04&apos;34&quot;</span>
        <span>ORBITAL · TELEMETRY · v.05</span>
      </div>

      {/* Content grid — typography confined to the LEFT track */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 mx-auto grid min-h-[100svh] max-w-[1600px] grid-cols-1 items-center px-5 md:grid-cols-12 md:px-10"
      >
        <div key={entered ? "in" : "pre"} className="md:col-span-7 lg:col-span-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)]" />
            <span className="eyebrow">{t("hero.available")}</span>
          </div>

          {/* Sharp, medium editorial rows */}
          <h1 key={lang} className="text-display select-none text-bone" style={{ fontSize: "clamp(1.5rem, 3.4vw, 3rem)", lineHeight: 1.08, letterSpacing: "0" }}>
            <span className="block">
              <RevealWords text={t("hero.line1")} stagger={0.05} />
            </span>
            <span className="block italic text-bone/85">
              <RevealWords text={t("hero.line2")} stagger={0.05} delay={0.12} />
            </span>
            <span className="relative block">
              <span className="relative inline-block">
                <RevealWords text={t("hero.line3")} stagger={0.05} delay={0.24} />
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1.0, duration: 1.1, ease: [0.19, 1, 0.22, 1] }}
                  className="absolute -bottom-2 left-0 right-0 h-[3px] origin-left bg-accent md:h-[4px]"
                />
              </span>
            </span>
          </h1>

          <p className="mt-7 max-w-md text-mono text-[11px] uppercase tracking-[0.22em] text-bone/50">
            {SITE.role}
          </p>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-bone/80">
            {t("hero.subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Magnetic strength={0.2}>
              <a href="#work" data-cursor="link" data-cursor-label="View" className="btn-ghost">
                <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-bone" />
                  <span className="relative h-1 w-1 rounded-full bg-bone" />
                </span>
                {t("cta.selectedWork")}
              </a>
            </Magnetic>
            <WhatsAppCTA label={t("cta.startProject")} />
          </div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div style={{ opacity }} className="absolute bottom-8 left-5 z-10 md:left-10">
        <span className="text-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">Scroll</span>
        <div className="mt-3 h-10 w-px overflow-hidden bg-bone/10">
          <motion.div
            animate={{ y: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-full w-full bg-bone"
          />
        </div>
      </motion.div>
    </section>
  );
}
