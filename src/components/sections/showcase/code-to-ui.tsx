"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useCopy } from "@/lib/i18n";

/*
 * From Scratch · "Code becomes the page". Scroll types a component line by
 * line; the moment a line is finished, its characters lift off the editor as
 * glowing glyphs and pour across into the preview, where the exact element
 * that line describes builds itself. Scroll back and it un-builds.
 *
 * The editor and preview are DOM; the glyph stream is one 2D canvas whose
 * loop only runs while glyphs are in flight.
 */

type Cls = "key" | "fn" | "str" | "tag" | "attr" | "punc" | "var" | "com";
type El = "frame" | "nav" | "badge" | "h1" | "p" | "btn" | "orb" | "chips" | "deploy";
type Line = { t: [string, Cls][]; el?: El };

const TOK: Record<Cls, string> = {
  key: "#ff7a59",
  fn: "#82aaff",
  str: "#c3e88d",
  tag: "#f07178",
  attr: "#ffcb6b",
  punc: "#8b93a7",
  var: "#e0def4",
  com: "#5a6172",
};

const LINES: Line[] = [
  { t: [["import", "key"], [" { Orb, Magnetic } ", "var"], ["from", "key"], [' "@/studio"', "str"], [";", "punc"]] },
  { t: [] },
  { t: [["export default function", "key"], [" Hero", "fn"], ["() {", "punc"]] },
  { t: [["  return", "key"], [" (", "punc"]] },
  { t: [["    <", "punc"], ["section", "tag"], [" className", "attr"], ["=", "punc"], ['"hero"', "str"], [">", "punc"]], el: "frame" },
  { t: [["      <", "punc"], ["Nav", "tag"], [" brand", "attr"], ["=", "punc"], ['"amr/studio"', "str"], [" />", "punc"]], el: "nav" },
  { t: [["      <", "punc"], ["Badge", "tag"], [" live", "attr"], [">", "punc"], ["Now booking", "var"], ["</", "punc"], ["Badge", "tag"], [">", "punc"]], el: "badge" },
  { t: [["      <", "punc"], ["h1", "tag"], [">", "punc"], ["Built from ", "var"], ["<", "punc"], ["em", "tag"], [">", "punc"], ["scratch.", "var"], ["</", "punc"], ["em", "tag"], ["></", "punc"], ["h1", "tag"], [">", "punc"]], el: "h1" },
  { t: [["      <", "punc"], ["p", "tag"], [">", "punc"], ["No templates. No page builders.", "var"], ["</", "punc"], ["p", "tag"], [">", "punc"]], el: "p" },
  { t: [["      <", "punc"], ["Magnetic", "tag"], ["><", "punc"], ["Button", "tag"], [">", "punc"], ["Start a project", "var"], ["</", "punc"], ["Button", "tag"], ["></", "punc"], ["Magnetic", "tag"], [">", "punc"]], el: "btn" },
  { t: [["      <", "punc"], ["Orb", "tag"], [" hue", "attr"], ["={", "punc"], ["18", "key"], ["}", "punc"], [" drift", "attr"], [" />", "punc"]], el: "orb" },
  { t: [["      <", "punc"], ["Chips", "tag"], [" items", "attr"], ["={[", "punc"], ['"EN / AR"', "str"], [", ", "punc"], ['"RTL"', "str"], [", ", "punc"], ['"A11y"', "str"], ["]} />", "punc"]], el: "chips" },
  { t: [["    </", "punc"], ["section", "tag"], [">", "punc"]] },
  { t: [["  )", "punc"], [";", "punc"]] },
  { t: [["}", "punc"]], el: "deploy" },
];

const LEN = LINES.map((l) => l.t.reduce((n, [s]) => n + s.length, 0));
const START = LEN.reduce<number[]>((acc, _, i) => [...acc, i ? acc[i - 1] + LEN[i - 1] + 1 : 0], []);
const TOTAL = START[START.length - 1] + LEN[LEN.length - 1];

