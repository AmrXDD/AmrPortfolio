"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
} from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useCopy, useLang } from "@/lib/i18n";

/*
 * Craft · "Anatomy of a page". A finished page sits flat on screen; scroll
 * tips it into an isometric view and pulls it apart into the seven layers
 * every site is made of, each with its own callout. A scan light walks down
 * the stack, then it all snaps back together and gets stamped SHIPPED.
 *
 * Pure CSS 3D (transform-style: preserve-3d) driven by framer-motion values:
 * compositor-only transforms, no WebGL, nothing to compile or upload.
 */

const W = 960; // page size, in its own pixels
const H = 600;
const GAP = 78; // distance between layers when fully exploded

const COPY = {
  en: {
    eyebrow: "The Craft · Anatomy",
    h1: "Seven layers",
    h2: "in every page.",
    p: "This is what a page looks like before it's flattened into one. I design and build every layer myself.",
    layer: "Layer",
    of: "of",
    shipped: "Shipped",
    layers: [
      ["Canvas", "Surface, depth and light: the ground everything stands on."],
      ["Grid", "A 12-column grid on an 8pt rhythm. Nothing sits anywhere by accident."],
      ["Art direction", "Colour, imagery and the one visual idea the brand hangs from."],
      ["Typography", "A type scale tuned for every screen size, in English and Arabic."],
      ["Components", "Nav, buttons, cards: built once as a system, reused everywhere."],
      ["Motion", "Easing curves and choreography: what moves, when, and why."],
      ["Redlines", "Spacing, contrast and specs checked to the pixel before it ships."],
    ],
  },
  ar: {
    eyebrow: "الحِرفة · التشريح",
    h1: "سبع طبقات",
    h2: "في كل صفحة.",
    p: "هكذا تبدو الصفحة قبل أن تُدمج في طبقة واحدة. أصمّم كل طبقة وأبنيها بنفسي.",
    layer: "الطبقة",
    of: "من",
    shipped: "أُطلق",
    layers: [
      ["الخلفية", "السطح والعمق والضوء: الأرض التي يقف عليها كل شيء."],
      ["الشبكة", "شبكة من 12 عمودًا على إيقاع 8 نقاط. لا شيء في مكانه صدفة."],
      ["التوجيه الفني", "الألوان والصور والفكرة البصرية الواحدة التي تُبنى عليها الهوية."],
      ["الخطوط", "سلّم خطوط مضبوط لكل حجم شاشة، بالعربية والإنجليزية."],
      ["المكوّنات", "القائمة والأزرار والبطاقات: تُبنى مرة كنظام وتُستخدم في كل مكان."],
      ["الحركة", "منحنيات التسارع وتصميم الحركة: ما الذي يتحرّك، ومتى، ولماذا."],
      ["المواصفات", "المسافات والتباين والمقاسات تُراجع بدقة البكسل قبل الإطلاق."],
    ],
  },
};

/* ── the seven layers of the mock page (960 × 600) ────────────────────── */

const Canvas = () => (
  <div className="absolute inset-0 overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(160deg,#101117,#060608)]">
    <div className="absolute inset-0 opacity-[0.35] [background:radial-gradient(70%_60%_at_80%_20%,rgba(255,77,31,0.18),transparent_60%)]" />
  </div>
);

const Grid = () => (
  <div className="absolute inset-0">
    <div className="absolute inset-y-0 left-12 right-12 flex gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} className="h-full flex-1 bg-[rgba(255,77,31,0.07)]" />
      ))}
    </div>
    <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:100%_24px]" />
  </div>
);

const Art = () => (
  <div className="absolute inset-0">
    <div className="absolute right-[70px] top-[110px] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_35%_32%,#ffd9bd_0%,#ff4d1f_28%,#7c3aed_62%,transparent_71%)]" />
    <div className="absolute right-[40px] top-[80px] h-[380px] w-[380px] animate-[spin_24s_linear_infinite] rounded-full border border-white/15" />
    <div className="absolute right-[190px] top-[210px] h-[120px] w-[120px] rotate-12 rounded-[28px] border border-white/25 bg-white/[0.06]" />
  </div>
);

