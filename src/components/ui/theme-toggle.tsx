"use client";

import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      data-cursor="link"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={`text-mono text-[11px] uppercase tracking-[0.22em] text-bone/70 transition-colors hover:text-bone ${className}`}
    >
      [ {theme === "dark" ? "DARK" : "LIGHT"} ]
    </button>
  );
}
