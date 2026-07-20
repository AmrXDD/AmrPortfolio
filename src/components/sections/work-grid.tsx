"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import { PROJECTS, type Project } from "@/lib/constants";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal, RevealWords } from "@/components/ui/reveal";
import { LineSidebar } from "@/components/ui/line-sidebar";
import { useLang } from "@/lib/i18n";
import { ArrowUpRight } from "lucide-react";

/* Fixed left-edge navigator that appears only while the work deck is on screen,
   letting you jump straight to any recent-work card. */
function ProjectNav() {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    // scroll-driven (reliable under Lenis smooth-scroll, unlike IO here)
    const compute = () => {
      const section = document.getElementById("work");
      if (!section) return;
      const vh = window.innerHeight;
      const r = section.getBoundingClientRect();
      setInView(r.top < vh * 0.8 && r.bottom > vh * 0.2);
      // active = card whose centre is nearest the viewport centre
      let best = 0;
      let bestD = Infinity;
      PROJECTS.forEach((_, i) => {
        const c = document.getElementById(`work-card-${i}`);
        if (!c) return;
        const cr = c.getBoundingClientRect();
        const d = Math.abs(cr.top + cr.height / 2 - vh / 2);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setActive(best);
    };
    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    const id = window.setInterval(compute, 400); // safety net for Lenis frames
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
      clearInterval(id);
    };
  }, []);

  const go = (i: number) => {
    const el = document.getElementById(`work-card-${i}`);
    if (!el) return;
    const w = window as unknown as {
      __lenis?: { scrollTo: (t: Element, o?: unknown) => void };
      __navLock?: boolean;
    };
    w.__navLock = true;
    const release = () => (w.__navLock = false);
    if (w.__lenis) {
      w.__lenis.scrollTo(el, { offset: -100, duration: 1.2, easing: (t: number) => 1 - Math.pow(1 - t, 4), onComplete: () => setTimeout(release, 120) });
      setTimeout(release, 1700);
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(release, 900);
    }
  };

  return (
    <div
      className="pointer-events-none fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 transition-opacity duration-500 lg:block"
      style={{ opacity: inView ? 1 : 0 }}
    >
      <div className="pointer-events-auto" style={{ pointerEvents: inView ? "auto" : "none" }}>
        <p className="mb-4 text-mono text-[9px] uppercase tracking-[0.24em] text-bone/40">Recent Work</p>
        <LineSidebar
          items={PROJECTS.map((p) => p.title.split("·")[0].trim())}
          activeIndex={active}
          accentColor="#ff4d1f"
          textColor="rgba(245,245,245,0.55)"
          markerColor="rgba(245,245,245,0.3)"
          showIndex
          showMarker
          proximityRadius={120}
          maxShift={22}
          falloff="smooth"
          markerLength={44}
          markerGap={12}
          tickScale={0.5}
          scaleTick
          itemGap={18}
          fontSize={0.95}
          smoothing={120}
          onItemClick={(i) => go(i)}
        />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Project["status"] }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-mono text-[9px] uppercase tracking-[0.18em] ${
        status === "In Development"
          ? "border-amber-300/40 bg-amber-300/10 text-amber-200"
          : status === "Featured"
          ? "border-bone bg-bone text-ink"
          : "border-bone/30 bg-bone/5 text-bone/80"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "In Development" ? "animate-pulse bg-amber-300" : status === "Featured" ? "bg-accent" : "bg-emerald-400"
        }`}
      />
      {status}
    </span>
  );
}

/* One stacking card: number + meta + Live button on top, info/stack/shot grid below. */
function StackCard({
  p,
  i,
  total,
  progress,
  reduce,
}: {
  p: Project;
  i: number;
  total: number;
  progress: MotionValue<number>;
  reduce: boolean;
}) {
  // cards already passed shrink slightly so the stack reads as layered sheets
  const targetScale = 1 - (total - 1 - i) * 0.04;
  const scale = useTransform(progress, [i / total, 1], [1, targetScale]);

  const card = (
    <div
      data-tick
      className="overflow-hidden rounded-[22px] border border-bone/20 bg-ink p-3 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)] sm:rounded-[28px] sm:p-4 md:rounded-[34px] md:p-6"
    >
      {/* top row — number · meta · live link */}
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3 md:flex-nowrap md:items-center">
        <span className="text-display leading-none text-bone" style={{ fontSize: "clamp(1.9rem, 5.5vw, 4.5rem)" }}>
          {p.index}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-mono text-[9px] uppercase tracking-[0.22em] text-bone/45">
            {p.category} · {p.year}
          </p>
          <h3 className="mt-1 truncate text-display leading-tight text-bone" style={{ fontSize: "clamp(1rem, 1.9vw, 1.7rem)" }}>
            {p.title.split("·")[0].trim()}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StatusPill status={p.status} />
            <span className="text-mono text-[9px] tracking-wide text-bone/40">{p.url.replace(/^https?:\/\//, "")}</span>
          </div>
        </div>
        <a
          href={p.url}
          target="_blank"
          rel="noreferrer"
          data-cursor="link"
          data-cursor-label={p.status === "In Development" ? "Preview" : "Visit"}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-bone/40 px-5 py-2 text-mono text-[10px] uppercase tracking-[0.2em] text-bone transition-colors duration-300 hover:border-bone hover:bg-bone hover:text-ink sm:px-6"
        >
          {p.status === "In Development" ? "Preview Build" : "Live Project"}
          <ArrowUpRight size={13} />
        </a>
      </div>

      {/* bottom row — 40% info column + 60% screenshot */}
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:mt-4 md:grid-cols-[38%_1fr]">
        <div className="flex flex-col gap-2.5">
          {/* premise panel — glass card with a hairline gradient top edge */}
          <div
            className="group/premise relative overflow-hidden rounded-[18px] border border-bone/10 bg-gradient-to-b from-ash/80 to-ash/30 p-4 backdrop-blur-sm sm:rounded-[22px] md:rounded-[24px] md:p-5"
            style={{ minHeight: "clamp(84px, 10vw, 140px)" }}
          >
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bone/40 to-transparent" />
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-accent" />
              <p className="text-mono text-[9px] uppercase tracking-[0.26em] text-bone/45">Premise</p>
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-bone/85">{p.summary}</p>
          </div>

          {/* stack panel — the project's palette, with an aurora glow, faint grid,
              and chips that light up on hover */}
          <div
            className="group/stack relative flex-1 overflow-hidden rounded-[18px] border border-bone/10 p-4 sm:rounded-[22px] md:rounded-[24px] md:p-5"
            style={{
              background: `radial-gradient(130% 120% at 100% 0%, ${p.palette.accent}30, transparent 55%), linear-gradient(155deg, ${p.palette.bg} 0%, #050505 100%)`,
              minHeight: "clamp(96px, 12vw, 180px)",
            }}
          >
            <span className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-50 blur-2xl transition-opacity duration-700 group-hover/stack:opacity-80" style={{ background: p.palette.accent }} />
            <span
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            {/* the panel is ALWAYS on the project's dark palette, so its text is
                explicitly light in both themes (never token-based) */}
            <div className="relative flex items-center justify-between">
              <p className="text-mono text-[9px] uppercase tracking-[0.26em] text-white/70">Stack</p>
              <span className="flex items-center gap-1.5 text-mono text-[8px] uppercase tracking-[0.2em] text-white/45">
                <span className="h-1 w-1 rounded-full" style={{ background: p.palette.accent }} />
                {p.stack.length} tools
              </span>
            </div>
            <div className="relative mt-3 flex flex-wrap gap-1.5">
              {p.stack.map((s) => (
                <span
                  key={s}
                  className="rounded-lg border border-white/15 bg-black/35 px-2.5 py-1 text-mono text-[9px] uppercase tracking-[0.14em] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:bg-black/55"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* the live frame — image fully covers the card, no gaps */}
        <a
          href={p.url}
          target="_blank"
          rel="noreferrer"
          data-cursor="view"
          data-cursor-label="Visit"
          className="group relative block aspect-[16/10] min-h-[160px] overflow-hidden rounded-[16px] border border-line sm:rounded-[20px] md:aspect-auto md:min-h-0 md:rounded-[24px]"
          style={{ background: p.palette.bg }}
        >
          {p.image ? (
            <Image
              src={p.image}
              alt={`${p.client} — live site`}
              fill
              sizes="(min-width: 768px) 55vw, 100vw"
              className="object-cover object-top transition-transform duration-[1100ms] ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-display text-4xl italic text-bone/15">/{p.slug}</span>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" />
        </a>
      </div>
    </div>
  );

  if (reduce) return <div id={`work-card-${i}`} className="mb-5 scroll-mt-24">{card}</div>;

  return (
    <div id={`work-card-${i}`} className="h-[72vh] scroll-mt-24" style={{ perspective: 1200 }}>
      <motion.div
        style={{ scale, top: `calc(84px + ${i * 22}px)`, transformOrigin: "top center" }}
        className="sticky will-change-transform"
      >
        {card}
      </motion.div>
    </div>
  );
}

export function WorkGrid() {
  const stackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { t, lang } = useLang();
  const { scrollYProgress } = useScroll({
    target: stackRef,
    offset: ["start start", "end end"],
  });

  return (
    <section id="work" className="relative border-b border-line px-5 py-16 md:px-10 md:py-24">
      <ProjectNav />
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-10 flex flex-col items-start justify-between gap-8 md:mb-14 md:flex-row md:items-end">
          <div>
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
          </div>
          <Reveal delay={0.3} className="max-w-sm">
            <p className="text-sm leading-relaxed text-bone/65">
              {t("work.intro")}
            </p>
          </Reveal>
        </div>

        {/* sticky-stacking deck */}
        <div ref={stackRef}>
          {PROJECTS.map((p, i) => (
            <StackCard key={p.slug} p={p} i={i} total={PROJECTS.length} progress={scrollYProgress} reduce={!!reduce} />
          ))}
        </div>
      </div>
    </section>
  );
}
