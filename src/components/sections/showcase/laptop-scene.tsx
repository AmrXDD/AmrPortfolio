"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useCopy } from "@/lib/i18n";
import { drawStudioReel, CANVAS_W, CANVAS_H } from "./studio-reel-draw";

const COPY = {
  en: {
    eyebrow: "The Craft · Studio",
    introA: "Scroll to switch on",
    introB: "the studio.",
    insideEyebrow: "Inside · brand → design → build",
    insideA: "One idea, three crafts,",
    insideB: "shipped live.",
    keep: "Keep scrolling",
  },
  ar: {
    eyebrow: "الحِرفة · الاستوديو",
    introA: "مرّر لتشغيل",
    introB: "الاستوديو.",
    insideEyebrow: "في الداخل · هوية ← تصميم ← بناء",
    insideA: "فكرة واحدة، ثلاث حِرف،",
    insideB: "تُطلق مباشرة.",
    keep: "تابع التمرير",
  },
};

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/*
 * The live "brand → design → build" reel on a flat studio monitor. No WebGL
 * and no 3D model: a 2D canvas painted at ~30fps only while on screen, and
 * pure CSS transforms for the tilt, so nothing compiles or uploads to the GPU
 * when the visitor enters the site.
 */
function ReelScreen({ progress, still }: { progress: MotionValue<number>; still: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Back the canvas at the displayed size × DPR so the reel stays crisp.
    let k = 1;
    const fit = () => {
      const w = canvas.getBoundingClientRect().width || CANVAS_W;
      k = Math.min(2, Math.max(0.5, (w * Math.min(2, window.devicePixelRatio || 1)) / CANVAS_W));
      canvas.width = Math.round(CANVAS_W * k);
      canvas.height = Math.round(CANVAS_H * k);
    };
    const paint = (p: number, time: number) => {
      ctx.setTransform(k, 0, 0, k, 0, 0);
      drawStudioReel(ctx, p, time);
    };
    fit();

    if (still) {
      paint(1, 0);
      return;
    }

    let raf = 0;
    let visible = false;
    let frame = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      // ~30fps is plenty for the reel and halves the canvas cost
      frame = (frame + 1) % 2;
      if (frame) return;
      paint(smooth(0.18, 0.9, progress.get()), (now - t0) / 1000);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        cancelAnimationFrame(raf);
        if (visible) raf = requestAnimationFrame(loop);
      },
      { rootMargin: "20% 0px" }
    );
    io.observe(canvas);
    const ro = new ResizeObserver(() => {
      fit();
      if (!visible) paint(smooth(0.18, 0.9, progress.get()), 0);
    });
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [progress, still]);

  return <canvas ref={ref} aria-hidden className="block h-full w-full" />;
}

export function LaptopScene() {
  const c = useCopy(COPY);
  const ref = useRef<HTMLDivElement>(null);
  const reduce = !!useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // The monitor rises from a laid-back tilt to face you, then the camera
  // leans in for the reel and eases back out.
  const tilt = useTransform(scrollYProgress, [0, 0.2], [32, 0]);
  const lift = useTransform(scrollYProgress, [0, 0.2], ["14%", "0%"]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.42, 0.78, 0.92], [0.78, 0.92, 1.04, 1.04, 0.94]);
  const glow = useTransform(scrollYProgress, [0, 0.2, 0.9, 1], [0.15, 0.6, 0.6, 0.2]);

  const introOpacity = useTransform(scrollYProgress, [0, 0.08, 0.16], [1, 1, 0]);
  const insideOpacity = useTransform(scrollYProgress, [0.42, 0.5, 0.74, 0.82], [0, 1, 1, 0]);
  const outroOpacity = useTransform(scrollYProgress, [0.88, 0.95], [0, 1]);

  const monitor = (
    <div className="relative mx-auto w-full overflow-hidden rounded-[18px] border border-bone/15 bg-[#07080c] p-[6px] shadow-[0_60px_140px_-50px_rgba(0,0,0,0.95)] md:rounded-[24px] md:p-[10px]">
      {/* glass sheen across the bezel */}
      <span className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] bg-[linear-gradient(115deg,rgba(255,255,255,0.08)_0%,transparent_32%,transparent_70%,rgba(255,255,255,0.04)_100%)]" />
      <div className="relative overflow-hidden rounded-[12px] md:rounded-[16px]" style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}>
        <ReelScreen progress={scrollYProgress} still={reduce} />
      </div>
    </div>
  );

  if (reduce) {
    return (
      <section id="craft" className="border-b border-line px-5 py-24 md:px-10">
        <div className="mx-auto max-w-[1100px]">
          <Eyebrow index="A1">{c.eyebrow}</Eyebrow>
          <h2 className="mt-5 text-display size-h2 text-bone">
            {c.insideA} <span className="italic text-accent">{c.insideB}</span>
          </h2>
          <div className="mt-10">{monitor}</div>
        </div>
      </section>
    );
  }

  return (
    <section id="craft" ref={ref} className="relative" style={{ height: "380vh" }}>
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden px-4 md:px-10">
        <motion.div
          style={{ opacity: glow }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[70vh] w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,77,31,0.28),rgba(124,58,237,0.14)_55%,transparent)] blur-2xl"
        />

        <div className="w-full max-w-[1120px]" style={{ perspective: 1600 }}>
          <motion.div style={{ rotateX: tilt, y: lift, scale, transformOrigin: "50% 100%" }} className="will-change-transform">
            {monitor}
            {/* floor reflection */}
            <div className="mx-auto mt-3 h-10 w-[70%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,77,31,0.22),transparent)] blur-xl" />
          </motion.div>
        </div>

        <motion.div style={{ opacity: introOpacity }} className="pointer-events-none absolute start-5 top-24 z-20 md:start-10 md:top-28">
          <Eyebrow index="A1">{c.eyebrow}</Eyebrow>
          <h2 className="mt-4 max-w-md text-display text-[clamp(1.75rem,4vw,3.25rem)] leading-[1.02] text-bone">
            {c.introA} <span className="italic text-bone/70">{c.introB}</span>
          </h2>
        </motion.div>

        <motion.div style={{ opacity: insideOpacity }} className="pointer-events-none absolute bottom-10 start-5 z-20 hidden md:block md:start-10">
          <Eyebrow index="LIVE">{c.insideEyebrow}</Eyebrow>
          <p className="mt-3 max-w-xs text-display text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.02] text-bone">
            {c.insideA} <span className="italic text-accent">{c.insideB}</span>
          </p>
        </motion.div>

        <motion.div style={{ opacity: outroOpacity }} className="pointer-events-none absolute bottom-10 left-1/2 z-20 -translate-x-1/2 text-center">
          <p className="text-mono text-[10px] uppercase tracking-[0.3em] text-bone/45">{c.keep}</p>
        </motion.div>
      </div>
    </section>
  );
}
