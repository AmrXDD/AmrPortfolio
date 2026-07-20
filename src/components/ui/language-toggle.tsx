"use client";

import { useLang } from "@/lib/i18n";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, toggle } = useLang();
  return (
    <button
      type="button"
      onClick={toggle}
      data-cursor="link"
      aria-label={lang === "en" ? "Switch to Arabic" : "Switch to English"}
      className={`text-mono text-[11px] uppercase tracking-[0.22em] text-bone/70 transition-colors hover:text-bone ${className}`}
    >
      [ {lang === "en" ? "AR · عربي" : "EN"} ]
    </button>
  );
}
