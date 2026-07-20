"use client";

import { useEffect, useRef } from "react";

/* Real project frames — local screenshots, no hotlinking */
const SHOTS = [
  "/projects/scenarios.png",
  "/projects/quipmed.png",
  "/projects/livfunctional.png",
  "/projects/smartee.png",
  "/projects/scenarios-mac.png",
];

/* Two staggered orders so the rows never mirror each other */
const ROW1 = [...SHOTS, ...SHOTS, ...SHOTS];
const ROW2 = [...SHOTS.slice(2), ...SHOTS.slice(0, 2), ...SHOTS, ...SHOTS];

function Tile({ src }: { src: string }) {
  return (
    <div className="relative h-[150px] w-[240px] shrink-0 overflow-hidden rounded-2xl border border-line sm:h-[200px] sm:w-[320px] md:h-[270px] md:w-[420px]">
      {/* plain <img> — the strip translates every frame; keep it cheap */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover object-top" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent" />
    </div>
  );
}

/**
 * Scroll-driven film-strip: two rows of real project frames that slide in
 * opposite directions as the page scrolls (no autoplay — the page's own motion
 * drives it). Transforms are written directly to the DOM (no re-renders).
 */
export function WorkMarquee() {
  const section = useRef<HTMLElement>(null);
  const r1 = useRef<HTMLDivElement>(null);
  const r2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let top = 0;
    let active = true;
    let raf = 0;

    const measure = () => {
      top = el.getBoundingClientRect().top + window.scrollY;
    };

    const apply = () => {
      raf = 0;
      if (!active) return;
      const offset = (window.scrollY - top + window.innerHeight) * 0.3;
      if (r1.current) r1.current.style.transform = `translate3d(${offset - 520}px,0,0)`;
      if (r2.current) r2.current.style.transform = `translate3d(${-(offset - 520) - 900}px,0,0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const io = new IntersectionObserver(([e]) => {
      active = e.isIntersecting;
      if (active) onScroll();
    });
    io.observe(el);

    measure();
    apply();
    const settle = setTimeout(() => {
      measure();
      apply();
    }, 800);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      io.disconnect();
      clearTimeout(settle);
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <section ref={section} aria-hidden className="relative overflow-x-clip border-b border-line py-10 md:py-14">
      <div className="flex flex-col gap-3">
        <div ref={r1} className="flex w-max gap-3 will-change-transform">
          {ROW1.map((s, i) => (
            <Tile key={`a${i}`} src={s} />
          ))}
        </div>
        <div ref={r2} className="flex w-max gap-3 will-change-transform">
          {ROW2.map((s, i) => (
            <Tile key={`b${i}`} src={s} />
          ))}
        </div>
      </div>
    </section>
  );
}
