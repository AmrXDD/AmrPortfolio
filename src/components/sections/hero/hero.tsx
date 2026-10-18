"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Magnetic } from "@/components/ui/magnetic";
import { WhatsAppCTA } from "@/components/ui/wa-cta";
import { SITE, SITE_AR } from "@/lib/constants";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/components/providers/theme-provider";
import { EmberFluid } from "./ember-fluid";
import { ParticleType } from "./particle-type";

/*
 * The hero: the headline is on fire. The real <h1> stays in the page
 * (transparent while the fire is live) so search, screen readers and the
 * layout all use real text. A GPU fluid simulation burns the letters: on
 * entry a fuse runs along the title and each letter catches, smoke rises
 * and curls off them, the cursor stirs it, a click throws a fireball, and
 * scrolling lets the title burn away into smoke.
 *
 * Browsers without WebGL2 float targets get the particle headline instead.
 */

type Engine = {
  kind: "ember" | "particles";
  begin: () => void;
  rebuild: () => void;
  start: () => void;
  stop: () => void;
  dispose: () => void;
  pointer: (x: number, y: number, active: boolean) => void;
  blast: (x: number, y: number) => void;
  scroll: (p: number) => void;
  recolor?: () => void;
};

export function Hero() {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const l1 = useRef<HTMLSpanElement>(null);
  const l2 = useRef<HTMLSpanElement>(null);
  const l3 = useRef<HTMLSpanElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [live, setLive] = useState(false); // the effect owns the headline
  const [kind, setKind] = useState<Engine["kind"] | null>(null);
  const [count, setCount] = useState(0);
  const [entered, setEntered] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const fadeUi = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const liftUi = useTransform(scrollYProgress, [0, 0.35], ["0%", "-12%"]);
  useMotionValueEvent(scrollYProgress, "change", (p) => engineRef.current?.scroll(p * 1.6));

  // Hold the intro until the visitor actually enters (preloader click).
  useEffect(() => {
    const onEnter = () => setEntered(true);
    window.addEventListener("ambient:start", onEnter);
    // No timer: the fuse must never burn behind the Enter screen, however long
    // a visitor waits there. Enter as soon as the page is unlocked (or right
    // away if there is no Enter screen at all).
    const html = document.documentElement;
    const check = setTimeout(() => {
      if (!html.classList.contains("preloading")) setEntered(true);
    }, 80);
    const mo = new MutationObserver(() => {
      if (!html.classList.contains("preloading")) setEntered(true);
    });
    mo.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => {
      window.removeEventListener("ambient:start", onEnter);
      clearTimeout(check);
      mo.disconnect();
    };
  }, []);

  // Build the effect behind the preloader (idle time); run it once in.
  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    const host = ref.current;
    if (!canvas || !host || !l1.current || !l2.current || !l3.current) return;
    let alive = true;
    let engine: Engine | null = null;
    const lines = [l1.current, l2.current, l3.current];

    const make = async () => {
      await document.fonts?.ready;
      if (!alive) return;
      // first choice: the fire
      try {
        const e = new EmberFluid(canvas, host, [
          { el: lines[0], heat: 0.85 },
          { el: lines[1], heat: 0.7 },
          { el: lines[2], heat: 1, bar: true },
        ]);
        engine = {
          kind: "ember",
          begin: () => e.ignite(),
          rebuild: () => e.resize(),
          start: () => e.start(),
          stop: () => e.stop(),
          dispose: () => e.dispose(),
          pointer: (x, y, a) => e.pointer(x, y, a),
          blast: (x, y) => e.blast(x, y),
          scroll: (p) => e.scroll(p),
        };
      } catch {
        // fallback: the particle headline (needs a fresh canvas: the failed
        // attempt may have claimed this one for WebGL)
        setCanvasKey((k) => k + 1);
        return;
      }
      engineRef.current = engine;
      setKind(engine.kind);
      setLive(true);
    };

    const makeParticles = async () => {
      await document.fonts?.ready;
      if (!alive) return;
      try {
        const p = new ParticleType(
          canvas,
          host,
          [
            { el: lines[0], color: "bone" },
            { el: lines[1], color: "boneSoft" },
            { el: lines[2], color: "accent" },
          ],
          { onCount: setCount }
        );
        await p.build();
        engine = {
          kind: "particles",
          begin: () => p.assemble(),
          rebuild: () => void p.build(),
          start: () => p.start(),
          stop: () => p.stop(),
          dispose: () => p.dispose(),
          pointer: (x, y, a) => p.pointer(x, y, a),
          blast: (x, y) => p.blast(x, y),
          scroll: (s) => p.scroll(s),
          recolor: () => p.recolor(),
        };
        if (!alive) return;
        engineRef.current = engine;
        setKind("particles");
        setLive(true);
      } catch {
        /* no effect: the plain headline stays */
      }
    };

    const ric = (window as unknown as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const idle = (cb: () => void) => (ric ? ric(cb, { timeout: 800 }) : setTimeout(cb, 120));
    idle(() => void (canvasKey === 0 ? make() : makeParticles()));

    // re-draw the letters when the layout changes (debounced)
    let tm = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(tm);
      tm = window.setTimeout(() => engineRef.current?.rebuild(), 220);
    });
    ro.observe(host);

    // only animate while the hero is on screen
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && document.documentElement.dataset.heroEntered) engineRef.current?.start();
      else engineRef.current?.stop();
    });
    io.observe(host);

    return () => {
      alive = false;
      clearTimeout(tm);
      ro.disconnect();
      io.disconnect();
      engine?.dispose();
      engineRef.current = null;
      setLive(false);
    };
    // re-draw for the other language's lines; a fresh canvas after a fallback
  }, [reduce, lang, canvasKey]);

  useEffect(() => {
    if (!entered) return;
    document.documentElement.dataset.heroEntered = "1";
    const e = engineRef.current;
    if (!e) return;
    e.start();
    // light it as the Enter screen clears, not underneath it
    const id = setTimeout(() => e.begin(), 600);
    return () => clearTimeout(id);
  }, [entered, live]);

  useEffect(() => engineRef.current?.recolor?.(), [theme]);

  const onMove = (ev: React.PointerEvent) => {
    const r = ev.currentTarget.getBoundingClientRect();
    engineRef.current?.pointer(ev.clientX - r.left, ev.clientY - r.top, ev.pointerType !== "touch" || ev.pressure > 0);
  };
  const onDown = (ev: React.PointerEvent) => {
    if ((ev.target as HTMLElement).closest("a,button")) return;
    const r = ev.currentTarget.getBoundingClientRect();
    engineRef.current?.blast(ev.clientX - r.left, ev.clientY - r.top);
  };

  const ar = lang === "ar";
  const ink = live ? "text-transparent" : "";
  const hint = kind === "ember" ? (ar ? "حرّك المؤشر لتحريك اللهب · انقر لكرة نار" : "move to stir the fire · click for a fireball") : null;

  return (
    <section
      id="top"
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => engineRef.current?.pointer(-9999, -9999, false)}
      onPointerDown={onDown}
      className="relative min-h-[100svh] w-full overflow-hidden"
    >
      {/* a low ember glow along the floor, so the fire has somewhere to sit */}
      <motion.div
        style={{ opacity: fadeUi }}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[55%] bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,rgba(255,77,31,0.14),transparent_70%)]"
      />

      {/* the effect: the visible headline */}
      <canvas key={canvasKey} ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 z-[5]" />

      {/* telemetry */}
      <motion.div
        style={{ opacity: fadeUi }}
        className="pointer-events-none absolute inset-x-5 top-24 z-10 hidden items-center justify-between text-mono text-[10px] uppercase tracking-[0.22em] text-bone/50 md:flex md:inset-x-10"
      >
        <span dir="ltr">N 29°20&apos;21&quot; · E 48°04&apos;34&quot;</span>
        {live && hint ? <span className="rtl:tracking-normal">{hint}</span> : null}
        {live && kind === "particles" && count ? (
          <span>
            <span dir="ltr">{count.toLocaleString("en")}</span> {ar ? "جسيم · حرّك المؤشر · انقر للتشتيت" : "particles · move to disturb · click to scatter"}
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
              // while the fire runs, the underline is a burning wire in the fire itself
              className={`absolute -bottom-1 left-0 right-0 h-[3px] origin-left bg-accent rtl:origin-right md:h-[4px] ${live && kind === "ember" ? "opacity-0" : ""}`}
            />
          </span>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={entered ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.4, duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
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
