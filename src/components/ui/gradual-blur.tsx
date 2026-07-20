"use client";

/*
 * GradualBlur — progressive edge blur (adapted from reactbits.dev, by
 * ansh-dhanani). Stacks N backdrop-blur layers, each masked to a slice, so the
 * blur ramps up smoothly toward an edge instead of a hard cut.
 */

import { useMemo, type CSSProperties } from "react";

type Position = "top" | "bottom" | "left" | "right";

type GradualBlurProps = {
  target?: "parent" | "page";
  position?: Position;
  height?: string;
  width?: string;
  strength?: number;
  divCount?: number;
  curve?: "linear" | "bezier" | "ease-in" | "ease-out";
  exponential?: boolean;
  opacity?: number;
  zIndex?: number;
  className?: string;
};

const CURVES: Record<string, (p: number) => number> = {
  linear: (p) => p,
  bezier: (p) => p * p * (3 - 2 * p),
  "ease-in": (p) => p * p,
  "ease-out": (p) => 1 - (1 - p) * (1 - p),
};

export function GradualBlur({
  target = "parent",
  position = "bottom",
  height = "6rem",
  width = "100%",
  strength = 2,
  divCount = 5,
  curve = "bezier",
  exponential = false,
  opacity = 1,
  zIndex = 20,
  className = "",
}: GradualBlurProps) {
  const isVertical = position === "top" || position === "bottom";
  const curveFn = CURVES[curve] || CURVES.bezier;

  const layers = useMemo(() => {
    const out: React.ReactNode[] = [];
    const n = Math.max(1, divCount);
    for (let i = 1; i <= n; i++) {
      const p = i / n;
      const progress = curveFn(p);
      const blurPx = exponential
        ? Math.pow(2, progress * 4) * 0.0625 * strength
        : progress * strength * 2;

      // each layer is masked to reveal only its slice toward the edge
      const start = ((i - 1) / n) * 100;
      const mid = (i / n) * 100;
      const dir =
        position === "bottom"
          ? "to top"
          : position === "top"
            ? "to bottom"
            : position === "right"
              ? "to left"
              : "to right";
      const mask = `linear-gradient(${dir}, rgba(0,0,0,1) ${start}%, rgba(0,0,0,1) ${mid}%, rgba(0,0,0,0) ${Math.min(100, mid + 100 / n)}%)`;

      out.push(
        <div
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backdropFilter: `blur(${blurPx.toFixed(3)}px)`,
            WebkitBackdropFilter: `blur(${blurPx.toFixed(3)}px)`,
            maskImage: mask,
            WebkitMaskImage: mask,
            opacity,
          }}
        />
      );
    }
    return out;
  }, [divCount, curve, curveFn, exponential, strength, position, opacity]);

  const style: CSSProperties = {
    position: target === "page" ? "fixed" : "absolute",
    pointerEvents: "none",
    zIndex,
    ...(isVertical
      ? { left: 0, right: 0, height, width: "100%", [position]: 0 }
      : { top: 0, bottom: 0, width, height: "100%", [position]: 0 }),
  };

  return (
    <div className={className} style={style}>
      {layers}
    </div>
  );
}

export default GradualBlur;