const Type = () => (
  <div className="absolute inset-0 text-[#EFEAE2]">
    <p className="absolute left-12 top-[150px] font-mono text-[11px] uppercase tracking-[0.3em] text-white/50">Amr Studio · Case 01</p>
    <p className="absolute left-12 top-[178px] font-[family-name:var(--font-nexium)] text-[66px] leading-[0.98]">
      Spaces, scripted
      <br />
      <span className="font-[family-name:var(--font-serif)] italic text-[#ff4d1f]">into reality.</span>
    </p>
    <div className="absolute left-12 top-[352px] space-y-2.5">
      <span className="block h-[7px] w-[340px] rounded bg-white/25" />
      <span className="block h-[7px] w-[300px] rounded bg-white/20" />
      <span className="block h-[7px] w-[220px] rounded bg-white/15" />
    </div>
  </div>
);

const Components = () => (
  <div className="absolute inset-0 text-[#EFEAE2]">
    <div className="absolute left-12 right-12 top-7 flex h-11 items-center gap-3 rounded-full border border-white/15 bg-black/40 px-4">
      <span className="h-5 w-5 rounded-full bg-[conic-gradient(#ff4d1f,#7c3aed,#22d3ee,#ff4d1f)]" />
      <span className="font-mono text-[11px] tracking-[0.25em]">AMR/STUDIO</span>
      <span className="ml-auto flex gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
        <span>Work</span>
        <span>Craft</span>
        <span>Contact</span>
      </span>
      <span className="rounded-full bg-[#EFEAE2] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-black">Hire</span>
    </div>
    <div className="absolute left-12 top-[440px] flex items-center gap-3">
      <span className="rounded-full bg-[#EFEAE2] px-6 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-black">Start a project →</span>
      <span className="rounded-full border border-white/25 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em]">Selected work</span>
    </div>
    <div className="absolute bottom-8 right-12 flex gap-3">
      {["EN / AR", "RTL", "A11y"].map((c) => (
        <span key={c} className="rounded-full border border-white/20 bg-white/[0.05] px-3 py-1.5 font-mono text-[10px] tracking-[0.18em]">
          {c}
        </span>
      ))}
    </div>
  </div>
);

const Motion = () => (
  <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} fill="none">
    <path id="mp1" d="M 200 470 C 360 560, 520 300, 700 270" stroke="rgba(34,211,238,0.7)" strokeWidth="1.5" strokeDasharray="4 6" />
    <circle r="6" fill="#22d3ee">
      <animateMotion dur="2.6s" repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.19 1 0.22 1">
        <mpath href="#mp1" />
      </animateMotion>
    </circle>
    <g transform="translate(660 400)">
      <rect width="250" height="150" rx="14" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.15)" />
      <path d="M 20 130 C 50 30, 70 25, 230 22" stroke="#ff4d1f" strokeWidth="2.5" />
      <path d="M 20 130 L 230 22" stroke="rgba(255,255,255,0.15)" strokeDasharray="3 5" />
      <text x="20" y="146" fill="rgba(255,255,255,0.55)" stroke="none" fontFamily="ui-monospace,monospace" fontSize="10">
        cubic-bezier(.19, 1, .22, 1)
      </text>
    </g>
  </svg>
);

const Redlines = () => {
  const red = "#ff3b5c";
  const tag = (x: number, y: number, t: string) => (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-2" y="-11" width={t.length * 6.6 + 10} height="16" rx="3" fill={red} />
      <text x="3" y="1" fill="#fff" stroke="none" fontFamily="ui-monospace,monospace" fontSize="10">
        {t}
      </text>
    </g>
  );
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} fill="none" stroke={red} strokeWidth="1">
      {/* left margin */}
      <path d="M 0 300 H 48 M 6 294 L 0 300 L 6 306 M 42 294 L 48 300 L 42 306" />
      {tag(12, 288, "48")}
      {/* headline to paragraph */}
      <path d="M 70 312 V 352 M 64 318 L 70 312 L 76 318 M 64 346 L 70 352 L 76 346" />
      {tag(80, 336, "40")}
      {/* paragraph to buttons */}
      <path d="M 300 395 V 440" />
      {tag(308, 422, "48")}
      {/* type spec */}
      {tag(520, 178, "66 / 0.98 · Nexium")}
      {/* contrast */}
      {tag(48, 520, "AA · 4.5:1+")}
      {/* column */}
      <path d="M 48 586 H 115 M 48 580 V 592 M 115 580 V 592" />
      {tag(124, 590, "1 col · 8pt grid")}
    </svg>
  );
};

