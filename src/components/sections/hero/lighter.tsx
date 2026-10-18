"use client";

import { animate, motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef } from "react";

/*
 * The lighter that lights the hero. A brushed-steel flip-top with the studio
 * mark engraved: it glides in from the corner, flips its lid, turns the
 * wheel and holds a real flame (the fluid simulation draws it: we only feed
 * it the nozzle position), carries the flame to the first word, lets it
 * catch, then closes and slips away. Every move is eased and unhurried.
 *
 * The SVG is drawn in a 70 × 120 box; the wick sits at (24, 15).
 */

const VB_W = 70;
const VB_H = 120;
const WICK = { x: 24, y: 15 };
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_IO = [0.65, 0, 0.35, 1] as const;

type Pt = { x: number; y: number };

const SPARKS: [number, number][] = [
  [-10, -9],
  [-4, -13],
  [3, -12],
  [-14, -3],
  [-7, -16],
];

/** One spark: flies out and fades as `p` runs 0 → 1. */
function Spark({ p, dx, dy }: { p: MotionValue<number>; dx: number; dy: number }) {
  const x = useTransform(p, [0, 1], [0, dx]);
  const y = useTransform(p, [0, 1], [0, dy]);
  const o = useTransform(p, [0, 0.15, 1], [0, 0.85, 0]);
  return <motion.circle cx={44} cy={16} r={0.9} fill="#ffcf8a" style={{ x, y, opacity: o }} />;
}

