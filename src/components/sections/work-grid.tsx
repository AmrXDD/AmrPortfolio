"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { PROJECTS, STATUS_LABEL, localizeProject, type Project } from "@/lib/constants";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealWords } from "@/components/ui/reveal";
import { useLang } from "@/lib/i18n";
import { useIsMobile } from "@/lib/use-mobile";
import { LiquidScreen } from "./work/liquid-screen";

const N = PROJECTS.length;
const EASE = [0.19, 1, 0.22, 1] as const;
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const host = (url: string) => url.replace(/^https?:\/\//, "");

/* ── small kinetic-type helpers ───────────────────────────────────────── */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·—";

/** Decodes into the new text, left to right, whenever it changes (Latin only). */
function Scramble({ text, className, enabled = true }: { text: string; className?: string; enabled?: boolean }) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (!enabled) {
      setOut(text);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 650;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      const settled = Math.floor(k * text.length);
      let s = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        s += i < settled || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      setOut(s);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, enabled]);
  return (
    <span className={className} aria-label={text}>
      {out}
    </span>
  );
}

/** Rolling two-digit counter. */
function Roll({ value, className }: { value: string; className?: string }) {
  return (
    <span dir="ltr" className={`relative inline-flex overflow-hidden ${className ?? ""}`}>
      {value.split("").map((d, i) => (
        <span key={i} className="relative inline-block overflow-hidden">
          <span className="invisible">{d}</span>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={d + i}
              initial={{ y: "105%" }}
              animate={{ y: "0%" }}
              exit={{ y: "-105%" }}
              transition={{ duration: 0.7, ease: EASE, delay: i * 0.06 }}
              className="absolute inset-0"
            >
              {d}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

/* ── desktop: the projection room ─────────────────────────────────────── */

const lineVariants: Variants = {
  enter: (dir: number) => ({ y: 44 * dir, opacity: 0, filter: "blur(10px)", skewY: 3 * dir }),
  center: { y: 0, opacity: 1, filter: "blur(0px)", skewY: 0, transition: { duration: 0.75, ease: EASE } },
  exit: (dir: number) => ({ y: -30 * dir, opacity: 0, filter: "blur(8px)", transition: { duration: 0.32, ease: [0.4, 0, 1, 1] } }),
};
const stagger: Variants = {
  enter: {},
  center: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

function ProjectMeta({ p, dir }: { p: Project; dir: number }) {
  const { t, lang } = useLang();
  const ar = lang === "ar";
  const dev = p.status === "In Development";
  const [brand, tagline] = p.title.split("·").map((s) => s.trim());

  return (
    <AnimatePresence mode="wait" custom={dir} initial={false}>
      <motion.div key={p.slug} custom={dir} variants={stagger} initial="enter" animate="center" exit="exit" className="flex flex-col gap-5">
        <motion.p custom={dir} variants={lineVariants} className="text-mono text-[10px] uppercase tracking-[0.24em] text-bone/50">
          <Scramble text={`${p.category} · ${p.year}`} enabled={!ar} />
        </motion.p>

        <motion.div custom={dir} variants={lineVariants}>
          <h3 className="text-display text-[clamp(2.4rem,4.6vw,4.4rem)] leading-[0.95] text-bone">{brand}</h3>
          <p className="mt-2 text-display text-[clamp(1.1rem,1.8vw,1.6rem)] italic leading-tight text-bone/70">{tagline}</p>
        </motion.div>

        <motion.p custom={dir} variants={lineVariants} className="max-w-md text-[14px] leading-relaxed text-bone/70">
          {p.summary}
        </motion.p>

        <motion.div custom={dir} variants={lineVariants} className="flex flex-wrap gap-1.5">
          {p.stack.map((s, i) => (
            <motion.span
              key={s}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.05, duration: 0.5, ease: EASE }}
              className="rounded-full border border-bone/15 bg-bone/[0.04] px-2.5 py-1 text-mono text-[9px] uppercase tracking-[0.16em] text-bone/75"
            >
              {s}
            </motion.span>
          ))}
        </motion.div>

        <motion.div custom={dir} variants={lineVariants} className="flex flex-wrap items-center gap-4 pt-1">
          <a
            href={p.url}
            target="_blank"
            rel="noreferrer"
            data-cursor="link"
            className="group inline-flex items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-mono text-[10px] uppercase tracking-[0.2em] text-ink transition-colors duration-300 hover:bg-accent hover:text-white"
          >
            {dev ? t("cta.previewBuild") : t("cta.liveProject")}
            <ArrowUpRight size={13} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
          <span className="inline-flex items-center gap-2 text-mono text-[9px] uppercase tracking-[0.2em] text-bone/55">
            <span className={`h-1.5 w-1.5 rounded-full ${dev ? "animate-pulse bg-amber-300" : p.status === "Featured" ? "bg-accent" : "bg-emerald-400"}`} />
            {STATUS_LABEL[p.status][lang]}
          </span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Projection() {
  const { t, lang } = useLang();
  const projects = useMemo(() => PROJECTS.map((p) => localizeProject(p, lang)), [lang]);
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenRef = useRef<LiquidScreen | null>(null);
  const [glFailed, setGlFailed] = useState(false);
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const activeRef = useRef(0);
  const tcRef = useRef<HTMLSpanElement>(null);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const seg = useTransform(scrollYProgress, (p) => p * N);
  const wave = useMotionValue(0);
  const screenScale = useTransform(wave, (w) => 1 - w * 0.035);
  const ghostX = useTransform(scrollYProgress, [0, 1], ["6%", "-14%"]);

  // pointer → 3D tilt of the screen + the shader lens
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [5, -5]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-7, 7]), { stiffness: 120, damping: 18 });

  // Scroll → which two shots are on the screen and how far the melt has gone.
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const s = p * N;
    const i = Math.min(N - 1, Math.floor(s));
    const frac = s - i;
    const mix = i < N - 1 ? smooth(0.56, 1, frac) : 0;
    screenRef.current?.set(i, Math.min(N - 1, i + 1), mix);
    wave.set(Math.sin(mix * Math.PI));
    const next = mix > 0.5 ? i + 1 : i;
    if (next !== activeRef.current) {
      setDir(next > activeRef.current ? 1 : -1);
      activeRef.current = next;
      setActive(next);
    }
    if (tcRef.current) {
      const f = Math.floor(p * 24 * 60 * 2);
      const pad = (n: number) => String(n).padStart(2, "0");
      tcRef.current.textContent = `TC 00:${pad(Math.floor(f / 1440) % 60)}:${pad(Math.floor(f / 24) % 60)}:${pad(f % 24)}`;
    }
  });

  // Build the screen only when the section is near; tear it down after.
  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    let screen: LiquidScreen | null = null;
    const ensure = () => {
      if (screen || glFailed) return screen;
      try {
        screen = new LiquidScreen(
          canvas,
          PROJECTS.map((p) => ({ src: p.image ?? "", bg: p.palette.bg, accent: p.palette.accent })),
          () => setGlFailed(true)
        );
        screenRef.current = screen;
        screen.set(0, 1, 0);
      } catch {
        setGlFailed(true);
      }
      return screen;
    };
    // Set up well before the section arrives, in idle time, so the
    // background compile and the image decodes are done by the time it's seen.
    const ric = (window as unknown as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number })
      .requestIdleCallback;
    const idle = (cb: () => void) => (ric ? ric(cb, { timeout: 1500 }) : setTimeout(cb, 200));
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) idle(() => ensure()?.start());
        else screen?.stop();
      },
      { rootMargin: "150% 0px" }
    );
    io.observe(section);
    const ro = new ResizeObserver(() => screen?.resize());
    ro.observe(canvas);
    return () => {
      io.disconnect();
      ro.disconnect();
      screen?.dispose();
      screenRef.current = null;
    };
  }, [glFailed]);

  const onMove = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    mx.set(x);
    my.set(y);
  };
  const onScreenMove = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    screenRef.current?.pointer((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height, true);
  };

  const go = (i: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    const y = top + ((i + 0.25) / N) * travel;
    const w = window as unknown as { __lenis?: { scrollTo: (t: number, o?: unknown) => void } };
    if (w.__lenis) w.__lenis.scrollTo(y, { duration: 1.4, easing: (k: number) => 1 - Math.pow(1 - k, 4) });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  const p = projects[active];
  const brand = p.title.split("·")[0].trim();

  return (
    <section id="work" ref={sectionRef} className="relative" style={{ height: `${N * 95 + 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden" onPointerMove={onMove}>
        {/* the room takes on the active client's colour */}
        {PROJECTS.map((pr, i) => (
          <motion.div
            key={pr.slug}
            aria-hidden
            animate={{ opacity: i === active ? 1 : 0 }}
            transition={{ duration: 1.1, ease: EASE }}
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(60% 70% at 68% 48%, ${pr.palette.accent}33, transparent 70%)` }}
          />
        ))}

        {/* ghost title, drifting with the scroll */}
        <motion.div aria-hidden dir="ltr" style={{ x: ghostX }} className="pointer-events-none absolute bottom-[3vh] left-0 select-none whitespace-nowrap">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={brand} className="flex">
              {brand.split("").map((ch, i) => (
                <span key={i} className="inline-block overflow-hidden">
                  <motion.span
                    initial={{ y: "100%", rotate: 8 }}
                    animate={{ y: "0%", rotate: 0 }}
                    exit={{ y: "-100%", rotate: -8 }}
                    transition={{ duration: 0.9, ease: EASE, delay: i * 0.035 }}
                    className="inline-block text-display uppercase leading-[0.85] text-transparent"
                    style={{ fontSize: "clamp(6rem, 17vw, 19rem)", WebkitTextStroke: "1px rgb(var(--bone-rgb) / 0.2)" }}
                  >
                    {ch === " " ? " " : ch}
                  </motion.span>
                </span>
              ))}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        <div className="relative mx-auto grid h-full max-w-[1600px] grid-cols-12 items-center gap-x-10 px-5 pb-24 pt-24 md:px-10">
          {/* text column */}
          <div className="col-span-12 flex flex-col gap-8 lg:col-span-4">
            <div>
              <Eyebrow index="01">{t("work.eyebrow")}</Eyebrow>
              <h2 key={lang} className="mt-4 text-display text-[clamp(1.3rem,2vw,1.9rem)] leading-tight text-bone">
                <RevealWords text={t("work.h1")} />{" "}
                <span className="italic text-bone/75">
                  <RevealWords text={t("work.h2")} delay={0.08} />
                </span>{" "}
                <span className="italic text-accent">
                  <RevealWords text={t("work.h3")} delay={0.16} />
                </span>
              </h2>
            </div>

            <div className="flex items-end gap-3">
              <Roll value={p.index} className="text-display text-[clamp(4rem,7vw,7rem)] leading-[0.8] text-bone" />
              <span dir="ltr" className="mb-2 text-mono text-[11px] tracking-[0.2em] text-bone/35">
                / {String(N).padStart(2, "0")}
              </span>
            </div>

            <ProjectMeta p={p} dir={dir} />
          </div>

          {/* the screen */}
          <div className="col-span-12 lg:col-span-8" style={{ perspective: 1600 }}>
            <motion.div style={{ rotateX: rx, rotateY: ry, scale: screenScale }} className="relative will-change-transform">
              {/* viewfinder ticks */}
              {["-left-3 -top-3 border-l border-t", "-right-3 -top-3 border-r border-t", "-left-3 -bottom-3 border-l border-b", "-right-3 -bottom-3 border-r border-b"].map((c) => (
                <span key={c} aria-hidden className={`pointer-events-none absolute h-5 w-5 border-bone/40 ${c}`} />
              ))}
              <div dir="ltr" className="mb-2 flex items-center justify-between text-mono text-[9px] uppercase tracking-[0.24em] text-bone/45">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                  REC · PROJ {p.index}/{String(N).padStart(2, "0")}
                </span>
                <span ref={tcRef}>TC 00:00:00:00</span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-bone/15 bg-[#0d0d0f] shadow-[0_60px_140px_-50px_rgba(0,0,0,0.95)]">
                <div dir="ltr" className="flex items-center gap-3 border-b border-bone/10 bg-[#141417] px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex flex-1 items-center gap-2 truncate rounded-full bg-black/50 px-3 py-1">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <Scramble text={host(p.url)} className="truncate font-mono text-[10px] tracking-wide text-bone/60" />
                  </div>
                </div>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="view"
                  data-cursor-label={lang === "ar" ? "زيارة" : "Visit"}
                  aria-label={`${p.client} — ${lang === "ar" ? "الموقع المباشر" : "live site"}`}
                  onPointerMove={onScreenMove}
                  onPointerLeave={() => screenRef.current?.pointer(0.5, 0.5, false)}
                  className="relative block"
                  style={{ aspectRatio: "1.94", background: p.palette.bg }}
                >
                  {glFailed ? (
                    <Image src={p.image ?? ""} alt="" fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover object-top" />
                  ) : (
                    <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
                  )}
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* film strip: progress per project, click to jump */}
        <FilmStrip seg={seg} active={active} projects={projects} onJump={go} />
      </div>
    </section>
  );
}

