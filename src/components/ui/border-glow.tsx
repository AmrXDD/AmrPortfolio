"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * BorderGlow — a glow that traces the card's border ring, following the cursor
 * and brightening as it nears an edge. Adapted to the site palette (accent →
 * ember → bone). Writes styles straight to the DOM (zero re-renders) so it
 * costs nothing while idle.
 */
export function BorderGlow({
  children,
  className,
  radius = 24,
  edgeSensitivity = 70,
  intensity = 1,
  colors = ["#FF4D1F", "#FFB38A", "#F5F5F5"],
}: {
  children: ReactNode;
  className?: string;
  radius?: number;
  edgeSensitivity?: number;
  intensity?: number;
  colors?: [string, string, string] | string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const bloom = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || !ring.current || !bloom.current) return;
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    // distance to the nearest edge → glow strength
    const d = Math.min(x, y, r.width - x, r.height - y);
    const o = Math.max(0, Math.min(1, 1 - d / edgeSensitivity)) * intensity;
    ring.current.style.background = `radial-gradient(150px circle at ${x}px ${y}px, ${colors[0]}, ${colors[1]} 45%, transparent 75%)`;
    ring.current.style.opacity = String(o);
    bloom.current.style.background = `radial-gradient(190px circle at ${x}px ${y}px, ${colors[2]}12, transparent 70%)`;
    bloom.current.style.opacity = String(o * 0.8);
  };
  const onLeave = () => {
    if (ring.current) ring.current.style.opacity = "0";
    if (bloom.current) bloom.current.style.opacity = "0";
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={cn("relative", className)}>
      {children}
      {/* the border ring (masked to a 1.5px frame) */}
      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: radius,
          padding: 1.5,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          opacity: 0,
          transition: "opacity 280ms ease",
        }}
      />
      {/* faint interior bloom */}
      <div
        ref={bloom}
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ borderRadius: radius, opacity: 0, transition: "opacity 280ms ease" }}
      />
    </div>
  );
}
