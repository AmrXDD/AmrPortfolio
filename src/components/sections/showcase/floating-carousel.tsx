"use client";

import Image from "next/image";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealWords } from "@/components/ui/reveal";

type Panel =
  | { type: "img"; src: string; label: string }
  | { type: "brand"; title: string; sub: string; from: string; to: string };

const PANELS: Panel[] = [
  { type: "img", src: "/projects/scenarios.png", label: "Scenarios" },
  { type: "brand", title: "frame-\nperfect", sub: "60fps, always", from: "#FF4D1F", to: "#7C3AED" },
  { type: "img", src: "/projects/quipmed.png", label: "Quipmed" },
  { type: "img", src: "/projects/smartee.png", label: "Smartee" },
  { type: "brand", title: "scripted\nto reality", sub: "every pixel", from: "#22D3EE", to: "#7C3AED" },
  { type: "img", src: "/projects/livfunctional.png", label: "LivFunctional" },
];

const COUNT = PANELS.length;
const ANGLE = 360 / COUNT;
const RADIUS = 460; // px on the 3D ring (desktop); scaled down via CSS var on mobile

export function FloatingCarousel() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-ink py-24 md:py-36">
      <div className="mx-auto mb-10 max-w-[1600px] px-5 md:mb-4 md:px-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Eyebrow index="A3">Floating Gallery</Eyebrow>
            <h2 className="mt-6 text-display size-h2 text-bone">
              <RevealWords text="Selected" />{" "}
              <span className="italic text-bone/80"><RevealWords text="frames," delay={0.1} /></span>
              <br />
              <RevealWords text="in orbit." delay={0.2} />
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-bone/55">
            A self-driving carousel. Hover to pause and steer your eye. Built with pure CSS 3D — no images of images.
          </p>
        </div>
      </div>

      {/* Stage */}
      <div
        className="carousel-stage relative mx-auto h-[420px] w-full md:h-[520px]"
        style={{ perspective: "1400px" }}
      >
        <div className="absolute left-1/2 top-1/2 h-0 w-0 animate-floaty" style={{ transformStyle: "preserve-3d" }}>
          <div
            className="animate-spinY"
            style={{ transformStyle: "preserve-3d", ["--r" as string]: `${RADIUS}px` }}
          >
            {PANELS.map((p, i) => (
              <div
                key={i}
                className="absolute backface-hidden"
                style={{
                  width: 300,
                  height: 200,
                  left: -150,
                  top: -100,
                  transform: `rotateY(${i * ANGLE}deg) translateZ(var(--r))`,
                }}
              >
                <CarouselPanel panel={p} />
              </div>
            ))}
          </div>
        </div>

        {/* floor reflection vignette */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[44vh] w-[44vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-plasma/10 blur-[120px]" />
      </div>

      <style>{`
        @media (max-width: 767px) {
          .carousel-stage .animate-spinY > div { width: 220px !important; height: 150px !important; left: -110px !important; top: -75px !important; }
          .carousel-stage .animate-spinY { --r: 300px !important; }
        }
      `}</style>
    </section>
  );
}

function CarouselPanel({ panel }: { panel: Panel }) {
  if (panel.type === "brand") {
    return (
      <div
        className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border border-line p-5"
        style={{ background: `linear-gradient(140deg, ${panel.from}, ${panel.to})` }}
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/70">{panel.sub}</span>
        <span className="whitespace-pre-line text-display text-[28px] italic leading-[0.9] text-white">
          {panel.title}
        </span>
      </div>
    );
  }
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-line bg-ash shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]">
      <Image src={panel.src} alt={panel.label} fill sizes="300px" className="object-cover object-left-top" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
      <span className="absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-[0.18em] text-bone/90">
        {panel.label}
      </span>
    </div>
  );
}
