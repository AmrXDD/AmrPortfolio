"use client";

import { Marquee } from "@/components/ui/marquee";

const ITEMS = [
  "Creative Development",
  "Cinematic Interfaces",
  "Brand Engineering",
  "Spatial Storytelling",
  "Motion Systems",
  "AI Surfaces",
  "Decision Intelligence",
  "Editorial Product Design",
];

export function IndexMarquee() {
  return (
    <section id="index" className="relative border-y border-line bg-ink py-8">
      <Marquee speed={55}>
        {ITEMS.map((s, i) => (
          <span
            key={i}
            className="flex items-center gap-12 py-2 text-display text-[7vw] italic leading-[1.18] text-bone"
          >
            <span className="text-bone">{s}</span>
            <span className="inline-block h-3 w-3 rounded-full bg-accent" />
          </span>
        ))}
      </Marquee>
    </section>
  );
}
