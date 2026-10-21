"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/cn";

export type SideNavItem = { id: string; label: string; icon: ReactNode };

/**
 * SideNav — the desktop navigation: an editorial index on the page's
 * trailing edge, like the contents column of a printed book. Each section is
 * a number and a hairline; the current one's line draws out and its name
 * sits beside it; other names slide out on hover. A thin line along the edge
 * fills with your progress down the page.
 *
 * Cheap by construction: the current section comes from an
 * IntersectionObserver (no measuring every section on every scroll frame),
 * everything that moves is a transform, and it is set in difference blend so
 * it stays legible over the dark page and the light sheets alike.
 */
export function SideNav({
  items,
  onNavigate,
  ariaLabel,
  topLabel,
}: {
  items: SideNavItem[];
  onNavigate: (id: string) => void;
  ariaLabel: string;
  topLabel: string;
}) {
  const [active, setActive] = useState(0);
  const fill = useRef<HTMLSpanElement>(null);

  // the section crossing a line 45% down the screen is the current one
  useEffect(() => {
    const els = items.map((it) => document.getElementById(it.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = items.findIndex((it) => it.id === e.target.id);
          if (i >= 0) setActive(i);
        }
      },
      { rootMargin: "-45% 0px -55% 0px" }
    );
    els.forEach((e) => io.observe(e));
    // a jump (a link, a fast fling) can skip the line entirely: once the
    // scroll settles, take one measured look (not every frame)
    let tm = 0;
    const settle = () => {
      clearTimeout(tm);
      tm = window.setTimeout(() => {
        const line = window.innerHeight * 0.45;
        let idx = -1;
        let best = -Infinity;
        els.forEach((el) => {
          const top = el.getBoundingClientRect().top;
          if (top <= line && top > best) {
            best = top;
            idx = items.findIndex((it) => it.id === el.id);
          }
        });
        if (idx >= 0) setActive(idx);
      }, 140);
    };
    window.addEventListener("scroll", settle, { passive: true });
    return () => {
      io.disconnect();
      clearTimeout(tm);
      window.removeEventListener("scroll", settle);
    };
  }, [items]);

  // progress: one transform written straight to the line (no re-render)
  useEffect(() => {
    let max = 1;
    let raf = 0;
    const measure = () => (max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight));
    const draw = () => {
      raf = 0;
      if (fill.current) fill.current.style.transform = `scaleY(${Math.min(1, Math.max(0, window.scrollY / max))})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    measure();
    draw();
    const ro = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    ro.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <nav aria-label={ariaLabel} className="pointer-events-none fixed end-5 top-1/2 z-50 hidden -translate-y-1/2 text-white mix-blend-difference md:block lg:end-8">
      <div className="relative flex items-stretch gap-4">
        <ol className="pointer-events-auto flex flex-col items-end gap-1">
          {items.map((it, i) => {
            const on = i === active;
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(it.id)}
                  aria-label={it.label}
                  aria-current={on ? "true" : undefined}
                  data-cursor="link"
                  className={cn("sn-item group flex h-7 items-center gap-3 outline-none", on && "on")}
                >
                  <span className="sn-label text-mono text-[10px] uppercase tracking-[0.22em]">{it.label}</span>
                  <span aria-hidden className="sn-tick block h-px w-7 bg-current" />
                  <span dir="ltr" className="sn-num w-5 text-end text-mono text-[10px] tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </button>
              </li>
            );
          })}
          <li className="mt-3">
            <button
              type="button"
              onClick={() => onNavigate(items[0]?.id ?? "top")}
              aria-label={topLabel}
              data-cursor="link"
              className="sn-item group flex h-7 items-center gap-3 outline-none"
            >
              <span className="sn-label text-mono text-[10px] uppercase tracking-[0.22em]">{topLabel}</span>
              <span className="flex w-5 justify-end opacity-60 transition-opacity duration-300 group-hover:opacity-100">
                <ArrowUp size={12} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
              </span>
            </button>
          </li>
        </ol>
        {/* progress down the page */}
        <span aria-hidden className="relative w-px bg-white/20">
          <span ref={fill} className="absolute inset-0 origin-top bg-white" style={{ transform: "scaleY(0)" }} />
        </span>
      </div>
    </nav>
  );
}