function FilmStrip({
  seg,
  active,
  projects,
  onJump,
}: {
  seg: MotionValue<number>;
  active: number;
  projects: Project[];
  onJump: (i: number) => void;
}) {
  return (
    <div className="absolute inset-x-0 bottom-6 z-10 mx-auto flex max-w-[1600px] gap-3 pe-[7.5rem] ps-[12.5rem]">
      {projects.map((p, i) => (
        <StripCell key={p.slug} p={p} i={i} seg={seg} active={i === active} onJump={onJump} />
      ))}
    </div>
  );
}

function StripCell({ p, i, seg, active, onJump }: { p: Project; i: number; seg: MotionValue<number>; active: boolean; onJump: (i: number) => void }) {
  const fill = useTransform(seg, (s) => Math.max(0, Math.min(1, s - i)));
  return (
    <button type="button" onClick={() => onJump(i)} data-cursor="link" className="group flex-1 text-start" aria-current={active ? "true" : undefined}>
      <span className="relative block h-px w-full overflow-hidden bg-bone/15">
        <motion.span style={{ scaleX: fill }} className="absolute inset-0 origin-left bg-accent rtl:origin-right" />
      </span>
      <span className={`mt-2.5 flex items-center gap-2 text-mono text-[9px] uppercase tracking-[0.22em] transition-colors duration-500 ${active ? "text-bone" : "text-bone/35 group-hover:text-bone/70"}`}>
        <span dir="ltr">{p.index}</span>
        <span className="truncate">{p.title.split("·")[0].trim()}</span>
      </span>
    </button>
  );
}