const COPY = {
  en: {
    eyebrow: "From Scratch",
    h1: "Watch the code",
    h2: "become the page.",
    p: "Your scroll types every line below, and every element on the right is built by its line. No templates. No page builders.",
    deployed: "Deployed",
  },
  ar: {
    eyebrow: "من الصفر",
    h1: "شاهد الشيفرة",
    h2: "تصبح صفحة.",
    p: "تمريرك يكتب كل سطر أدناه، وكل عنصر على اليمين يبنيه سطره. بلا قوالب. بلا أدوات بناء جاهزة.",
    deployed: "تم النشر",
  },
};

type Glyph = { ch: string; color: string; sx: number; sy: number; cx: number; cy: number; ex: number; ey: number; t0: number; dur: number; rot: number };

const reveal = {
  off: { opacity: 0, y: 14, scale: 0.97, filter: "blur(6px)", transition: { duration: 0.25 } },
  on: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.7, delay: 0.42, ease: [0.19, 1, 0.22, 1] } },
};

export function CodeToUI() {
  const c = useCopy(COPY);
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lineEnds = useRef<(HTMLSpanElement | null)[]>([]);
  const els = useRef<Partial<Record<El, HTMLElement | null>>>({});
  const glyphs = useRef<Glyph[]>([]);
  const raf = useRef(0);
  const [typed, setTyped] = useState(reduce ? TOTAL : 0);
  const doneRef = useRef(reduce ? LINES.length : 0);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const headOpacity = useTransform(scrollYProgress, [0, 0.06, 0.12], [1, 1, 0.35]);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (reduce) return;
    const k = Math.max(0, Math.min(1, (p - 0.08) / 0.74));
    setTyped(Math.round(k * TOTAL));
  });

  // which lines are complete, and which elements they've built
  const done = useMemo(() => LINES.filter((_, i) => typed >= START[i] + LEN[i]).length, [typed]);
  const built = useMemo(() => {
    const s = new Set<El>();
    LINES.forEach((l, i) => l.el && typed >= START[i] + LEN[i] && s.add(l.el));
    return s;
  }, [typed]);

  // glyph stream: newly finished lines pour into their elements
  useEffect(() => {
    const prev = doneRef.current;
    doneRef.current = done;
    if (reduce || done <= prev) return;
    const stage = stageRef.current;
    if (!stage) return;
    const sr = stage.getBoundingClientRect();
    const now = performance.now();
    for (let i = prev; i < done; i++) {
      const line = LINES[i];
      const end = lineEnds.current[i];
      const target = line.el ? els.current[line.el] : null;
      if (!end || !target) continue;
      const a = end.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      const chars = line.t.flatMap(([s, cls]) => [...s.replace(/\s/g, "")].map((ch) => [ch, TOK[cls]] as const));
      const n = Math.min(46, Math.max(14, chars.length * 2));
      for (let j = 0; j < n; j++) {
        const [ch, color] = chars[(j * 7) % chars.length] ?? ["·", TOK.var];
        const sx = a.left - sr.left - Math.random() * Math.min(260, a.left - sr.left) * 0.6;
        const sy = a.top - sr.top + a.height / 2 + (Math.random() - 0.5) * 8;
        const ex = b.left - sr.left + Math.random() * b.width;
        const ey = b.top - sr.top + Math.random() * b.height;
        glyphs.current.push({
          ch,
          color,
          sx,
          sy,
          cx: (sx + ex) / 2 + (Math.random() - 0.5) * 160,
          cy: Math.min(sy, ey) - 60 - Math.random() * 120,
          ex,
          ey,
          t0: now + j * 9,
          dur: 520 + Math.random() * 420,
          rot: (Math.random() - 0.5) * 3,
        });
      }
    }
    if (!raf.current) raf.current = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, reduce]);

  function tick(now: number) {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !stage || !ctx) {
      raf.current = 0;
      return;
    }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.font = "600 12px 'JetBrains Mono', ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const alive: Glyph[] = [];
    for (const g of glyphs.current) {
      const k = (now - g.t0) / g.dur;
      if (k < 0) {
        alive.push(g);
        continue;
      }
      if (k >= 1) continue;
      alive.push(g);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const x = (1 - e) * (1 - e) * g.sx + 2 * (1 - e) * e * g.cx + e * e * g.ex;
      const y = (1 - e) * (1 - e) * g.sy + 2 * (1 - e) * e * g.cy + e * e * g.ey;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(g.rot * e);
      ctx.globalAlpha = Math.sin(Math.PI * Math.min(1, k * 1.15));
      ctx.shadowColor = g.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = g.color;
      ctx.fillText(g.ch, 0, 0);
      ctx.restore();
    }
    glyphs.current = alive;
    if (alive.length) raf.current = requestAnimationFrame(tick);
    else {
      ctx.clearRect(0, 0, w, h);
      raf.current = 0;
    }
  }

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const on = (el: El) => (built.has(el) ? "on" : "off");
  const elRef = (el: El) => (node: HTMLElement | null) => {
    els.current[el] = node;
  };

  // the caret sits on the line being typed
  const caretLine = Math.min(LINES.length - 1, START.findIndex((s, i) => typed < s + LEN[i] + 1));

  return (
    <section ref={ref} className="relative border-b border-line" style={{ height: reduce ? "auto" : "360vh" }}>
      <div ref={stageRef} className={`${reduce ? "relative py-20" : "sticky top-0 h-screen"} overflow-hidden px-5 md:px-10`}>
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(130,170,255,0.12),transparent)] blur-2xl" />

        <motion.div style={{ opacity: reduce ? 1 : headOpacity }} className="relative z-10 mx-auto max-w-[1600px] pt-24 md:pt-24">
          <Eyebrow index="A4">{c.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-display text-[clamp(1.8rem,3.6vw,3.2rem)] leading-[1.02] text-bone">
            {c.h1} <span className="italic text-accent">{c.h2}</span>
          </h2>
          <p className="mt-3 hidden max-w-lg text-sm leading-relaxed text-bone/60 md:block">{c.p}</p>
        </motion.div>

        <div dir="ltr" className="relative z-10 mx-auto mt-6 grid max-w-[1600px] grid-cols-1 gap-4 md:mt-8 md:grid-cols-[0.95fr_1.05fr] md:gap-8">
          {/* editor */}
          <div className="code-editor overflow-hidden rounded-2xl border border-line bg-[#0b0c10]/90 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="font-mono text-[10px] tracking-wide text-bone/50">Hero.tsx</span>
              <span className="ml-auto font-mono text-[10px] text-bone/35">
                {typed}/{TOTAL}
              </span>
            </div>
            <div className="h-[30vh] overflow-hidden p-4 font-mono text-[10px] leading-[1.75] md:h-[48vh] md:text-[12.5px]">
              {LINES.map((line, i) => {
                let left = Math.max(0, Math.min(LEN[i], typed - START[i]));
                return (
                  <div key={i} className="flex gap-4 whitespace-pre">
                    <span className="code-gutter w-5 shrink-0 select-none text-right">{i + 1}</span>
                    <span>
                      {line.t.map(([s, cls], j) => {
                        const show = s.slice(0, left);
                        left -= show.length;
                        return show ? (
                          <span key={j} className={`tok-${cls}`}>
                            {show}
                          </span>
                        ) : null;
                      })}
                      <span ref={(n) => { lineEnds.current[i] = n; }} />
                      {!reduce && i === caretLine ? <span className="ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.15em] animate-pulse bg-accent" /> : null}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* live preview, built by the code */}
          <div className="overflow-hidden rounded-2xl border border-line bg-[#141417] shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-full bg-black/50 px-3 py-1">
                <span className={`h-1.5 w-1.5 rounded-full ${built.has("deploy") ? "bg-emerald-400" : "bg-amber-300"}`} />
                <span className="font-mono text-[10px] tracking-wide text-bone/55">localhost:3000</span>
              </div>
            </div>
            <div className="relative h-[30vh] md:h-[48vh]">
              <motion.div
                ref={elRef("frame")}
                variants={reveal}
                initial={false}
                animate={on("frame")}
                className="absolute inset-0 overflow-hidden bg-[radial-gradient(80%_70%_at_75%_30%,rgba(255,77,31,0.16),transparent_60%),linear-gradient(160deg,#101117,#050506)]"
              >
                <motion.div ref={elRef("nav")} variants={reveal} initial={false} animate={on("nav")} className="absolute left-[5%] right-[5%] top-[5%] flex h-8 items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 md:h-9">
                  <span className="h-4 w-4 rounded-full bg-[conic-gradient(#ff4d1f,#7c3aed,#22d3ee,#ff4d1f)]" />
                  <span className="font-mono text-[9px] tracking-[0.25em] text-white/85">AMR/STUDIO</span>
                  <span className="ml-auto hidden gap-4 font-mono text-[9px] uppercase tracking-[0.2em] text-white/50 sm:flex">
                    <span>Work</span>
                    <span>Contact</span>
                  </span>
                </motion.div>

                <motion.span ref={elRef("badge")} variants={reveal} initial={false} animate={on("badge")} className="absolute left-[6%] top-[23%] inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Now booking
                </motion.span>

                <motion.h3 ref={elRef("h1")} variants={reveal} initial={false} animate={on("h1")} className="absolute left-[6%] top-[33%] font-[family-name:var(--font-nexium)] text-[clamp(1.4rem,3.4vw,3.2rem)] leading-[0.98] text-[#EFEAE2]">
                  Built from
                  <br />
                  <em className="font-[family-name:var(--font-serif)] text-[#ff4d1f]">scratch.</em>
                </motion.h3>

                <motion.p ref={elRef("p")} variants={reveal} initial={false} animate={on("p")} className="absolute left-[6%] top-[62%] text-[11px] text-white/60 md:text-[13px]">
                  No templates. No page builders.
                </motion.p>

                <motion.span ref={elRef("btn")} variants={reveal} initial={false} animate={on("btn")} className="absolute left-[6%] top-[73%] rounded-full bg-[#EFEAE2] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-black md:px-5 md:py-2.5 md:text-[10px]">
                  Start a project →
                </motion.span>

                <motion.div ref={elRef("orb")} variants={reveal} initial={false} animate={on("orb")} className="absolute right-[7%] top-[22%] aspect-square w-[34%]">
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_32%,#ffd9bd_0%,#ff4d1f_28%,#7c3aed_62%,transparent_71%)]" />
                  <div className="absolute -inset-[8%] animate-[spin_18s_linear_infinite] rounded-full border border-white/15" />
                </motion.div>

                <motion.div ref={elRef("chips")} variants={reveal} initial={false} animate={on("chips")} className="absolute bottom-[6%] right-[6%] flex gap-1.5">
                  {["EN / AR", "RTL", "A11y"].map((t) => (
                    <span key={t} className="rounded-full border border-white/20 bg-white/[0.05] px-2 py-1 font-mono text-[8px] tracking-[0.16em] text-white/80 md:text-[9px]">
                      {t}
                    </span>
                  ))}
                </motion.div>

                <motion.div ref={elRef("deploy")} variants={reveal} initial={false} animate={on("deploy")} className="absolute bottom-[6%] left-[6%] flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-black/70 px-3 py-2 font-mono text-[10px] text-emerald-300 backdrop-blur">
                  ✓ {c.deployed} · amrstudio.dev
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 z-20 h-full w-full" />
      </div>
    </section>
  );
}
