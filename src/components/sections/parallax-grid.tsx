"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";
import { PROJECTS } from "@/lib/constants";
import { Eyebrow } from "@/components/ui/eyebrow";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* Asymmetric layout recipe per card: column span + a vertical offset so the
   grid reads as staggered physical layers rather than a tidy table. */
const LAYOUT = [
  { span: "md:col-span-7", pad: "md:mt-0", ratio: "aspect-[16/11]" },
  { span: "md:col-span-5", pad: "md:mt-28", ratio: "aspect-[4/5]" },
  { span: "md:col-span-5", pad: "md:mt-0", ratio: "aspect-[4/5]" },
  { span: "md:col-span-7", pad: "md:mt-20", ratio: "aspect-[16/11]" },
];

/**
 * Asymmetric Parallax Project Grid.
 *
 * Image containers and their typographic descriptors are bound directly to the
 * scrollbar via GSAP ScrollTrigger (`scrub`), so they track the Lenis smooth-
 * scroll inertia. Odd-indexed images translate faster (further up); even images
 * and the text tags move slower / in the opposite direction — decoupled speeds
 * that create distinct physical depth layers. All motion is pure CSS transforms
 * with `will-change: transform` for hardware acceleration.
 */
export function ParallaxGrid() {
  const root = useRef<HTMLElement>(null);
  const lenis = useLenis();

  // Keep ScrollTrigger glued to Lenis' inertial scroll position, and recalc
  // trigger geometry once fonts/images have settled.
  useEffect(() => {
    if (!lenis) return;
    const sync = () => ScrollTrigger.update();
    lenis.on("scroll", sync);
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 800);
    return () => {
      lenis.off("scroll", sync);
      window.clearTimeout(t);
    };
  }, [lenis]);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // Images — odd indices move faster (−100), evens slower & opposite (+55).
      gsap.utils.toArray<HTMLElement>("[data-parallax-img]").forEach((el, i) => {
        const odd = i % 2 === 1;
        gsap.fromTo(
          el,
          { y: odd ? 70 : -28 },
          {
            y: odd ? -100 : 55,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          }
        );
      });

      // Typographic tags drift the opposite way and slower, for contrast.
      gsap.utils.toArray<HTMLElement>("[data-parallax-tag]").forEach((el) => {
        gsap.fromTo(
          el,
          { y: -18 },
          {
            y: 42,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });
    },
    { scope: root }
  );

  return (
    <section
      id="gallery"
      ref={root}
      className="relative overflow-hidden border-b border-line bg-ink px-5 py-24 md:px-10 md:py-40"
    >
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-14 flex flex-col gap-6 md:mb-24 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow index="02">In Motion</Eyebrow>
            <h2 className="mt-6 text-display size-h2 text-bone">
              Layers in <span className="italic text-accent">parallax.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-bone/55">
            Each frame drifts at its own velocity against the scroll — a quiet
            sense of depth, the way real objects sit at different distances.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-16 md:grid-cols-12 md:gap-y-0">
          {PROJECTS.map((p, i) => {
            const L = LAYOUT[i % LAYOUT.length];
            return (
              <a
                key={p.slug}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                data-cursor="view"
                data-cursor-label="Visit"
                className={`group block ${L.span} ${L.pad}`}
              >
                <div
                  data-parallax-img
                  className={`relative w-full overflow-hidden rounded-3xl border border-line will-change-transform ${L.ratio}`}
                  style={{ background: p.palette.bg }}
                >
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={`${p.client} — live site`}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover object-top transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-display text-[12vw] italic text-bone/15">
                        /{p.slug}
                      </span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
                </div>

                <div
                  data-parallax-tag
                  className="mt-6 flex items-baseline justify-between will-change-transform"
                >
                  <div>
                    <p className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/50">
                      {p.category}
                    </p>
                    <h3 className="mt-2 text-display text-[clamp(1.3rem,2vw,1.9rem)] text-bone">
                      {p.client}
                    </h3>
                  </div>
                  <span className="text-mono text-[11px] tabular-nums text-bone/40">
                    {p.year}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