export function Lighter({
  play,
  target,
  rtl,
  width,
  stage,
  onFlame,
  onIgnite,
  onDone,
}: {
  play: boolean;
  /** where the title should catch, in hero pixels */
  target: Pt | null;
  rtl: boolean;
  /** drawn width in px */
  width: number;
  /** the hero's size, to start and leave off-screen */
  stage: { w: number; h: number };
  onFlame: (x: number, y: number, on: boolean) => void;
  onIgnite: (x: number, y: number) => void;
  onDone: () => void;
}) {
  const s = width / VB_W;
  const H = VB_H * s;
  const px = useMotionValue(-999);
  const py = useMotionValue(-999);
  const rot = useMotionValue(0);
  const lid = useMotionValue(0);
  const wheel = useMotionValue(0);
  const op = useMotionValue(0);
  const spark = useMotionValue(0);
  const ran = useRef(false);

  useEffect(() => {
    if (!play || !target || ran.current) return;
    ran.current = true;
    const dir = rtl ? -1 : 1;
    let flameOn = false;
    let alive = true;

    // the wick, relative to the pivot at the bottom centre, mirrored for RTL
    const wickV = { x: ((rtl ? VB_W - WICK.x : WICK.x) - VB_W / 2) * s, y: (WICK.y - VB_H) * s };
    const rotate = (v: Pt, deg: number) => {
      const a = (deg * Math.PI) / 180;
      return { x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) };
    };
    // where the box must be for the wick to sit at n with this tilt
    const boxFor = (n: Pt, deg: number) => {
      const w = rotate(wickV, deg);
      return { x: n.x - width / 2 - w.x, y: n.y - H - w.y };
    };
    const wickNow = () => {
      const w = rotate(wickV, rot.get());
      return { x: px.get() + width / 2 + w.x, y: py.get() + H + w.y };
    };

    // keep the simulation's flame on the wick while anything moves
    let raf = 0;
    const follow = () => {
      raf = requestAnimationFrame(follow);
      const n = wickNow();
      onFlame(n.x, n.y - 2 * s, flameOn);
    };
    raf = requestAnimationFrame(follow);

    const T = target;
    // it rises from below the title and holds the flame just under the wire
    const hover = { x: T.x - 46 * dir, y: T.y + 92 };
    const touch = { x: T.x - 2 * dir, y: T.y + 16 };
    const offIn = { x: T.x - 180 * dir, y: stage.h + 200 };
    const offOut = { x: T.x - 120 * dir, y: stage.h + 220 };
    const go = (to: Pt, deg: number, duration: number, ease: readonly number[]) => {
      const b = boxFor(to, deg);
      return Promise.all([
        animate(px, b.x, { duration, ease: ease as [number, number, number, number] }),
        animate(py, b.y, { duration, ease: ease as [number, number, number, number] }),
        animate(rot, deg, { duration, ease: ease as [number, number, number, number] }),
      ]);
    };
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    (async () => {
      const start = boxFor(offIn, -24 * dir);
      px.set(start.x);
      py.set(start.y);
      rot.set(-24 * dir);
      animate(op, 1, { duration: 0.5 });
      // in from the corner
      await go(hover, -8 * dir, 1.5, EASE_OUT);
      if (!alive) return;
      await wait(150);
      // flip the lid, turn the wheel, and there is a flame
      await animate(lid, 116, { type: "spring", stiffness: 170, damping: 15 });
      if (!alive) return;
      animate(wheel, 400, { duration: 0.45, ease: "easeOut" });
      animate(spark, [0, 1], { duration: 0.5, ease: "easeOut" });
      await wait(220);
      if (!alive) return;
      flameOn = true;
      await wait(750);
      if (!alive) return;
      // carry the flame to the first word
      await go(touch, 0, 1.15, EASE_IO);
      if (!alive) return;
      onIgnite(T.x, T.y);
      await wait(900);
      if (!alive) return;
      // done: close, step back, slip away
      flameOn = false;
      await animate(lid, 0, { duration: 0.35, ease: "easeIn" });
      if (!alive) return;
      await go({ x: touch.x - 30 * dir, y: touch.y + 40 }, -6 * dir, 0.5, EASE_IO);
      if (!alive) return;
      animate(op, 0, { duration: 1.1, delay: 0.3 });
      await go(offOut, -18 * dir, 1.4, [0.55, 0, 0.75, 0.2]);
      // a lighter cancelled by a language/theme swap must not report back:
      // its "done" would tell the new title's lighter not to play
      if (!alive) return;
      cancelAnimationFrame(raf);
      onFlame(0, 0, false);
      onDone();
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      onFlame(0, 0, false);
    };
    // the sequence runs once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play, target]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-[12]"
      style={{ x: px, y: py, rotate: rot, opacity: op, width, height: H, originX: 0.5, originY: 1 }}
    >
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width={width} height={H} style={{ transform: rtl ? "scaleX(-1)" : undefined, overflow: "visible" }}>
        <defs>
          <linearGradient id="lt-steel" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#4f4a45" />
            <stop offset="0.16" stopColor="#a9a399" />
            <stop offset="0.36" stopColor="#ece6dc" />
            <stop offset="0.52" stopColor="#9d978e" />
            <stop offset="0.78" stopColor="#cfc9be" />
            <stop offset="1" stopColor="#4c4742" />
          </linearGradient>
          <linearGradient id="lt-inner" x1="0" x2="1">
            <stop offset="0" stopColor="#3a3632" />
            <stop offset="0.45" stopColor="#8e877e" />
            <stop offset="1" stopColor="#35312d" />
          </linearGradient>
          <linearGradient id="lt-sheen" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="0.4" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* chimney with its vent holes, and the wick */}
        <rect x="9" y="13" width="42" height="35" rx="2" fill="url(#lt-inner)" />
        {[16, 24, 32, 40].map((hx) =>
          [22, 30, 38].map((hy) => <circle key={`${hx}-${hy}`} cx={hx + 2} cy={hy} r="1.6" fill="rgba(0,0,0,0.6)" />)
        )}
        <rect x={WICK.x - 1.6} y={WICK.y - 1} width="3.2" height="7" rx="1.2" fill="#2a2522" />

        {/* the striker wheel */}
        {/* (SVG transform origins are fractions of the part's own box) */}
        <motion.g style={{ rotate: wheel, originX: 0.5, originY: 0.5 }}>
          <circle cx="50" cy="19" r="6.4" fill="#7a746c" stroke="#35312d" strokeWidth="2.2" strokeDasharray="1.4 1.1" />
          <circle cx="50" cy="19" r="2" fill="#2e2a27" />
        </motion.g>

        {/* a few small sparks off the wheel */}
        {SPARKS.map(([dx, dy], i) => (
          <Spark key={i} p={spark} dx={dx} dy={dy} />
        ))}

        {/* the case */}
        <rect x="4" y="46" width="62" height="72" rx="8" fill="url(#lt-steel)" stroke="rgba(0,0,0,0.55)" strokeWidth="0.8" />
        <rect x="4" y="46" width="62" height="72" rx="8" fill="url(#lt-sheen)" />
        <rect x="4" y="105" width="62" height="2.6" fill="#FF4D1F" opacity="0.85" />
        {/* the studio mark, engraved */}
        <circle cx="35" cy="77" r="11" fill="none" stroke="rgba(0,0,0,0.32)" strokeWidth="1.1" />
        <text x="35" y="82.5" textAnchor="middle" style={{ font: "italic 16px var(--font-serif), serif" }} fill="rgba(0,0,0,0.38)">
          a
        </text>
        <rect x="60" y="41" width="6" height="9" rx="2" fill="#8a847c" />

        {/* the lid, hinged on the right */}
        <motion.g style={{ rotate: lid, originX: (63 - 4) / 62, originY: (46 - 8) / 40 }}>
          <rect x="4" y="8" width="62" height="40" rx="7" fill="url(#lt-steel)" stroke="rgba(0,0,0,0.55)" strokeWidth="0.8" />
          <rect x="4" y="8" width="62" height="40" rx="7" fill="url(#lt-sheen)" />
          <line x1="6" y1="46.5" x2="64" y2="46.5" stroke="rgba(0,0,0,0.45)" strokeWidth="1" />
        </motion.g>
      </svg>
    </motion.div>
  );
}
