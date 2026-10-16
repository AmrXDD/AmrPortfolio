"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useLang } from "@/lib/i18n";

export type SideNavItem = { id: string; label: string; icon: ReactNode };

const SLOT = 46; // px per item on the rail
const ICON = 40; // button size
const RING_R = 17;
const RING_C = 2 * Math.PI * RING_R;

/**
 * SideNav — the desktop navigation, standing on the page's trailing edge.
 *
 * A glass rail with a rolling section counter on top, the sections as icons,
 * and a molten ember indicator behind the active one. When the section
 * changes the indicator's leading edge races ahead while its trailing edge
 * follows on a softer spring, so it stretches like liquid between stops and
 * snaps back into a drop. Icons magnify toward the pointer, labels slide out
 * on hover (and peek on their own when you scroll into a new section), and
 * the bottom ring is scroll progress + back to top.
 */
export function SideNav({
  items,
  onNavigate,
  ariaLabel,
  topLabel,
}: {
  items: SideNavItem[];
  onNavigate: (id: string) => void;
  ariaLabel: string;
  topLabel: string;
}) {
  const [active, setActive] = useState(0);
  const [peek, setPeek] = useState<number | null>(null);
  const progress = useMotionValue(0);
  const mouseY = useMotionValue(Infinity);
  const firstRun = useRef(true);

  // Which section owns the reading line (45% down the viewport), plus overall progress.
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const line = window.innerHeight * 0.45;
      // the section whose top is the lowest one still above the line wins,
      // whatever order the items are listed in
      let idx = 0;
      let best = -Infinity;
      items.forEach((it, i) => {
        const top = document.getElementById(it.id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= line && top > best) {
          best = top;
          idx = i;
        }
      });
      setActive(idx);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.set(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [items, progress]);

  // The liquid indicator: two edges on different springs.
  const top = useMotionValue(0);
  const bottom = useMotionValue(SLOT);
  const prev = useRef(0);
  useEffect(() => {
    const t = active * SLOT + (SLOT - ICON) / 2;
    const b = t + ICON;
    const down = active >= prev.current;
    prev.current = active;
    const lead = { type: "spring" as const, stiffness: 520, damping: 34 };
    const trail = { type: "spring" as const, stiffness: 120, damping: 17, delay: 0.05 };
    const a1 = animate(down ? bottom : top, down ? b : t, lead);
    const a2 = animate(down ? top : bottom, down ? t : b, trail);

    // Announce the new section briefly (not on first paint).
    let id = 0;
    if (firstRun.current) firstRun.current = false;
    else {
      setPeek(active);
      id = window.setTimeout(() => setPeek(null), 1500);
    }
    return () => {
      a1.stop();
      a2.stop();
      clearTimeout(id);
    };
  }, [active, top, bottom]);
  const height = useTransform([top, bottom], ([t, b]: number[]) => Math.max(ICON * 0.6, b - t));
  // the drop thins as it stretches, like a real liquid
  const squeeze = useTransform(height, [ICON, ICON + SLOT * 2], [1, 0.72]);

  const ring = useTransform(progress, (p) => RING_C * (1 - p));
  const fill = useSpring(progress, { stiffness: 120, damping: 24 });

  const count = String(active + 1).padStart(2, "0");
  const total = String(items.length).padStart(2, "0");

  return (
    <nav
      aria-label={ariaLabel}
      className="pointer-events-none fixed end-4 top-1/2 z-50 hidden -translate-y-1/2 md:block lg:end-6"
    >
      <div
        className="pointer-events-auto relative flex flex-col items-center gap-3 rounded-full border border-bone/15 bg-ink/45 px-2 pb-2 pt-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
        onMouseMove={(e) => mouseY.set(e.clientY)}
        onMouseLeave={() => mouseY.set(Infinity)}
      >
        {/* scroll progress hairline along the inner edge */}
        <span className="pointer-events-none absolute bottom-10 start-0 top-10 w-px overflow-hidden bg-bone/10" aria-hidden>
          <motion.span style={{ scaleY: fill }} className="block h-full w-full origin-top bg-gradient-to-b from-accent via-[#ffb066] to-plasma" />
        </span>

        {/* rolling counter */}
        <div dir="ltr" className="flex flex-col items-center leading-none" aria-hidden>
          <span className="relative h-[18px] w-[22px] overflow-hidden text-mono text-[15px] text-bone">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={count}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.19, 1, 0.22, 1] }}
                className="absolute inset-0 text-center"
              >
                {count}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="mt-1 text-mono text-[9px] tracking-[0.2em] text-bone/35">/{total}</span>
        </div>

        <span className="h-px w-5 bg-bone/15" aria-hidden />

        {/* the rail */}
        <ul className="relative" style={{ height: items.length * SLOT, width: ICON }}>
          <motion.span
            aria-hidden
            style={{ top, height, scaleX: squeeze }}
            className="pointer-events-none absolute inset-x-0 rounded-full bg-[radial-gradient(120%_80%_at_50%_20%,#ffb066_0%,#ff4d1f_45%,#c2290f_100%)] shadow-[0_0_28px_rgba(255,77,31,0.55),inset_0_1px_1px_rgba(255,255,255,0.45)]"
          />
          {items.map((it, i) => (
            <RailItem
              key={it.id}
              item={it}
              index={i}
              active={i === active}
              peek={peek === i}
              mouseY={mouseY}
              onClick={() => onNavigate(it.id)}
            />
          ))}
        </ul>

        {/* progress ring + back to top */}
        <button
          type="button"
          onClick={() => onNavigate(items[0]?.id ?? "top")}
          data-cursor="link"
          aria-label={topLabel}
          className="group relative mt-1 flex h-10 w-10 items-center justify-center rounded-full text-bone/70 transition-colors hover:text-bone"
        >
          <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="20" cy="20" r={RING_R} fill="none" stroke="rgb(var(--bone-rgb) / 0.12)" strokeWidth="1.5" />
            <motion.circle
              cx="20"
              cy="20"
              r={RING_R}
              fill="none"
              stroke="#ff4d1f"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              style={{ strokeDashoffset: ring }}
            />
          </svg>
          <ArrowUp size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </nav>
  );
}

