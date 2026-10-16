"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { currencyName, currencyOptions, currencySymbol } from "@/lib/locale";

// Shown first, before the alphabetical list.
const PINNED = ["USD", "EUR", "GBP", "EGP", "KWD", "SAR", "AED", "QAR"];

/**
 * Searchable currency switcher for the budget brackets. Starts on the
 * visitor's country currency (set server-side); a pick is remembered in a
 * cookie. Lists every currency the live rate feed covers.
 */
export function CurrencyPicker() {
  const { currency, setCurrency, rates, lang } = useLang();
  const ar = lang === "ar";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const all = useMemo(() => {
    const codes = currencyOptions(rates);
    const pinned = PINNED.filter((c) => codes.includes(c));
    const rest = codes.filter((c) => !pinned.includes(c));
    return [...pinned, ...rest].map((code) => ({
      code,
      name: currencyName(code, lang),
      // Search matches either language, so "pound" and "جنيه" both find EGP.
      haystack: `${code} ${currencyName(code, "en")} ${currencyName(code, "ar")}`.toLowerCase(),
      symbol: currencySymbol(code),
    }));
  }, [rates, lang]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? all.filter((c) => c.haystack.includes(q)) : all;
  }, [all, query]);

  // Close on outside click / Escape; focus the search box on open.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    setActive(Math.max(0, list.findIndex((c) => c.code === currency)));
    return () => {
      document.removeEventListener("pointerdown", onDown);
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => setActive(0), [query]);

  // Keep the highlighted option in view while arrowing through.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (code: string) => {
    setCurrency(code);
    setOpen(false);
    setQuery("");
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(list.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (list[active]) choose(list[active].code);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        data-cursor="link"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ar ? `العملة: ${currencyName(currency, "ar")}. تغيير العملة` : `Currency: ${currencyName(currency, "en")}. Change currency`}
        className="group inline-flex items-center gap-2 rounded-full border border-line bg-ink/40 py-1 pe-2 ps-3 text-[11px] text-bone/75 transition-colors hover:border-bone/40 hover:text-bone"
      >
        <span dir="ltr" className="text-mono tracking-[0.12em] text-bone" suppressHydrationWarning>
          {currency}
        </span>
        <span className="text-bone/45" suppressHydrationWarning>
          {currencySymbol(currency) !== currency ? currencySymbol(currency) : ""}
        </span>
        <ChevronDown size={12} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
            className="absolute end-0 top-[calc(100%+8px)] z-[70] w-[min(320px,80vw)] origin-top overflow-hidden rounded-2xl border border-line bg-ink/95 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            onKeyDown={onKey}
          >
            <label className="flex items-center gap-2 border-b border-line px-3 py-2.5">
              <Search size={14} className="shrink-0 text-bone/40" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={ar ? "ابحث عن عملة أو رمز…" : "Search currency or code…"}
                aria-label={ar ? "ابحث عن عملة" : "Search currencies"}
                aria-controls="currency-listbox"
                aria-activedescendant={list[active] ? `cur-${list[active].code}` : undefined}
                className="w-full bg-transparent text-[13px] text-bone outline-none placeholder:text-bone/35"
              />
            </label>
            <ul
              ref={listRef}
              id="currency-listbox"
              role="listbox"
              data-lenis-prevent
              className="max-h-[280px] overflow-y-auto overscroll-contain py-1"
            >
              {list.length === 0 ? (
                <li className="px-4 py-3 text-[12px] text-bone/45">{ar ? "لا توجد نتائج" : "No match"}</li>
              ) : (
                list.map((c, i) => {
                  const selected = c.code === currency;
                  return (
                    <li
                      key={c.code}
                      id={`cur-${c.code}`}
                      data-index={i}
                      role="option"
                      aria-selected={selected}
                      onPointerEnter={() => setActive(i)}
                      onClick={() => choose(c.code)}
                      className={`flex cursor-pointer items-center gap-3 px-3 py-2 text-[13px] transition-colors ${
                        i === active ? "bg-bone/[0.07]" : ""
                      } ${selected ? "text-bone" : "text-bone/70"}`}
                    >
                      <span dir="ltr" className="w-11 shrink-0 text-mono text-[11px] tracking-[0.1em] text-bone">
                        {c.code}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{c.name}</span>
                      <span dir="ltr" className="shrink-0 text-[11px] text-bone/40">
                        {c.symbol !== c.code ? c.symbol : ""}
                      </span>
                      {selected ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> : null}
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
