"use client";

/*
 * LineSidebar — a vertical tick-mark navigator (adapted from reactbits). Items
 * shift horizontally toward the cursor (proximity magnet) and the active item's
 * tick extends in the accent colour. Used to jump between the recent-work cards.
 */

import { useCallback, useEffect, useRef, useState } from "react";

type Falloff = "linear" | "smooth" | "exponential";

type LineSidebarProps = {
  items: string[];
  accentColor?: string;
  textColor?: string;
  markerColor?: string;
  showIndex?: boolean;
  showMarker?: boolean;
  proximityRadius?: number;
  maxShift?: number;
  falloff?: Falloff;
  markerLength?: number;
  markerGap?: number;
  tickScale?: number;
  scaleTick?: boolean;
  itemGap?: number;
  fontSize?: number; // rem
  smoothing?: number; // ms
  defaultActive?: number;
  activeIndex?: number;
  onItemClick?: (index: number, label: string) => void;
  className?: string;
};

const falloffFn = (kind: Falloff, t: number) => {
  const x = Math.max(0, Math.min(1, t));
  if (kind === "linear") return x;
  if (kind === "exponential") return x * x;
  return x * x * (3 - 2 * x); // smooth
};

export function LineSidebar({
  items,
  accentColor = "#A855F7",
  textColor = "#c4c4c4",
  markerColor = "#6c6c6c",
  showIndex = true,
  showMarker = true,
  proximityRadius = 100,
  maxShift = 30,
  falloff = "smooth",
  markerLength = 60,
  markerGap = 12,
  tickScale = 0.5,
  scaleTick = true,
  itemGap = 20,
  fontSize = 1.1,
  smoothing = 100,
  defaultActive = 0,
  activeIndex,
  onItemClick,
  className = "",
}: LineSidebarProps) {
  const [internalActive, setInternalActive] = useState(defaultActive);
  const active = activeIndex ?? internalActive;
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [shifts, setShifts] = useState<number[]>(() => items.map(() => 0));
  const [scales, setScales] = useState<number[]>(() => items.map(() => tickScale));

  useEffect(() => {
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const ns: number[] = [];
        const ss: number[] = [];
        rowRefs.current.forEach((el) => {
          if (!el) {
            ns.push(0);
            ss.push(tickScale);
            return;
          }
          const r = el.getBoundingClientRect();
          const cy = r.top + r.height / 2;
          const t = 1 - Math.abs(e.clientY - cy) / proximityRadius;
          const f = falloffFn(falloff, t);
          ns.push(maxShift * f);
          ss.push(scaleTick ? tickScale + (1 - tickScale) * f : tickScale);
        });
        setShifts(ns);
        setScales(ss);
      });
    };
    const reset = () => {
      setShifts(items.map(() => 0));
      setScales(items.map(() => tickScale));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", reset);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", reset);
    };
  }, [items, proximityRadius, maxShift, falloff, tickScale, scaleTick]);

  const click = useCallback(
    (i: number) => {
      setInternalActive(i);
      onItemClick?.(i, items[i]);
    },
    [items, onItemClick]
  );

  return (
    <nav
      className={className}
      style={{ display: "flex", flexDirection: "column", gap: `${itemGap}px` }}
      aria-label="Recent work navigation"
    >
      {items.map((label, i) => {
        const isActive = active === i;
        return (
          <button
            key={label + i}
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            type="button"
            data-cursor="link"
            onClick={() => click(i)}
            aria-current={isActive ? "true" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: `${markerGap}px`,
              transform: `translateX(${shifts[i] ?? 0}px)`,
              transition: `transform ${smoothing}ms cubic-bezier(0.22,1,0.36,1), color 250ms ease`,
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {showMarker ? (
              <span
                aria-hidden
                style={{
                  display: "block",
                  height: 2,
                  borderRadius: 2,
                  width: `${markerLength * (scales[i] ?? tickScale)}px`,
                  background: isActive ? accentColor : markerColor,
                  transition: `width ${smoothing}ms ease, background 250ms ease`,
                  flexShrink: 0,
                }}
              />
            ) : null}
            {showIndex ? (
              <span
                className="text-mono"
                style={{ fontSize: "10px", letterSpacing: "0.16em", color: isActive ? accentColor : markerColor, minWidth: 18 }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            ) : null}
            <span
              style={{
                fontSize: `${fontSize}rem`,
                lineHeight: 1.1,
                whiteSpace: "nowrap",
                color: isActive ? accentColor : textColor,
                letterSpacing: "0.01em",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default LineSidebar;
