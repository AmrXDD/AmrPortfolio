"use client";

import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealWords } from "@/components/ui/reveal";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { useCopy, useLang } from "@/lib/i18n";

const COPY = {
  en: {
    eyebrow: "Studio · Motion",
    h1: "Motion is the",
    h2: "invisible script.",
    p: "Animations don't decorate the interface, they choreograph the user's attention. I treat every easing curve, stagger, and pause as a director treats a cut.",
    phrases: ["FRAME RATE IS A FEATURE.", "EASING IS TASTE.", "WHITESPACE IS CONFIDENCE.", "MOTION IS LANGUAGE."],
    tiles: [
      { title: "Magnetic", subtitle: "Cursor aware interaction", word: "pull." },
      { title: "Stagger", subtitle: "Sequenced reveal logic" },
      { title: "Iridescence", subtitle: "GPU driven color" },
    ],
    hint: "Touch the demos",
  },
  ar: {
    eyebrow: "الاستوديو · الحركة",
    h1: "الحركة هي",
    h2: "السيناريو الخفي.",
    p: "الحركة لا تزيّن الواجهة، بل توجّه انتباه المستخدم. أتعامل مع كل منحنى تسارع وكل تتابع وكل توقّف كما يتعامل المخرج مع اللقطة.",
    phrases: ["معدّل الإطارات ميزة.", "التسارع ذوق.", "الفراغ ثقة.", "الحركة لغة."],
    tiles: [
      { title: "مغناطيسي", subtitle: "تفاعل يستجيب للمؤشّر", word: "جذب." },
      { title: "تتابع", subtitle: "منطق ظهور متسلسل" },
      { title: "تلألؤ", subtitle: "ألوان يحرّكها المعالج الرسومي" },
    ],
    hint: "جرّب العروض",
  },
};

/*
 * Studio · Motion. Two bands of the studio's rules slide against each other,
 * leaning into the scroll the faster you go. Below them, three working
 * demos you can touch: a magnetic field that bends toward the cursor, a
 * stagger that ripples out from wherever you point, and a film of colour
 * that turns with the light.
 */

