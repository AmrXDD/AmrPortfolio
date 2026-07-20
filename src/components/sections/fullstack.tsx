"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useIsMobile } from "@/lib/use-mobile";

type Layer = { name: string; tech: string; c: string; side: "left" | "right" };

// Cohesive with the site palette: a warm gradient from the accent orange
// through bone to graphite (no off-brand neon).
const LAYERS: Layer[] = [
  { name: "Frontend", tech: "React · Next.js · Tailwind", c: "#FF4D1F", side: "right" },
  { name: "Motion & 3D", tech: "Framer · R3F · GLSL", c: "#FF7A45", side: "left" },
  { name: "API / Edge", tech: "REST · tRPC · Server Actions", c: "#F2B07A", side: "right" },
  { name: "Backend", tech: "Node · RSC · Streaming", c: "#E8E6E0", side: "left" },
  { name: "Database", tech: "Postgres · Supabase · Prisma", c: "#B8B5AE", side: "right" },
  { name: "Infra / DevOps", tech: "Vercel · CI/CD · Docker", c: "#7E7B75", side: "left" },
];

const W = 340; // disc width (ellipse major axis)
const H = 92; // disc height (ellipse minor axis — the perspective squash)
const THICK = 30; // slice thickness (cylinder wall) — taller reads more 3D
const GAP = 74; // extra space between slices when exploded
const PITCH = THICK + GAP; // exploded pitch
const CENTER = (LAYERS.length - 1) / 2; // 2.5

function Slice({ index, layer, exploded }: { index: number; layer: Layer; exploded: boolean }) {
  const togetherY = (index - CENTER) * THICK;
  const explodedY = (index - CENTER) * PITCH;
  const right = layer.side === "right";
  const discT = { duration: 1, ease: [0.22, 1, 0.36, 1] as const, delay: 0.25 + index * 0.07 };
  const labelT = { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const, delay: 0.55 + index * 0.07 };

  return (
    <>
      {/* the disc / cylinder slice — auto-explodes on arrival */}
      <motion.div
        initial={{ y: togetherY }}
        animate={{ y: exploded ? explodedY : togetherY }}
        transition={discT}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 will-change-transform"
      >
        <div style={{ position: "relative", width: W, height: THICK }}>
          {/* machined cylinder wall — crisp central sheen, dark edges */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(90deg, rgba(0,0,0,0.8) 0%, ${layer.c} 24%, rgba(255,255,255,0.5) 50%, ${layer.c} 76%, rgba(0,0,0,0.8) 100%)`,
            }}
          />
          {/* bottom cap (underside, dark) */}
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: -H / 2,
              width: W,
              height: H,
              borderRadius: "50%",
              background: "radial-gradient(ellipse at 50% 62%, rgba(0,0,0,0.45), rgba(0,0,0,0.9))",
            }}
          />
          {/* top cap (lit metal face) — tight specular + defined rim, not a glow */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: -H / 2,
              width: W,
              height: H,
              borderRadius: "50%",
              background: `radial-gradient(ellipse 24% 38% at 38% 22%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0) 58%), radial-gradient(ellipse 99% 104% at 50% 46%, ${layer.c} 24%, rgba(0,0,0,0.55) 100%)`,
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.6), inset 0 0 0 1px rgba(255,255,255,0.14), 0 8px 22px -8px rgba(0,0,0,0.7)",
            }}
          />
        </div>
      </motion.div>

      {/* leader-line label */}
      <motion.div
        initial={{ y: togetherY, opacity: 0 }}
        animate={{ y: exploded ? explodedY : togetherY, opacity: exploded ? 1 : 0 }}
        transition={labelT}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="relative" style={{ width: W, height: 1 }}>
          {right ? (
            <div className="absolute left-full top-1/2 flex -translate-y-1/2 items-center gap-2 pl-1">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: layer.c }} />
              <span className="h-px w-12 shrink-0" style={{ background: "rgba(245,245,245,0.4)" }} />
              <div>
                <p className="text-mono text-[11px] uppercase tracking-[0.2em] text-bone">{layer.name}</p>
                <p className="mt-0.5 text-mono text-[9px] uppercase tracking-[0.14em] text-bone/45">{layer.tech}</p>
              </div>
            </div>
          ) : (
            <div className="absolute right-full top-1/2 flex -translate-y-1/2 flex-row-reverse items-center gap-2 pr-1">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: layer.c }} />
              <span className="h-px w-12 shrink-0" style={{ background: "rgba(245,245,245,0.4)" }} />
              <div className="text-right">
                <p className="text-mono text-[11px] uppercase tracking-[0.2em] text-bone">{layer.name}</p>
                <p className="mt-0.5 text-mono text-[9px] uppercase tracking-[0.14em] text-bone/45">{layer.tech}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

export function FullStack() {
  const ref = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  // Explode when centered in view; collapse again when you leave, so it
  // re-assembles and re-explodes each time you return to the section.
  const inView = useInView(stageRef, { amount: 0.5 });

  // Mobile / reduced-motion: a clean vertical stack (no exploding cylinder)
  if (reduce || isMobile) {
    return (
      <section id="stack" className="relative border-b border-line bg-ink px-5 py-24">
        <div className="mx-auto max-w-[560px]">
          <Eyebrow index="01">Full-Stack</Eyebrow>
          <h2 className="mt-5 text-display size-h2 text-bone">
            One developer, <span className="italic text-bone/70">the whole stack.</span>
          </h2>
          <div className="mt-10 space-y-3">
            {LAYERS.map((l) => (
              <div key={l.name} className="flex items-center gap-4 rounded-xl border border-line bg-ash/60 p-4">
                <span className="h-10 w-10 shrink-0 rounded-full" style={{ background: `radial-gradient(circle at 38% 30%, #fff8, ${l.c} 55%, #0007)` }} />
                <div>
                  <p className="text-mono text-[12px] uppercase tracking-[0.2em] text-bone">{l.name}</p>
                  <p className="mt-1 text-mono text-[10px] uppercase tracking-[0.16em] text-bone/45">{l.tech}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="stack" ref={ref} className="relative bg-ink" style={{ height: "150vh" }}>
      <div ref={stageRef} className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute left-5 top-24 z-10 md:left-10 md:top-28"
        >
          <Eyebrow index="01">Full-Stack</Eyebrow>
          <h2 className="mt-4 max-w-md text-display text-[clamp(1.75rem,4vw,3.25rem)] leading-[0.95] text-bone">
            One developer, <span className="italic text-bone/70">the whole stack.</span>
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-bone/55">
            Every layer, end to end — shipped by one pair of hands.
          </p>
        </motion.div>

        {/* the cylinder — splits itself apart on arrival */}
        <div className="relative" style={{ width: 720, height: 620 }}>
          {LAYERS.map((l, i) => (
            <Slice key={l.name} index={i} layer={l} exploded={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