const LAYERS: (() => ReactNode)[] = [Canvas, Grid, Art, Type, Components, Motion, Redlines];

/* ── one layer in the stack ───────────────────────────────────────────── */

function Layer({
  i,
  explode,
  active,
  label,
  showLabel,
}: {
  i: number;
  explode: MotionValue<number>;
  active: boolean;
  label: [string, string];
  showLabel: boolean;
}) {
  const z = useTransform(explode, (e) => (i - 3) * GAP * e);
  const plate = useTransform(explode, [0, 1], [0, 1]);
  // grid, motion paths and redlines are scaffolding: invisible on the
  // finished page, revealed as it comes apart
  const scaffold = i === 1 || i === 5 || i === 6;
  const contentOpacity = useTransform(explode, [0, 0.5], scaffold ? [0, 1] : [1, 1]);
  const Content = LAYERS[i];
  return (
    <motion.div className="absolute inset-0" style={{ z, transformStyle: "preserve-3d" }}>
      {/* the slab edge, only visible once the stack comes apart */}
      <motion.div
        style={{ opacity: plate }}
        className={`absolute inset-0 rounded-[22px] border transition-colors duration-500 ${
          active ? "border-[#ff4d1f] bg-[rgba(255,77,31,0.06)] shadow-[0_0_60px_rgba(255,77,31,0.25)]" : "border-white/10 bg-white/[0.015]"
        }`}
      />
      <motion.div className="absolute inset-0" style={{ opacity: contentOpacity }}>
        <Content />
      </motion.div>
      {active ? (
        // scan light sweeping across the active layer
        <motion.div
          key={`scan-${i}`}
          initial={{ x: "-10%", opacity: 0 }}
          animate={{ x: "110%", opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-y-0 w-24 bg-[linear-gradient(90deg,transparent,rgba(255,180,140,0.35),transparent)]"
        />
      ) : null}
      {showLabel ? (
        <motion.div style={{ opacity: plate }} className="absolute left-full top-[44%] ml-8 hidden items-center gap-4 whitespace-nowrap md:flex">
          <span className={`h-[2px] w-20 ${active ? "bg-[#ff4d1f]" : "bg-white/30"}`} />
          <span
            className={`rounded-full border-2 px-5 py-2 font-mono text-[22px] uppercase tracking-[0.16em] ${
              active ? "border-[#ff4d1f] bg-[#ff4d1f] text-black" : "border-white/20 bg-black/60 text-white/80"
            }`}
          >
            <span dir="ltr">{String(i + 1).padStart(2, "0")}</span> · {label[0]}
          </span>
        </motion.div>
      ) : null}
    </motion.div>
  );
}

export function CraftAnatomy() {
  const c = useCopy(COPY);
  const { lang } = useLang();
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [fit, setFit] = useState(0.8);
  const [active, setActive] = useState(-1);
  const [shipped, setShipped] = useState(false);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const still = useMotionValue(1);
  const p = reduce ? still : scrollYProgress;

  const explode = useTransform(p, [0, 0.14, 0.36, 0.73, 0.9], reduce ? [1, 1, 1, 1, 1] : [0, 0, 1, 1, 0]);
  const tiltX = useTransform(p, [0, 0.12, 0.34, 0.75, 0.92], reduce ? [55, 55, 55, 55, 55] : [0, 0, 56, 56, 0]);
  const tiltZ = useTransform(p, [0, 0.12, 0.34, 0.75, 0.92], reduce ? [-32, -32, -32, -32, -32] : [0, 0, -36, -26, 0]);
  const scale = useTransform(p, [0, 0.12, 0.34, 0.75, 0.92], reduce ? [0.72, 0.72, 0.72, 0.72, 0.72] : [1, 1, 0.74, 0.74, 1]);
  const intro = useTransform(p, [0, 0.1, 0.2], [1, 1, 0.25]);

  // a little parallax from the pointer on top of the scroll pose
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const ry = useSpring(useTransform(mx, [-1, 1], [-7, 7]), { stiffness: 90, damping: 18 });
  const rxOff = useSpring(useTransform(my, [-1, 1], [5, -5]), { stiffness: 90, damping: 18 });
  const rx = useTransform([tiltX, rxOff], ([a, b]: number[]) => a + b);
  const fitScale = useTransform(scale, (s) => s * fit);

  useMotionValueEvent(p, "change", (v) => {
    // the scan walks top layer → bottom layer while the stack is open
    const t = (v - 0.36) / 0.37;
    setActive(t >= 0 && t < 1 ? 6 - Math.min(6, Math.floor(t * 7)) : -1);
    setShipped(v > 0.93);
  });

  useEffect(() => {
    const onResize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const room = vw < 768 ? vw - 32 : Math.min(vw * 0.6, 1100);
      setFit(Math.min(room / W, (vh * 0.6) / H));
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onMove = (e: React.PointerEvent) => {
    mx.set((e.clientX / window.innerWidth) * 2 - 1);
    my.set((e.clientY / window.innerHeight) * 2 - 1);
  };

  const shown = active >= 0 ? active : reduce ? 4 : -1;

  return (
    <section id="craft" ref={ref} className="relative" style={{ height: reduce ? "auto" : "440vh" }} onPointerMove={onMove}>
      <div className={`${reduce ? "relative py-24" : "sticky top-0 h-screen"} overflow-hidden`}>
        {/* header */}
        <motion.div style={{ opacity: intro }} className="relative z-20 px-5 pt-24 md:absolute md:start-10 md:top-24 md:max-w-md md:px-0 md:pt-0">
          <Eyebrow index="A1">{c.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-display text-[clamp(1.9rem,4vw,3.4rem)] leading-[1.02] text-bone">
            {c.h1} <span className="italic text-accent">{c.h2}</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-bone/60">{c.p}</p>
        </motion.div>

        {/* the page, in 3D */}
        <div className="absolute inset-0 flex items-center justify-center md:ps-[18vw]" style={{ perspective: 2400 }}>
          <div className="relative" style={{ width: W * fit, height: H * fit }}>
            <motion.div
              dir="ltr"
              className="absolute left-1/2 top-1/2"
              style={{
                width: W,
                height: H,
                marginLeft: -W / 2,
                marginTop: -H / 2,
                scale: fitScale,
                rotateX: rx,
                rotateZ: tiltZ,
                rotateY: ry,
                transformStyle: "preserve-3d",
              }}
            >
              {LAYERS.map((_, i) => (
                <Layer key={i} i={i} explode={explode} active={shown === i} label={c.layers[i] as [string, string]} showLabel />
              ))}

              {/* SHIPPED stamp once the stack is whole again */}
              <AnimatePresence>
                {shipped ? (
                  <motion.div
                    initial={{ scale: 2.2, rotate: -18, opacity: 0 }}
                    animate={{ scale: 1, rotate: -8, opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 260, damping: 14 }}
                    className="absolute right-[90px] top-[150px] rounded-2xl border-[3px] border-[#ff4d1f] px-6 py-3 font-mono text-[34px] font-semibold uppercase tracking-[0.25em] text-[#ff4d1f]"
                    style={{ z: 260 }}
                  >
                    ✓ {c.shipped}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* caption for the lit layer */}
        <div className="pointer-events-none absolute bottom-10 start-5 z-20 max-w-sm md:start-10">
          <AnimatePresence mode="wait">
            {shown >= 0 ? (
              <motion.div
                key={`${lang}-${shown}`}
                initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                transition={{ duration: 0.45, ease: [0.19, 1, 0.22, 1] }}
              >
                <p className="text-mono text-[10px] uppercase tracking-[0.24em] text-bone/45">
                  {c.layer} <span dir="ltr">{String(shown + 1).padStart(2, "0")}</span> {c.of} <span dir="ltr">07</span>
                </p>
                <p className="mt-2 text-display text-[clamp(1.4rem,2.4vw,2.1rem)] leading-tight text-bone">{c.layers[shown][0]}</p>
                <p className="mt-2 text-sm leading-relaxed text-bone/60">{c.layers[shown][1]}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