/* ── phones / reduced motion: shutter cards ───────────────────────────── */

function ShutterCard({ p, still }: { p: Project; still: boolean }) {
  const { t, lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const clip = useTransform(scrollYProgress, [0, 1], ["inset(16% 14% 16% 14% round 28px)", "inset(0% 0% 0% 0% round 20px)"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.3, 1]);
  const curtain = useTransform(scrollYProgress, [0.25, 0.85], [1, 0]);
  const numY = useTransform(scrollYProgress, [0, 1], ["40%", "-10%"]);
  const dev = p.status === "In Development";
  const [brand, tagline] = p.title.split("·").map((s) => s.trim());

  return (
    <article ref={ref} className="relative py-10">
      <motion.span
        aria-hidden
        dir="ltr"
        style={still ? undefined : { y: numY }}
        className="pointer-events-none absolute -top-2 end-0 select-none text-display text-[34vw] leading-none text-transparent"
      >
        <span style={{ WebkitTextStroke: "1px rgb(var(--bone-rgb) / 0.12)" }}>{p.index}</span>
      </motion.span>

      <a href={p.url} target="_blank" rel="noreferrer" data-cursor="view" className="relative block">
        <motion.div style={still ? undefined : { clipPath: clip }} className="relative overflow-hidden rounded-[20px]">
          <div className="relative" style={{ aspectRatio: "1.94", background: p.palette.bg }}>
            <motion.div style={still ? undefined : { scale: imgScale }} className="absolute inset-0">
              {p.image ? <Image src={p.image} alt={`${p.client}`} fill sizes="100vw" className="object-cover object-top" /> : null}
            </motion.div>
            {/* the client's colour lifts away like a curtain */}
            {still ? null : (
              <motion.div style={{ scaleY: curtain, background: p.palette.accent }} className="absolute inset-0 origin-top" />
            )}
          </div>
        </motion.div>
      </a>

      <div className="relative mt-6">
        <p className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/50">
          {p.category} · {p.year}
        </p>
        <h3 key={lang} className="mt-3 text-display text-[2.2rem] leading-[1] text-bone">
          <RevealWords text={brand} />
        </h3>
        <p className="mt-2 text-display text-lg italic leading-tight text-bone/70">{tagline}</p>
        <p className="mt-4 text-[14px] leading-relaxed text-bone/70">{p.summary}</p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <a
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-mono text-[10px] uppercase tracking-[0.2em] text-ink"
          >
            {dev ? t("cta.previewBuild") : t("cta.liveProject")}
            <ArrowUpRight size={13} />
          </a>
          <span className="text-mono text-[9px] uppercase tracking-[0.2em] text-bone/50">{STATUS_LABEL[p.status][lang]}</span>
        </div>
      </div>
    </article>
  );
}

function ShutterList({ still }: { still: boolean }) {
  const { t, lang } = useLang();
  return (
    <section id="work" className="relative border-b border-line px-5 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-[1080px]">
        <Eyebrow index="01">{t("work.eyebrow")}</Eyebrow>
        <h2 key={lang} className="mt-6 text-display size-h2 text-bone">
          <RevealWords text={t("work.h1")} />{" "}
          <span className="italic text-bone/80">
            <RevealWords text={t("work.h2")} delay={0.1} />
          </span>{" "}
          <span className="italic text-accent">
            <RevealWords text={t("work.h3")} delay={0.2} />
          </span>
        </h2>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-bone/65">{t("work.introMobile")}</p>
        <div className="mt-6">
          {PROJECTS.map((p) => (
            <ShutterCard key={p.slug} p={localizeProject(p, lang)} still={still} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function WorkGrid() {
  const reduce = !!useReducedMotion();
  const isMobile = useIsMobile("(max-width: 1023px)");
  if (reduce) return <ShutterList still />;
  return isMobile ? <ShutterList still={false} /> : <Projection />;
}