function RailItem({
  item,
  index,
  active,
  peek,
  mouseY,
  onClick,
}: {
  item: SideNavItem;
  index: number;
  active: boolean;
  peek: boolean;
  mouseY: MotionValue<number>;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [hover, setHover] = useState(false);

  // Vertical dock magnification: icons swell as the pointer nears them.
  const dist = useTransform(mouseY, (y) => {
    const r = ref.current?.getBoundingClientRect();
    return r ? y - (r.top + r.height / 2) : Infinity;
  });
  const target = useTransform(dist, [-110, 0, 110], [1, 1.32, 1]);
  const scale = useSpring(target, { stiffness: 260, damping: 18, mass: 0.2 });
  const showLabel = hover || peek;
  // labels slide in from the rail's side: +x in LTR (rail on the right), −x in RTL
  const inX = useLang().dir === "rtl" ? -10 : 10;

  return (
    <li className="absolute inset-x-0 flex justify-center" style={{ top: index * SLOT, height: SLOT }}>
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        aria-label={item.label}
        aria-current={active ? "true" : undefined}
        data-cursor="link"
        className="relative my-auto flex items-center justify-center rounded-full outline-none focus-visible:ring-1 focus-visible:ring-bone/60"
        style={{ width: ICON, height: ICON }}
      >
        <motion.span
          style={{ scale }}
          className={`relative z-10 flex items-center justify-center transition-colors duration-300 ${
            active ? "text-[#0a0a0a]" : hover ? "text-bone" : "text-bone/60"
          }`}
        >
          {item.icon}
        </motion.span>

        {/* the label slides out toward the page, joined to the rail by a hairline */}
        <AnimatePresence>
          {showLabel ? (
            <motion.span
              initial={{ opacity: 0, x: inX, filter: "blur(6px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: inX, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
              className="pointer-events-none absolute inset-y-0 end-full me-3 flex items-center whitespace-nowrap"
              role="tooltip"
            >
              <span className="flex items-center gap-2.5 rounded-full border border-bone/15 bg-ink/85 px-3.5 py-1.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                <span dir="ltr" className="text-mono text-[10px] text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-mono text-[11px] uppercase tracking-[0.18em] text-bone">{item.label}</span>
              </span>
              <span className="h-px w-3 bg-gradient-to-r from-bone/40 to-accent rtl:bg-gradient-to-l" />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </button>
    </li>
  );
}
