"use client";

import Image from "next/image";
import { createContext, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { PROJECTS, STATUS_LABEL, localizeProject, type Project } from "@/lib/constants";
import { useCopy, useLang } from "@/lib/i18n";
import { useIsMobile } from "@/lib/use-mobile";

const N = PROJECTS.length;
const EASE = [0.19, 1, 0.22, 1] as const;

const COPY = {
  en: {
    eyebrow: "Featured case studies",
    introA: "Four briefs,",
    introB: "four palettes.",
    introP: "Each case is told in its client's own colours. Keep scrolling and the gallery moves sideways, room by room.",
    featured: "Featured case",
    case: "Case",
    client: "Client",
    role: "Role",
    status: "Status",
    year: "Year",
    premise: "Premise",
    chapters: ["Challenge", "Approach", "Outcome"],
    preview: "Preview build",
    visit: "Visit live site",
    of: "of",
  },
  ar: {
    eyebrow: "دراسات حالة مختارة",
    introA: "أربعة مشاريع،",
    introB: "أربع لوحات ألوان.",
    introP: "كل دراسة حالة تُروى بألوان عميلها. تابع التمرير وسيتحرّك المعرض أفقيًا، غرفة بعد غرفة.",
    featured: "دراسة حالة مميّزة",
    case: "دراسة حالة",
    client: "العميل",
    role: "الدور",
    status: "الحالة",
    year: "السنة",
    premise: "الفكرة",
    chapters: ["التحدّي", "المنهج", "النتيجة"],
    preview: "معاينة النسخة",
    visit: "زيارة الموقع",
    of: "من",
  },
};
type Copy = (typeof COPY)["en"];

/* ── parallax inside the moving track ─────────────────────────────────── */

type Track = { x: MotionValue<number>; vw: number; trackRef: React.RefObject<HTMLDivElement | null> };
const TrackCtx = createContext<Track | null>(null);

/**
 * Moves its children at `speed` relative to the track, measured from where it
 * sits on screen (0 at the viewport centre), and optionally tilts them so
 * they straighten as they reach the centre.
 */
function Par({ speed = 0, tilt = 0, className, children }: { speed?: number; tilt?: number; className?: string; children: ReactNode }) {
  const ctx = useContext(TrackCtx);
  const ref = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState(0);

  useLayoutEffect(() => {
    if (!ctx) return;
    const measure = () => {
      const el = ref.current;
      const track = ctx.trackRef.current;
      if (!el || !track) return;
      const r = el.getBoundingClientRect();
      const t = track.getBoundingClientRect();
      setCenter(r.left - t.left + r.width / 2);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ctx]);

  const fallback = useMotionValue(0);
  const x = ctx?.x ?? fallback;
  const vw = ctx?.vw || 1;
  const off = useTransform(x, (v) => (v + center - vw / 2) / vw); // -1 … 1 across the screen
  const tx = useTransform(off, (o) => o * speed * vw);
  const rot = useTransform(off, (o) => Math.max(-1, Math.min(1, o)) * tilt);

  // measured on the static wrapper, so its own parallax never skews the reading
  return (
    <div ref={ref} className={className}>
      <motion.div style={ctx ? { x: tx, rotate: rot } : undefined}>{children}</motion.div>
    </div>
  );
}

/* ── pieces of a room ──────────────────────────────────────────────────── */

/*
 * The trigger sits on the visible wrapper: each letter starts clipped below
 * its mask, and a fully clipped element never counts as "in view".
 */
const letterVariants = {
  hidden: { y: "110%", rotate: 10 },
  show: (i: number) => ({ y: "0%", rotate: 0, transition: { duration: 1, ease: EASE, delay: i * 0.04 } }),
};

function Letters({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.span
      dir="ltr"
      className={`inline-flex whitespace-nowrap ${className ?? ""}`}
      style={style}
      aria-label={text}
      initial="hidden"
      whileInView="show"
      viewport={{ amount: 0.3 }}
    >
      {text.split("").map((ch, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em]" aria-hidden>
          <motion.span className="inline-block" custom={i} variants={letterVariants}>
            {ch === " " ? " " : ch}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

function Frame({ p, accent }: { p: Project; accent: string }) {
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noreferrer"
      data-cursor="view"
      data-cursor-label="Visit"
      className="group block overflow-hidden rounded-2xl border border-black/10 bg-[#0d0d0f] shadow-[0_50px_120px_-40px_rgba(0,0,0,0.75)]"
    >
      <div dir="ltr" className="flex items-center gap-3 bg-[#141417] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex flex-1 items-center gap-2 truncate rounded-full bg-black/50 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
          <span className="truncate font-mono text-[10px] tracking-wide text-white/55">{p.url.replace(/^https?:\/\//, "")}</span>
        </div>
      </div>
      <div className="relative overflow-hidden" style={{ aspectRatio: "1.94", background: p.palette.bg }}>
        {p.image ? (
          <Image
            src={p.image}
            alt={`${p.client} — ${p.title}`}
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover object-top transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
          />
        ) : null}
      </div>
    </a>
  );
}

function Meta({ p, c }: { p: Project; c: Copy }) {
  const { lang } = useLang();
  const rows: [string, string][] = [
    [c.client, p.client],
    [c.role, p.role],
    [c.status, STATUS_LABEL[p.status][lang]],
    [c.year, p.year],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-mono text-[9px] uppercase tracking-[0.24em] opacity-50">{k}</dt>
          <dd className="mt-1 text-[13px] leading-snug">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Chapters({ p, c, accent }: { p: Project; c: Copy; accent: string }) {
  const body = [p.challenge, p.approach, p.outcome];
  return (
    <ol className="flex flex-col gap-6">
      {c.chapters.map((h, i) => (
        <motion.li
          key={h}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.5 }}
          transition={{ duration: 0.8, ease: EASE, delay: i * 0.12 }}
          className="grid grid-cols-[2.2rem_1fr] gap-3"
        >
          <span dir="ltr" className="text-mono text-[10px] tracking-[0.2em]" style={{ color: accent }}>
            {["i", "ii", "iii"][i]}
          </span>
          <div>
            <p className="text-mono text-[10px] uppercase tracking-[0.24em] opacity-55">{h}</p>
            <p className="mt-2 text-[13.5px] leading-relaxed opacity-80">{body[i]}</p>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}

function Cta({ p, c, accent, ink }: { p: Project; c: Copy; accent: string; ink: string }) {
  const dev = p.status === "In Development";
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noreferrer"
      data-cursor="link"
      className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-mono text-[10px] uppercase tracking-[0.2em] transition-transform duration-300 hover:scale-[1.04]"
      style={{ background: accent, color: ink }}
    >
      {dev ? c.preview : c.visit}
      <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </a>
  );
}

/** Readable text on the accent colour (dark accents get light text). */
const onAccent = (hex: string) => {
  const v = parseInt(hex.slice(1), 16);
  const l = (0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255;
  return l > 0.55 ? "#0a0a0a" : "#ffffff";
};

/* ── desktop: one room per case, laid out sideways ────────────────────── */

function Room({ p, i, c, dir }: { p: Project; i: number; c: Copy; dir: "ltr" | "rtl" }) {
  const { bg, ink, accent } = p.palette;
  const [brand, tagline] = p.title.split("·").map((s) => s.trim());
  const flagship = i === 0;
  return (
    <article
      id={`case-${p.slug}`}
      data-room={i}
      dir={dir}
      className="relative flex h-screen shrink-0 items-center gap-[6vw] pe-[8vw] ps-[12vw]"
      style={{ background: bg, color: ink }}
      data-surface={isLight(bg) ? "light" : "dark"}
    >
      {/* the seam: an accent blade where one client's room meets the next */}
      <span aria-hidden className="absolute inset-y-0 start-0 w-[5vw] -skew-x-6 opacity-90" style={{ background: accent }} />
      <span
        aria-hidden
        dir="ltr"
        className="absolute start-[6.6vw] top-1/2 -translate-y-1/2 rotate-180 whitespace-nowrap text-mono text-[10px] uppercase tracking-[0.4em] opacity-50 [writing-mode:vertical-rl]"
      >
        {flagship ? c.featured : c.case} · {p.index}
      </span>

      {/* 1 · title */}
      <Par speed={-0.08} className="w-[38vw] shrink-0">
        <p className="text-mono text-[10px] uppercase tracking-[0.26em] opacity-60">
          {p.category} · {p.year}
        </p>
        <h3 className="mt-5 text-display leading-[0.88]">
          {/* one line, sized to the name: a wide face × 13 letters can't share a size with 7 */}
          <Letters text={brand} style={{ fontSize: `min(9rem, 7.4vw, ${(36 / (brand.length * 0.66)).toFixed(2)}vw)` }} />
        </h3>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.5 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
          className="mt-4 max-w-[30vw] text-display text-[clamp(1.2rem,2vw,1.9rem)] italic leading-tight opacity-80"
        >
          {tagline}
        </motion.p>
        <div className="mt-10 max-w-[30vw] border-t pt-6" style={{ borderColor: `${ink}22` }}>
          <Meta p={p} c={c} />
        </div>
      </Par>

      {/* 2 · the site, straightening as it reaches the centre */}
      <Par speed={0.06} tilt={-4} className="w-[50vw] shrink-0">
        <Frame p={p} accent={accent} />
      </Par>

      {/* 3 · premise as a pull quote */}
      <Par speed={-0.12} className="w-[34vw] shrink-0">
        <p className="text-mono text-[10px] uppercase tracking-[0.26em] opacity-55">{c.premise}</p>
        <span aria-hidden className="mt-2 block text-display text-[7rem] leading-[0.6]" style={{ color: accent }}>
          “
        </span>
        <motion.p
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ amount: 0.4 }}
          transition={{ duration: 1.1, ease: EASE }}
          className="text-display text-[clamp(1.4rem,2.3vw,2.3rem)] leading-[1.18]"
        >
          {p.summary}
        </motion.p>
      </Par>

      {/* 4 · the story + the way in */}
      <Par speed={0.04} className="w-[36vw] shrink-0">
        <Chapters p={p} c={c} accent={accent} />
        <div className="mt-8 flex flex-wrap gap-1.5">
          {p.stack.map((s) => (
            <span key={s} className="rounded-full border px-2.5 py-1 text-mono text-[9px] uppercase tracking-[0.16em] opacity-80" style={{ borderColor: `${ink}30` }}>
              {s}
            </span>
          ))}
        </div>
        <div className="mt-8">
          <Cta p={p} c={c} accent={accent} ink={onAccent(accent)} />
        </div>
      </Par>
    </article>
  );
}

const isLight = (hex: string) => {
  const v = parseInt(hex.slice(1), 16);
  return (0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255)) / 255 > 0.6;
};

function Exhibition() {
  const c = useCopy(COPY);
  const { lang } = useLang();
  const ar = lang === "ar";
  const projects = useMemo(() => PROJECTS.map((p) => localizeProject(p, lang)), [lang]);
  // Arabic reads right → left: the rooms are laid out mirrored and the
  // gallery travels the other way.
  const rooms = ar ? [...projects].reverse() : projects;

  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);
  const [vw, setVw] = useState(1440);
  const [vh, setVh] = useState(900);

  useLayoutEffect(() => {
    const measure = () => {
      const t = trackRef.current;
      if (!t) return;
      setVw(window.innerWidth);
      setVh(window.innerHeight);
      setDist(Math.max(0, t.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [lang]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, (p) => (ar ? -(1 - p) * dist : -p * dist));
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // HUD: which room is centred
  const [current, setCurrent] = useState(-1);
  useMotionValueEvent(x, "change", (v) => {
    const t = trackRef.current;
    if (!t) return;
    const mid = -v + vw / 2;
    let found = -1;
    t.querySelectorAll<HTMLElement>("article[data-room]").forEach((el) => {
      if (el.offsetLeft <= mid && el.offsetLeft + el.offsetWidth > mid) found = Number(el.dataset.room);
    });
    if (found !== current) setCurrent(found);
  });

  const track: Track = { x, vw, trackRef };
  const cur = current >= 0 ? projects[current] : null;

  return (
    <section ref={sectionRef} aria-label={c.eyebrow} className="relative" style={{ height: dist ? dist + vh : `${N * 190 + 70}vh` }}>
      {/* LTR coordinate space: in an RTL page an over-wide track would hang off
          the left edge. Rooms and HUD set their own direction. */}
      <div dir="ltr" className="sticky top-0 h-screen overflow-hidden">
        <TrackCtx.Provider value={track}>
          <motion.div ref={trackRef} dir="ltr" style={{ x }} className="relative flex h-full w-max will-change-transform">
            {/* intro room */}
            {!ar ? <IntroRoom c={c} /> : null}
            {rooms.map((p) => (
              <Room key={p.slug} p={p} i={projects.indexOf(p)} c={c} dir={ar ? "rtl" : "ltr"} />
            ))}
            {ar ? <IntroRoom c={c} /> : null}
          </motion.div>
        </TrackCtx.Provider>

        {/* HUD — difference blending keeps it legible on dark and light rooms */}
        <div dir={ar ? "rtl" : "ltr"} className="pointer-events-none absolute inset-x-0 bottom-0 z-10 pb-7 pe-[7.5rem] ps-[12.5rem] text-white mix-blend-difference">
          <div className="flex items-end justify-between text-mono text-[10px] uppercase tracking-[0.24em]">
            <span>{c.eyebrow}</span>
            <span dir={ar ? "rtl" : "ltr"}>
              {cur ? (
                <>
                  <span dir="ltr">{cur.index}</span> {c.of} <span dir="ltr">{String(N).padStart(2, "0")}</span> · {cur.title.split("·")[0].trim()}
                </>
              ) : (
                <span dir="ltr">— / {String(N).padStart(2, "0")}</span>
              )}
            </span>
          </div>
          <div className="relative mt-3 h-px w-full bg-white/25">
            <motion.span style={{ scaleX: bar }} className={`absolute inset-0 bg-white ${ar ? "origin-right" : "origin-left"}`} />
          </div>
        </div>
      </div>
    </section>
  );
}

function IntroRoom({ c }: { c: Copy }) {
  const { lang } = useLang();
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="relative flex h-screen w-[78vw] shrink-0 items-center bg-ink px-[8vw] text-bone">
      <Par speed={-0.1}>
        <p className="eyebrow">{c.eyebrow}</p>
        <h2 className="mt-6 text-display text-[clamp(2.6rem,6vw,6.5rem)] leading-[0.95]">
          {c.introA}
          <br />
          <span className="italic text-accent">{c.introB}</span>
        </h2>
        <p className="mt-8 max-w-md text-[15px] leading-relaxed text-bone/65">{c.introP}</p>
        <div className="mt-10 flex gap-2">
          {PROJECTS.map((p) => (
            <motion.span
              key={p.slug}
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ amount: 0.5 }}
              transition={{ duration: 0.9, ease: EASE, delay: Number(p.index) * 0.1 }}
              className="block h-14 w-10 origin-bottom rounded-full"
              style={{ background: `linear-gradient(180deg, ${p.palette.accent}, ${p.palette.bg})`, boxShadow: `0 0 0 1px ${p.palette.ink}22` }}
            />
          ))}
        </div>
      </Par>
    </div>
  );
}

/* ── phones / reduced motion: rooms stacked vertically ────────────────── */

function Stacked({ still }: { still: boolean }) {
  const c = useCopy(COPY);
  const { lang } = useLang();
  return (
    <section aria-label={c.eyebrow}>
      <div className="bg-ink px-5 py-20 text-bone">
        <p className="eyebrow">{c.eyebrow}</p>
        <h2 className="mt-5 text-display text-[2.6rem] leading-[0.95]">
          {c.introA} <span className="italic text-accent">{c.introB}</span>
        </h2>
      </div>
      {PROJECTS.map((raw, i) => {
        const p = localizeProject(raw, lang);
        const { bg, ink, accent } = p.palette;
        const [brand, tagline] = p.title.split("·").map((s) => s.trim());
        return (
          <article
            key={p.slug}
            id={`case-${p.slug}`}
            className="relative overflow-hidden px-5 py-16"
            style={{ background: bg, color: ink }}
            data-surface={isLight(bg) ? "light" : "dark"}
          >
            <span aria-hidden className="absolute inset-y-0 start-0 w-2" style={{ background: accent }} />
            <p className="text-mono text-[10px] uppercase tracking-[0.24em] opacity-60">
              {i === 0 ? c.featured : c.case} · <span dir="ltr">{p.index}</span>
            </p>
            <h3 className="mt-4 text-display leading-[0.9]">
              {still ? (
                <span style={{ fontSize: `min(3.4rem, ${(86 / (brand.length * 0.66)).toFixed(2)}vw)` }}>{brand}</span>
              ) : (
                <Letters text={brand} style={{ fontSize: `min(3.4rem, ${(86 / (brand.length * 0.66)).toFixed(2)}vw)` }} />
              )}
            </h3>
            <p className="mt-3 text-display text-xl italic opacity-80">{tagline}</p>
            <div className="mt-8">
              <Frame p={p} accent={accent} />
            </div>
            <div className="mt-8 border-t pt-6" style={{ borderColor: `${ink}22` }}>
              <Meta p={p} c={c} />
            </div>
            <p className="mt-10 text-mono text-[10px] uppercase tracking-[0.24em] opacity-55">{c.premise}</p>
            <p className="mt-3 text-display text-[1.5rem] leading-[1.2]">{p.summary}</p>
            <div className="mt-10">
              <Chapters p={p} c={c} accent={accent} />
            </div>
            <div className="mt-8">
              <Cta p={p} c={c} accent={accent} ink={onAccent(accent)} />
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function CaseStudies() {
  const reduce = !!useReducedMotion();
  const isMobile = useIsMobile("(max-width: 1023px)");
  if (reduce) return <Stacked still />;
  return isMobile ? <Stacked still={false} /> : <Exhibition />;
}