/* ── magnetic: a dot field + a word that leans toward you ─────────────── */
function MagneticTile({ word }: { word: string }) {
  const host = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 140, damping: 16 });
  const sy = useSpring(py, { stiffness: 140, damping: 16 });
  const wx = useTransform(sx, [0, 1], [-28, 28]);
  const wy = useTransform(sy, [0, 1], [-20, 20]);
  const skew = useTransform(sx, [0, 1], [10, -10]);
  const blobX = useTransform(sx, [0, 1], ["-30%", "30%"]);
  const blobY = useTransform(sy, [0, 1], ["-30%", "30%"]);

  useEffect(() => {
    const canvas = cv.current;
    const el = host.current;
    if (!canvas || !el) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let on = false;
    let W = 0;
    let H = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = () => {
      W = el.clientWidth;
      H = el.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);
    const draw = () => {
      if (!on) return;
      raf = requestAnimationFrame(draw);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const mx = sx.get() * W;
      const my = sy.get() * H;
      const gap = 22;
      for (let y = gap / 2; y < H; y += gap) {
        for (let x = gap / 2; x < W; x += gap) {
          const dx = mx - x;
          const dy = my - y;
          const d = Math.hypot(dx, dy) || 1;
          const pull = Math.max(0, 1 - d / 190);
          const k = pull * pull * 16;
          const r = 1 + pull * 2.2;
          ctx.fillStyle = pull > 0.35 ? `rgba(255,77,31,${0.4 + pull * 0.6})` : `rgba(239,234,226,${0.12 + pull * 0.5})`;
          ctx.beginPath();
          ctx.arc(x + (dx / d) * k, y + (dy / d) * k, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (on) draw();
    });
    io.observe(el);
    return () => {
      on = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [sx, sy]);

  return (
    <div
      ref={host}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
      className="relative flex h-full items-center justify-center overflow-hidden"
    >
      <canvas ref={cv} aria-hidden className="absolute inset-0 h-full w-full" />
      <motion.div style={{ x: blobX, y: blobY }} className="absolute h-36 w-36 rounded-full bg-gradient-to-br from-accent to-plasma opacity-70 blur-2xl" />
      <motion.span style={{ x: wx, y: wy, skewX: skew }} className="relative text-display text-[3.5rem] italic text-bone">
        {word}
      </motion.span>
    </div>
  );
}

/* ── stagger: bars ripple outward from the pointer ───────────────────── */
const BARS = 16;
function StaggerTile({ reduce }: { reduce: boolean }) {
  const [origin, setOrigin] = useState(0);
  const [pulse, setPulse] = useState(0);
  const auto = useRef(true);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      if (!auto.current) return;
      setOrigin((o) => (o + 5) % BARS);
      setPulse((p) => p + 1);
    }, 1900);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div
      dir="ltr"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const o = Math.max(0, Math.min(BARS - 1, Math.floor(((e.clientX - r.left) / r.width) * BARS)));
        auto.current = false;
        if (o !== origin) {
          setOrigin(o);
          setPulse((p) => p + 1);
        }
      }}
      onPointerLeave={() => (auto.current = true)}
      className="flex h-full items-end justify-center gap-[6px] px-6 pb-8 pt-24"
    >
      {Array.from({ length: BARS }, (_, i) => {
        const d = Math.abs(i - origin);
        return (
          <motion.span
            key={`${i}-${pulse}`}
            initial={{ scaleY: 0.12 }}
            animate={reduce ? { scaleY: 0.5 } : { scaleY: [0.12, 1 - d * 0.045, 0.12] }}
            transition={{ duration: 1.1, delay: d * 0.055, ease: [0.19, 1, 0.22, 1] }}
            className={`h-full w-2 origin-bottom rounded-full ${d === 0 ? "bg-accent" : "bg-bone"}`}
          />
        );
      })}
    </div>
  );
}

/* ── iridescence: a film of colour that turns with the pointer ────────── */
function IridescenceTile() {
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 90, damping: 18 });
  const sy = useSpring(py, { stiffness: 90, damping: 18 });
  const bg = useTransform([sx, sy], ([x, y]: number[]) => {
    const a = 90 + x * 120 + y * 60;
    return `linear-gradient(${a}deg, #7c3aed 0%, #22d3ee ${20 + x * 10}%, #ff4d1f ${48 + y * 8}%, #efeae2 ${72 + x * 6}%, #7c3aed 100%)`;
  });
  const sheen = useTransform([sx, sy], ([x, y]: number[]) => `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.55), transparent 42%)`);
  return (
    <div
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
      className="relative h-full w-full"
    >
      <motion.div className="absolute inset-0" style={{ backgroundImage: bg }} animate={{ backgroundPositionX: ["0%", "100%", "0%"] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
      <motion.div className="absolute inset-0 mix-blend-overlay" style={{ backgroundImage: sheen }} />
      <div className="absolute inset-0 opacity-[0.18] mix-blend-overlay [background:repeating-linear-gradient(115deg,rgba(255,255,255,0.6)_0_2px,transparent_2px_9px)]" />
    </div>
  );
}

function DemoTile({ title, subtitle, children, className, delay = 0 }: { title: string; subtitle: string; children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: 18 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1.1, ease: [0.19, 1, 0.22, 1], delay }}
      className={`group relative overflow-hidden rounded-3xl border border-line bg-ash ${className}`}
      style={{ transformPerspective: 1200 }}
    >
      <div className="pointer-events-none absolute start-6 top-6 z-10">
        <p className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40">{subtitle}</p>
        <p className="mt-1 text-display text-2xl italic text-bone">{title}</p>
      </div>
      <div className="relative aspect-[4/3]">{children}</div>
    </motion.div>
  );
}

