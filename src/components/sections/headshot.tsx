"use client";

import { useEffect, useRef, useState } from "react";
import { useCopy } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const SRC = "/images/amr-portrait.webp";
const SLICES = 10;

const COPY = {
  en: { cast: "Cast", take: "Take 01", role: "Director · design & code", where: "Cairo · Kuwait", alt: "Amr Ghamrawy, portrait" },
  ar: { cast: "طاقم العمل", take: "اللقطة 01", role: "المخرج · تصميم وبرمجة", where: "القاهرة · الكويت", alt: "صورة عمرو غمراوي" },
};

/*
 * The director's headshot, for the About set. The cut-out assembles from
 * horizontal slices sliding in from alternate sides as it arrives, an ember
 * scan line runs down it and a light glints across; behind it, an ember glow
 * and the logo's ring orbiting. With a mouse it tilts toward the pointer and
 * the slices ripple apart a little. Transform and opacity only (compositor),
 * and the ring only turns while it's on screen.
 */
export function Headshot({ className }: { className?: string }) {
  const c = useCopy(COPY);
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (e.isIntersecting && e.intersectionRatio > 0.25) setArrived(true);
      },
      { threshold: [0, 0.3] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    const s = e.currentTarget.style;
    s.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
    s.setProperty("--rx", `${(-y * 9).toFixed(2)}deg`);
    s.setProperty("--sx", (x * 18).toFixed(1));
  };
  const onLeave = (e: React.PointerEvent<HTMLElement>) => {
    const s = e.currentTarget.style;
    s.setProperty("--ry", "0deg");
    s.setProperty("--rx", "0deg");
    s.setProperty("--sx", "0");
  };

  return (
    <figure
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn("hs relative mx-auto w-full max-w-[300px] md:max-w-[340px]", arrived && "in", inView && "vis", className)}
    >
      <div className="hs-tilt relative aspect-[3/4]">
        {/* the ember behind, and the logo's ring orbiting it */}
        <div aria-hidden className="hs-sun absolute left-1/2 top-[34%] aspect-square w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
        <div aria-hidden className="absolute left-1/2 top-[33%] aspect-square w-[78%] -translate-x-1/2 -translate-y-1/2">
          <div className="hs-ring h-full w-full rounded-full" />
        </div>

        {/* the cut-out, in slices */}
        <div role="img" aria-label={c.alt} className="absolute inset-0">
          {Array.from({ length: SLICES }, (_, i) => (
            <div
              key={i}
              aria-hidden
              className="hs-slice absolute inset-x-0"
              style={{
                top: `${(i * 100) / SLICES}%`,
                height: `${100 / SLICES + 0.35}%`,
                backgroundImage: `url(${SRC})`,
                backgroundSize: `100% ${SLICES * 100}%`,
                backgroundPosition: `0 ${(i / (SLICES - 1)) * 100}%`,
                ["--i" as string]: i,
                ["--side" as string]: i % 2 ? 1 : -1,
              }}
            />
          ))}
        </div>

        {/* a light across the glasses, cut to the silhouette */}
        <div aria-hidden className="hs-glint absolute inset-0" style={{ WebkitMaskImage: `url(${SRC})`, maskImage: `url(${SRC})` }} />
        {/* the ember scan as it assembles */}
        <div aria-hidden className="hs-scan pointer-events-none absolute inset-0">
          <span className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent,#ff8a3c_30%,#ffe2c8_50%,#ff8a3c_70%,transparent)] shadow-[0_0_18px_4px_rgba(255,110,40,0.55)]" />
        </div>
        {/* the jacket fades into the page */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t from-ink to-transparent" />
      </div>

      {/* the slate */}
      <figcaption className="relative mt-4 border-t border-line pt-4">
        <div className="flex items-center justify-between text-mono text-[10px] uppercase tracking-[0.24em] text-bone/45">
          <span>{c.cast}</span>
          <span>{c.take}</span>
        </div>
        <p dir="ltr" className="mt-3 text-display text-[clamp(1.6rem,3vw,2.2rem)] leading-none text-bone rtl:text-end">
          Amr <span className="italic text-accent">Ghamrawy</span>
        </p>
        <p className="mt-3 flex items-center justify-between gap-3 text-mono text-[10px] uppercase tracking-[0.2em] text-bone/55">
          <span>{c.role}</span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(255,77,31,0.9)]" />
            {c.where}
          </span>
        </p>
      </figcaption>
    </figure>
  );
}
