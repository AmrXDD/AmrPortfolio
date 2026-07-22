"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useIsMobile } from "@/lib/use-mobile";

const LaptopCanvas = dynamic(() => import("./laptop-3d"), { ssr: false });

export function LaptopScene() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Mount eagerly + keep mounted (no context churn). Off-screen the canvas
  // frameloop is fully STOPPED (not just our updates) — zero GPU cost.
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  // Warm-up window: right after mount we render the scene OFF-screen for a
  // couple of seconds so the GLTF, environment map, textures and shaders all
  // compile/upload during page-load idle time — that first compile is the
  // 1–1.5s stutter, so doing it early (while the user is at the top) removes it.
  const [warm, setWarm] = useState(false);
  // Wait for the visitor to leave the loader before we touch WebGL — mounting
  // the canvas / warming it up while the loader is on screen is what janked it.
  const [entered, setEntered] = useState(false);
  const activeRef = useRef(false);

  useEffect(() => {
    const on = () => setEntered(true);
    window.addEventListener("ambient:start", on);
    // No loader running (e.g. client-side nav)? Proceed right away.
    if (!document.documentElement.classList.contains("preloading")) setEntered(true);
    return () => window.removeEventListener("ambient:start", on);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        activeRef.current = e.isIntersecting;
        setActive(e.isIntersecting);
      },
      { rootMargin: "80% 0px 80% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Mount the canvas only once we're past the loader AND its exit glide has
  // finished (~1.3s), so its WebGL init never janks the loader or the handoff.
  useEffect(() => {
    if (!entered) return;
    const t = setTimeout(() => setMounted(true), 1400);
    return () => clearTimeout(t);
  }, [entered]);

  // Warm-up window once the canvas is mounted: render off-screen for a couple of
  // seconds so the GLTF, env map, textures and shaders compile ahead of the
  // section arriving — killing the on-approach stutter.
  useEffect(() => {
    if (!mounted) return;
    setWarm(true);
    const t = setTimeout(() => setWarm(false), 2800);
    return () => clearTimeout(t);
  }, [mounted]);

  const introOpacity = useTransform(scrollYProgress, [0, 0.08, 0.16], [1, 1, 0]);
  const insideOpacity = useTransform(scrollYProgress, [0.42, 0.5, 0.74, 0.82], [0, 1, 1, 0]);
  const outroOpacity = useTransform(scrollYProgress, [0.86, 0.94], [0, 1]);

  // Mobile / reduced-motion: the 3D MacBook doesn't fit — clean static frame.
  if (reduce || isMobile) {
    return (
      <section id="craft" className="border-b border-line px-5 py-24">
        <div className="mx-auto max-w-[640px]">
          <Eyebrow index="A1">The Craft · Desktop</Eyebrow>
          <h2 className="mt-5 text-display size-h2 text-bone">Built for the big screen.</h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-bone/60">
            On desktop this opens into a live 3D MacBook playing a reel of recent builds.
            Here&apos;s the headline frame.
          </p>
          <div className="mt-8 overflow-hidden rounded-xl border border-line bg-ash">
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 text-mono text-[10px] tracking-wide text-bone/50">scenariosd.vercel.app</span>
            </div>
            <div className="relative aspect-[16/10]">
              <Image src="/projects/scenarios-mac.png" alt="Scenarios desktop build" fill className="object-cover object-top" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="craft" ref={ref} className="relative" style={{ height: "560vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[80vh] w-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[120px]" />

        {/* The real MacBook Pro M3 — renders during the warm-up window and when
            on screen; fully stops otherwise. */}
        <div className="absolute inset-0">
          {mounted ? <LaptopCanvas progress={scrollYProgress} activeRef={activeRef} frameloop={warm || active ? "always" : "never"} /> : null}
        </div>

        {/* Intro caption */}
        <motion.div style={{ opacity: introOpacity }} className="pointer-events-none absolute left-5 top-24 z-20 md:left-10 md:top-28">
          <Eyebrow index="A1">The Craft · Desktop</Eyebrow>
          <h2 className="mt-4 max-w-md text-display text-[clamp(1.75rem,4vw,3.25rem)] leading-[1.02] text-bone">
            Scroll to open <span className="italic text-bone/70">the build.</span>
          </h2>
        </motion.div>

        {/* Inside label */}
        <motion.div style={{ opacity: insideOpacity }} className="pointer-events-none absolute bottom-20 left-5 z-20 md:left-10">
          <Eyebrow index="LIVE">Inside · a reel of recent work</Eyebrow>
          <p className="mt-3 max-w-xs text-display text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.02] text-bone">
            Real builds, <span className="italic text-accent">playing live.</span>
          </p>
        </motion.div>

        {/* Outro */}
        <motion.div style={{ opacity: outroOpacity }} className="pointer-events-none absolute bottom-16 left-1/2 z-20 -translate-x-1/2 text-center">
          <p className="text-mono text-[10px] uppercase tracking-[0.3em] text-bone/45">Keep scrolling</p>
        </motion.div>
      </div>
    </section>
  );
}
