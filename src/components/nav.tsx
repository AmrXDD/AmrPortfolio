"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_LINKS, SITE, waLink } from "@/lib/constants";
import { Magnetic } from "@/components/ui/magnetic";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/cn";

function useClock() {
  const [time, setTime] = useState<string>("");
  useEffect(() => {
    const fmt = () =>
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Kuwait",
      }).format(new Date());
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [warping, setWarping] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const [onLight, setOnLight] = useState(false);
  const time = useClock();

  // scroll-spy: highlight the nav link for the section near the viewport centre
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1));
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive((e.target as HTMLElement).id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      // hide the nav during the hero-exit time-travel so no text overlays it
      const h = window.scrollY / window.innerHeight;
      setWarping(h > 0.2 && h < 0.92);
      // flip the nav to dark-on-light while the white Process sheet sits under
      // it (and back as soon as the dark Expertise panel rises to cover it)
      const proc = document.getElementById("process");
      if (proc) {
        const r = proc.getBoundingClientRect();
        const nextTop =
          (proc.nextElementSibling as HTMLElement | null)?.getBoundingClientRect().top ?? Infinity;
        setOnLight(r.top < 76 && r.bottom > 76 && nextTop > 76);
      } else {
        setOnLight(false);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        style={{ opacity: warping && !open ? 0 : 1 }}
        className={cn(
          "fixed left-0 right-0 top-0 z-50 transition-[opacity,padding] duration-500",
          warping && !open ? "pointer-events-none" : "",
          scrolled ? "py-3" : "py-5",
          // token-scope flip: over the white sheet every bone/ink color in the
          // nav (wordmark, links, clock, Hire pill) inverts for contrast
          onLight && !open && "light"
        )}
      >
        <div
          className={cn(
            "mx-auto flex items-center justify-between px-5 transition-[max-width,padding] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:px-10",
            scrolled ? "max-w-[1400px]" : "max-w-[1900px]"
          )}
        >
          <a
            href="#top"
            data-cursor="link"
            data-cursor-label="Top"
            className="group flex items-center gap-3"
            aria-label="Back to top"
          >
            <Logo size={28} />
            <span className="text-mono text-[11px] uppercase tracking-[0.22em] text-bone">
              {SITE.name}/studio
            </span>
          </a>

          <nav className="hidden items-center gap-1 rounded-full border border-line bg-ink/40 px-2 py-2 backdrop-blur-xl md:flex">
            {NAV_LINKS.map((l) => {
              const isActive = active === l.href.slice(1);
              return (
                <a
                  key={l.href}
                  href={l.href}
                  data-cursor="link"
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors",
                    isActive ? "bg-bone text-ink" : "text-bone/70 hover:bg-bone/10 hover:text-bone"
                  )}
                >
                  {l.label}
                </a>
              );
            })}
          </nav>

          <div className="hidden items-center gap-5 md:flex">
            <ThemeToggle />
            <div className="flex flex-col items-end">
              <span className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40">
                Salmiya · Available
              </span>
              <span className="text-mono text-[11px] tabular-nums text-bone">{time}</span>
            </div>
            <Magnetic strength={0.2}>
              <a
                href={waLink("Hey Amr — saw your portfolio. Want to hire you.")}
                target="_blank"
                rel="noreferrer"
                data-cursor="link"
                data-cursor-label="WhatsApp"
                className="btn-solid !py-2.5 !px-4 text-[10px]"
              >
                <span className="relative flex h-2 w-2 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Hire
              </a>
            </Magnetic>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            data-cursor="link"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line md:hidden"
            aria-label="Open menu"
          >
            <div className="flex flex-col gap-1.5">
              <span className={cn("h-px w-5 bg-bone transition-transform", open && "translate-y-[3px] rotate-45")} />
              <span className={cn("h-px w-5 bg-bone transition-transform", open && "-translate-y-[3px] -rotate-45")} />
            </div>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-40 flex flex-col bg-ink/95 px-5 pb-10 pt-24 backdrop-blur-2xl md:hidden"
          >
            <nav className="flex flex-1 flex-col gap-2">
              {NAV_LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                  className="border-b border-line py-6 text-display text-[14vw] leading-none text-bone"
                >
                  {l.label}
                </motion.a>
              ))}
            </nav>
            <div className="mt-auto flex items-center justify-between pt-8 text-mono text-[10px] uppercase tracking-[0.22em] text-bone/50">
              <span>{SITE.city}</span>
              <ThemeToggle />
              <span>{time}</span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