export function MotionShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = !!useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x1 = useTransform(scrollYProgress, [0, 1], ["4%", "-30%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["-34%", "0%"]);
  // lean into the scroll: the faster you go, the harder the bands skew
  const { scrollY } = useScroll();
  const vel = useSpring(useVelocity(scrollY), { stiffness: 220, damping: 40 });
  const skew = useTransform(vel, [-2400, 0, 2400], [9, 0, -9], { clamp: true });
  const c = useCopy(COPY);
  const { lang } = useLang();
  const ar = lang === "ar";
  const order = [2, 0, 3, 1];

  return (
    <section id="studio" ref={ref} className="relative overflow-hidden border-b border-line bg-ink py-32 md:py-40">
      <div className="mx-auto mb-20 max-w-[1600px] px-5 md:px-10">
        <div className="grid grid-cols-12 items-end gap-y-8">
          <div className="col-span-12 md:col-span-6">
            <Eyebrow index="08">{c.eyebrow}</Eyebrow>
            <h2 key={lang} className="mt-6 text-display size-h2 text-bone">
              <RevealWords text={c.h1} />
              <br />
              <span className="italic text-accent">
                <RevealWords text={c.h2} delay={0.1} />
              </span>
            </h2>
          </div>
          <div className="col-span-12 md:col-span-5 md:col-start-8">
            <ScrollReveal key={lang} className="text-sm leading-relaxed text-bone/90" text={c.p} />
          </div>
        </div>
      </div>

      {/* the bands always travel the same physical way, so they stay LTR-anchored */}
      <div dir="ltr" className="relative -rotate-2 space-y-3 md:space-y-5">
        <motion.div style={{ x: x1, skewX: reduce ? 0 : skew }} className="flex w-max items-center gap-8 will-change-transform">
          {c.phrases.map((p, i) => (
            <span key={i} className="flex items-center gap-8 text-display text-[clamp(2.4rem,7vw,6.5rem)] leading-none text-bone">
              <span dir={ar ? "rtl" : undefined} className={i % 2 ? "italic text-bone/80" : ""}>
                {p}
              </span>
              <span className="inline-block h-3 w-3 rounded-full bg-accent" />
            </span>
          ))}
        </motion.div>
        <motion.div style={{ x: x2, skewX: reduce ? 0 : skew }} className="flex w-max items-center gap-8 will-change-transform">
          {order.map((k) => (
            <span key={k} className="flex items-center gap-8 text-display text-[clamp(2.4rem,7vw,6.5rem)] leading-none">
              <span dir={ar ? "rtl" : undefined} className={ar ? "text-bone/25" : "text-transparent"} style={ar ? undefined : { WebkitTextStroke: "1px rgb(var(--bone-rgb) / 0.45)" }}>
                {c.phrases[k]}
              </span>
              <span className="inline-block h-3 w-3 rotate-45 border border-accent" />
            </span>
          ))}
        </motion.div>
      </div>

      {/* the lab: three demos that answer back */}
      <div className="mx-auto mt-24 max-w-[1600px] px-5 md:px-10">
        <p className="mb-5 flex items-center gap-2 text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          {c.hint}
        </p>
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <DemoTile title={c.tiles[0].title} subtitle={c.tiles[0].subtitle} className="col-span-12 md:col-span-4">
            <MagneticTile word={c.tiles[0].word ?? ""} />
          </DemoTile>
          <DemoTile title={c.tiles[1].title} subtitle={c.tiles[1].subtitle} className="col-span-12 md:col-span-4" delay={0.08}>
            <StaggerTile reduce={reduce} />
          </DemoTile>
          <DemoTile title={c.tiles[2].title} subtitle={c.tiles[2].subtitle} className="col-span-12 md:col-span-4" delay={0.16}>
            <IridescenceTile />
          </DemoTile>
        </div>
      </div>
    </section>
  );
}
