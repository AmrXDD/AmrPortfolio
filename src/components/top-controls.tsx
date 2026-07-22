"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/logo";
import { Magnetic } from "@/components/ui/magnetic";
import { useTheme } from "@/components/providers/theme-provider";
import { useLang } from "@/lib/i18n";
import { SITE, waLink } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { Sun, Moon } from "lucide-react";

/*
 * Top chrome that replaces the navbar: a centered brand mark, a polished
 * theme + Arabic control cluster on the leading edge, and the Hire button
 * (restored) on the trailing edge.
 */
export function TopControls() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { lang, toggle: toggleLang, t } = useLang();

  // The brand mark stays hidden until the loader logo has finished gliding into
  // place, so the handoff is seamless (no double logo during the transition).
  const [brandReady, setBrandReady] = useState(false);
  useEffect(() => {
    // No preloader running (e.g. client-side nav)? Show the brand immediately.
    if (!document.documentElement.classList.contains("preloading")) {
      setBrandReady(true);
      return;
    }
    const reveal = () => setBrandReady(true);
    // Fallback aligned to the glide, in case the complete event never fires.
    const onEnter = () => window.setTimeout(reveal, 1300);
    window.addEventListener("brand:reveal", reveal);
    window.addEventListener("ambient:start", onEnter);
    return () => {
      window.removeEventListener("brand:reveal", reveal);
      window.removeEventListener("ambient:start", onEnter);
    };
  }, []);

  // While the header sits over the white Process sheet, flip its token scope to
  // "light" so the (otherwise white) wordmark and controls stay legible.
  const [onLight, setOnLight] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const proc = document.getElementById("process");
      if (!proc) return setOnLight(false);
      const r = proc.getBoundingClientRect();
      const nextTop =
        (proc.nextElementSibling as HTMLElement | null)?.getBoundingClientRect().top ?? Infinity;
      setOnLight(r.top < 76 && r.bottom > 76 && nextTop > 76);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header className={cn("pointer-events-none fixed inset-x-0 top-0 z-50 px-4 py-4 md:px-8 md:py-5", onLight && "light")}>
      <div className="relative mx-auto flex max-w-[1800px] items-center justify-between">
        {/* Leading: theme + language cluster */}
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-bone/15 bg-ink/50 p-1 backdrop-blur-xl">
          <button
            type="button"
            onClick={toggleTheme}
            data-cursor="link"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="flex h-9 w-9 items-center justify-center rounded-full text-bone/70 transition-colors hover:bg-bone/10 hover:text-bone"
          >
            {theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <span className="h-4 w-px bg-bone/15" />
          <button
            type="button"
            onClick={toggleLang}
            data-cursor="link"
            aria-label={lang === "en" ? "Switch to Arabic" : "Switch to English"}
            className="flex h-9 items-center gap-1.5 rounded-full px-3 text-mono text-[11px] uppercase tracking-[0.16em] text-bone/70 transition-colors hover:bg-bone/10 hover:text-bone"
          >
            <span className={lang === "en" ? "text-bone" : "text-bone/40"}>EN</span>
            <span className="text-bone/25">/</span>
            <span className={lang === "ar" ? "text-bone" : "text-bone/40"} style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>ع</span>
          </button>
        </div>

        {/* Center: brand mark — hidden until the loader logo lands on it */}
        <a
          href="#top"
          data-cursor="link"
          data-cursor-label="Top"
          aria-label="Back to top"
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5"
          style={{ opacity: brandReady ? 1 : 0, pointerEvents: brandReady ? "auto" : "none" }}
        >
          <Logo size={26} />
          <span className="text-mono text-[11px] uppercase tracking-[0.24em] text-bone">
            {SITE.name}/studio
          </span>
        </a>

        {/* Trailing: restored Hire button */}
        <Magnetic strength={0.2}>
          <a
            href={waLink("Hey Amr, saw your portfolio. Want to hire you.")}
            target="_blank"
            rel="noreferrer"
            data-cursor="link"
            data-cursor-label="WhatsApp"
            className="btn-solid pointer-events-auto !px-4 !py-2.5 !text-[10px]"
          >
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            {t("cta.hire")}
          </a>
        </Magnetic>
      </div>
    </header>
  );
}
