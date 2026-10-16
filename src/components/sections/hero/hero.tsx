"use client";

import dynamic from "next/dynamic";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Magnetic } from "@/components/ui/magnetic";
import { WhatsAppCTA } from "@/components/ui/wa-cta";
import { SITE, SITE_AR } from "@/lib/constants";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/components/providers/theme-provider";
import { ParticleType } from "./particle-type";

const SideRays = dynamic(() => import("@/components/ui/side-rays").then((m) => m.SideRays), { ssr: false });

/*
 * The hero: the headline is made of light. The real <h1> stays in the page
 * (transparent while the particles are live) so search, screen readers and
 * the layout all use real text; a 2D canvas redraws it as particles that
 * swirl in on entry, part around the cursor, scatter on click and fall away
 * as you scroll into the work.
 */
export function Hero() {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const l1 = useRef<HTMLSpanElement>(null);
  const l2 = useRef<HTMLSpanElement>(null);
  const l3 = useRef<HTMLSpanElement>(null);
  const engineRef = useRef<ParticleType | null>(null);
  const [live, setLive] = useState(false); // particles own the headline
  const [count, setCount] = useState(0);
  const [entered, setEntered] = useState(false);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const fadeUi = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const liftUi = useTransform(scrollYProgress, [0, 0.35], ["0%", "-12%"]);
  useMotionValueEvent(scrollYProgress, "change", (p) => engineRef.current?.scroll(p * 1.6));

  // Hold the intro until the visitor actually enters (preloader click).
  useEffect(() => {
    const onEnter = () => setEntered(true);
    window.addEventListener("ambient:start", onEnter);
    if (!document.documentElement.classList.contains("preloading")) setEntered(true);
    const fb = setTimeout(() => setEntered(true), 9000); // safety net
    return () => {
      window.removeEventListener("ambient:start", onEnter);
      clearTimeout(fb);
    };
  }, []);

  // Build the particles behind the preloader (idle time), run them once in.
  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    const host = ref.current;
    if (!canvas || !host || !l1.current || !l2.current || !l3.current) return;
    let engine: ParticleType;
    try {
      engine = new ParticleType(
        canvas,
        host,
        [
          { el: l1.current, color: "bone" },
          { el: l2.current, color: "boneSoft" },
          { el: l3.current, color: "accent" },
        ],
        { onCount: setCount }
      );
    } catch {
      return;
    }
    engineRef.current = engine;
    let alive = true;
    const ric = (window as unknown as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const idle = (cb: () => void) => (ric ? ric(cb, { timeout: 800 }) : setTimeout(cb, 120));
    idle(() => {
      engine.build().then(() => {
        if (alive) setLive(true);
      });
    });

    // re-sample when the layout changes (debounced)
    let tm = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(tm);
      tm = window.setTimeout(() => engine.build(), 220);
    });
    ro.observe(host);

    // only animate while the hero is on screen
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && document.documentElement.dataset.heroEntered) engine.start();
      else engine.stop();
    });
    io.observe(host);

    return () => {
      alive = false;
      clearTimeout(tm);
      ro.disconnect();
      io.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
    // re-sample for the other language's lines
  }, [reduce, lang]);

  useEffect(() => {
    if (!entered) return;
    document.documentElement.dataset.heroEntered = "1";
    const e = engineRef.current;
    if (!e) return;
    e.assemble();
    e.start();
  }, [entered, live]);

  useEffect(() => engineRef.current?.recolor(), [theme]);

  const onMove = (ev: React.PointerEvent) => {
    const r = ev.currentTarget.getBoundingClientRect();
    engineRef.current?.pointer(ev.clientX - r.left, ev.clientY - r.top, ev.pointerType !== "touch");
  };
  const onDown = (ev: React.PointerEvent) => {
    if ((ev.target as HTMLElement).closest("a,button")) return;
    const r = ev.currentTarget.getBoundingClientRect();
    engineRef.current?.blast(ev.clientX - r.left, ev.clientY - r.top);
  };

  const heroGL = entered && !process.env.NEXT_PUBLIC_NO_WEBGL;
  const ar = lang === "ar";
  const ink = live ? "text-transparent" : "";

  return (
    <section
      id="top"
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => engineRef.current?.pointer(-9999, -9999, false)}
      onPointerDown={onDown}
      className="relative min-h-[100svh] w-full overflow-hidden"
    >
      {/* ember light from the top corner */}
      <motion.div style={{ opacity: fadeUi }} className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        {heroGL ? (
          <SideRays
            speed={1.6}
            rayColor1="#ff4d1f"
            rayColor2="#ffb066"
            intensity={1.3}
            spread={2.4}
            origin={ar ? "top-left" : "top-right"}
            tilt={0}
            saturation={1.3}
            blend={0.6}
            falloff={1.7}
            opacity={0.55}
          />
        ) : null}
      </motion.div>

      {/* the particles: the visible headline */}
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 z-[5]" />

      {/* telemetry */}
      <motion.div
        style={{ opacity: fadeUi }}
        className="pointer-events-none absolute inset-x-5 top-24 z-10 hidden items-center justify-between text-mono text-[10px] uppercase tracking-[0.22em] text-bone/50 md:flex md:inset-x-10"
      >
        <span dir="ltr">N 29°20&apos;21&quot; · E 48°04&apos;34&quot;</span>
        {live && count ? (
          <span>
            <span dir="ltr">{count.toLocaleString("en")}</span>{" "}
            {ar ? "جسيم · حرّك المؤشر · انقر للتشتيت" : "particles · move to disturb · click to scatter"}
          </span>
        ) : null}
      </motion.div>

      <motion.div
        style={{ opacity: fadeUi, y: liftUi }}
        className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1600px] flex-col justify-center px-5 pb-16 pt-28 md:px-10"
      >
        <div className="mb-8 flex items-center gap-3">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)]" />
          <span className="eyebrow">{t("hero.available")}</span>
        </div>

        <h1 key={lang} className="select-none text-display text-bone" style={{ letterSpacing: "0" }}>
          <span ref={l1} className={`block whitespace-nowrap leading-[1.02] ${ink}`} style={{ fontSize: "clamp(1.8rem, 7.2vw, 8rem)" }}>
            {t("hero.line1")}
          </span>
          <span ref={l2} className={`block whitespace-nowrap italic leading-[1.02] text-bone/85 ${ink}`} style={{ fontSize: "clamp(1.8rem, 7.2vw, 8rem)" }}>
            {t("hero.line2")}
          </span>
          <span className="relative inline-block">
            <span ref={l3} className={`block whitespace-nowrap leading-[1.02] text-accent ${ink}`} style={{ fontSize: "clamp(1.8rem, 7.2vw, 8rem)" }}>
              {t("hero.line3")}
            </span>
            <motion.span
              initial={{ scaleX: 0 }}
              animate={entered ? { scaleX: 1 } : {}}
              transition={{ delay: 1.6, duration: 1.1, ease: [0.19, 1, 0.22, 1] }}
              className="absolute -bottom-1 left-0 right-0 h-[3px] origin-left bg-accent rtl:origin-right md:h-[4px]"
            />
          </span>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={entered ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.2, duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
          className="mt-10 grid max-w-3xl gap-6 md:grid-cols-[1fr_auto] md:items-end"
        >
          <div>
            <p className="text-mono text-[11px] uppercase tracking-[0.22em] text-bone/50">{ar ? SITE_AR.role : SITE.role}</p>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-bone/80">{t("hero.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Magnetic strength={0.2}>
              <a href="#work" data-cursor="link" data-cursor-label={ar ? "عرض" : "View"} className="btn-ghost">
                <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-bone" />
                  <span className="relative h-1 w-1 rounded-full bg-bone" />
                </span>
                {t("cta.selectedWork")}
              </a>
            </Magnetic>
            <WhatsAppCTA label={t("cta.startProject")} message={ar ? "مرحبًا عمرو، شاهدت أعمالك وأريد بدء مشروع." : undefined} />
          </div>
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.div style={{ opacity: fadeUi }} className="absolute bottom-8 start-5 z-10 md:start-10">
        <span className="text-mono text-[10px] uppercase tracking-[0.3em] text-bone/40">{ar ? "مرّر" : "Scroll"}</span>
        <div className="mt-3 h-10 w-px overflow-hidden bg-bone/10">
          <motion.div animate={{ y: ["-100%", "100%"] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="h-full w-full bg-bone" />
        </div>
      </motion.div>
    </section>
  );
}
