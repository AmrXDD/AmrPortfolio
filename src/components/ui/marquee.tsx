"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Marquee({
  children,
  reverse = false,
  className,
  speed = 40,
}: {
  children: ReactNode;
  reverse?: boolean;
  className?: string;
  speed?: number;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="flex w-max"
        style={{
          animation: `${reverse ? "marquee-rev" : "marquee"} ${speed}s linear infinite`,
        }}
      >
        <div className="marquee-track">{children}</div>
        <div className="marquee-track" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
