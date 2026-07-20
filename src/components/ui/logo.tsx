"use client";

import { cn } from "@/lib/cn";

type LogoProps = {
  size?: number;
  /** Disable the spinning halo (e.g. for print / static contexts) */
  static?: boolean;
  /** Hide the wordmark letter inside */
  markOnly?: boolean;
  /** Letter shown inside the ring (default "a") */
  letter?: string;
  className?: string;
};

/**
 * Amr Studio logo — animated by default.
 * Pure CSS, no image dependency. Render anywhere.
 */
export function Logo({
  size = 28,
  static: isStatic = false,
  markOnly = false,
  letter = "a",
  className,
}: LogoProps) {
  const ringWidth = Math.max(2, Math.round(size * 0.11));
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full border border-line",
        className
      )}
      style={{ width: size, height: size }}
      aria-label="Amr Studio"
      role="img"
    >
      <div
        className={cn(
          "absolute inset-0",
          !isStatic && "animate-spin-slow"
        )}
        style={{
          background:
            "conic-gradient(from 0deg, #FF4D1F, #7C3AED, #22D3EE, #FF4D1F)",
        }}
      />
      <div
        className="absolute rounded-full bg-ink"
        style={{ inset: ringWidth }}
      />
      {!markOnly ? (
        <div
          className="absolute inset-0 flex items-center justify-center italic text-bone"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: Math.round(size * 0.62),
            lineHeight: 1,
          }}
        >
          {letter}
        </div>
      ) : null}
    </div>
  );
}
