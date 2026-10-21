"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { WhatsAppCTA, EmailCTA } from "@/components/ui/wa-cta";
import { BookCall } from "@/components/ui/book-call";
import { scrollToId } from "@/components/site-dock";
import { SITE, SITE_AR, NAV_LINKS, waLink } from "@/lib/constants";
import { useCopy, useLang } from "@/lib/i18n";
import { CAL_URL } from "@/lib/cal";

const COPY = {
  en: {
    end: "The end of the page",
    hA: "Most people stop scrolling before this.",
    hB: "You didn't.",
    hC: "Let's talk.",
    index: "Index",
    elsewhere: "Elsewhere",
    coords: "Coordinates",
    city: SITE.city as string,
    available: "Selectively available",
    waMsg: "Hey Amr, saw your portfolio. Let's talk.",
    rights: `© ${new Date().getFullYear()} ${SITE.name} Studio. All work hand coded.`,
    version: "v.05",
    top: "Back to top",
  },
  ar: {
    end: "نهاية الصفحة",
    hA: "معظم الناس يتوقّفون عن التمرير قبل هنا.",
    hB: "أنت لم تتوقّف.",
    hC: "لنتحدّث.",
    index: "الفهرس",
    elsewhere: "في أماكن أخرى",
    coords: "الإحداثيات",
    city: SITE_AR.city,
    available: "متاح بعدد محدود",
    waMsg: "مرحبًا عمرو، شاهدت أعمالك. لنتحدّث.",
    rights: `© ${new Date().getFullYear()} ${SITE.name} Studio. كل الأعمال مبرمجة يدويًا.`,
    version: "v.05",
    top: "إلى الأعلى",
  },
};

const WORD = "Amr Studio";

/** The studio's clock: it writes its own text (no footer re-render each
 *  second) and only ticks while it is on screen. */
function KuwaitClock() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Kuwait" });
    const f = () => (el.textContent = fmt.format(new Date()));
    let id = 0;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(id);
      if (e.isIntersecting) {
        f();
        id = window.setInterval(f, 1000);
      }
    });
    io.observe(el);
    return () => {
      clearInterval(id);
      io.disconnect();
    };
  }, []);
  return <span ref={ref}>--:--:--</span>;
}

/** One letter of the wordmark, rising out of the floor at its own pace
 *  (a CSS transition, once: no work per scroll frame). */
function Letter({ ch, i }: { ch: string; i: number }) {
  if (ch === " ") return <span className="inline-block w-[0.22em]" />;
  return (
    <span className="ft-letter inline-block origin-bottom" style={{ ["--i" as string]: i, ["--r" as string]: i % 2 ? "8deg" : "-8deg" }}>
      <span className="inline-block transition-colors duration-300 hover:text-accent">{ch}</span>
    </span>
  );
}

export function Footer() {
  const c = useCopy(COPY);
  const { t, lang } = useLang();
  const ref = useRef<HTMLElement>(null);
  // the footer used to be scrubbed by scroll (about 30 values a frame, a
  // whole-footer opacity among them): now it plays once, on arrival, in CSS
  const [inView, setInView] = useState(false);
  const wordRef = useRef<HTMLParagraphElement>(null);
  const [wordIn, setWordIn] = useState(false);
  useEffect(() => {
    const a = ref.current;
    const b = wordRef.current;
    if (!a || !b) return;
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          if (e.target === a) setInView(true);
          if (e.target === b) setWordIn(true);
          io.unobserve(e.target);
        }),
      { threshold: 0.15 }
    );
    io.observe(a);
    io.observe(b);
    return () => io.disconnect();
  }, []);

  const social = [
    { l: lang === "ar" ? "احجز مكالمة" : "Book a call", h: CAL_URL },
    { l: "Instagram", h: "https://instagram.com/amrrstudios" },
    { l: "Github", h: "https://github.com/AmrXDD" },
    { l: lang === "ar" ? "واتساب" : "WhatsApp", h: waLink(c.waMsg) },
  ];

  return (
    <footer ref={ref} className="relative overflow-hidden bg-ink">
      <div className={`ft-body ${inView ? "in" : ""}`}>
        <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-y-12 px-5 pb-16 pt-24 md:px-10 md:pt-32">
          <div className="col-span-12 md:col-span-5">
            <p className="flex items-center gap-3 text-mono text-[11px] uppercase tracking-[0.22em] text-bone/50">
              <span className="h-px w-8 bg-accent" />
              {c.end}
            </p>
            <h3 className="mt-6 max-w-2xl text-display leading-[1.08] text-bone" style={{ fontSize: "clamp(2rem, 4vw, 3.6rem)" }}>
              {c.hA} <span className="italic text-bone/70">{c.hB}</span> <span className="text-accent">{c.hC}</span>
            </h3>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <BookCall />
              <WhatsAppCTA variant="ghost" label={lang === "ar" ? "واتساب" : "WhatsApp"} message={c.waMsg} />
              <EmailCTA />
            </div>
          </div>

          <div className="col-span-6 md:col-span-2 md:col-start-7">
            <p className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40">{c.index}</p>
            <ul className="mt-5 space-y-3">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} data-cursor="link" className="group inline-flex items-center gap-2 text-sm text-bone/85 transition-colors hover:text-bone">
                    <span className="h-px w-0 bg-accent transition-[width] duration-300 group-hover:w-4" />
                    {t(l.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-6 md:col-span-2">
            <p className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40">{c.elsewhere}</p>
            <ul className="mt-5 space-y-3">
              {social.map((s) => (
                <li key={s.l}>
                  <a href={s.h} target="_blank" rel="noreferrer" data-cursor="link" className="group inline-flex items-center gap-1.5 overflow-hidden text-sm text-bone/85 transition-colors hover:text-bone">
                    {s.l}
                    <span className="relative inline-flex h-3.5 w-3.5 overflow-hidden">
                      <ArrowUpRight size={14} className="absolute transition-transform duration-300 group-hover:-translate-y-full group-hover:translate-x-full rtl:-scale-x-100 rtl:group-hover:-translate-x-full" />
                      <ArrowUpRight size={14} className="absolute -translate-x-full translate-y-full text-accent transition-transform duration-300 group-hover:translate-x-0 group-hover:translate-y-0 rtl:-scale-x-100 rtl:translate-x-full" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-12 md:col-span-2">
            <p className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40">{c.coords}</p>
            <ul className="mt-5 space-y-3 text-sm text-bone/85">
              <li>{c.city}</li>
              <li dir="ltr" className="font-mono text-[13px] tabular-nums rtl:text-right">
                <KuwaitClock /> · GMT+3
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                {c.available}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* the wordmark rises out of the floor */}
      <div dir="ltr" className="relative select-none border-t border-line px-3 pt-6 md:px-6">
        <p ref={wordRef} className={`ft-word whitespace-nowrap text-center text-display leading-[0.82] text-bone ${wordIn ? "in" : ""}`} style={{ fontSize: "clamp(2.6rem, 14.5vw, 19rem)" }} aria-label={`${SITE.name} Studio`}>
          <span aria-hidden className="inline-block overflow-hidden pb-[0.06em] align-bottom">
            {WORD.split("").map((ch, i) => (
              <Letter key={i} ch={ch} i={i} />
            ))}
          </span>
          <span aria-hidden className="ft-dot ms-[0.05em] inline-block h-[0.12em] w-[0.12em] rounded-full bg-accent align-baseline" />
        </p>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-4 px-5 pb-36 pt-8 text-mono md:pb-24 text-[10px] uppercase tracking-[0.22em] text-bone/40 md:flex-row md:items-center md:px-10">
          <span>{c.rights}</span>
          <span className="flex gap-4">
            <Link href="/privacy" data-cursor="link" className="link-underline">
              {t("legal.privacy")}
            </Link>
            <Link href="/terms" data-cursor="link" className="link-underline">
              {t("legal.terms")}
            </Link>
          </span>
          <span className="flex items-center gap-6">
            <span>{c.version}</span>
            <button
              type="button"
              onClick={() => scrollToId("top")}
              data-cursor="link"
              className="group inline-flex items-center gap-2 uppercase tracking-[0.22em] text-bone/60 transition-colors hover:text-bone"
            >
              {c.top}
              <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-bone/20 transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
                <ArrowUp size={12} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
              </span>
            </button>
          </span>
        </div>
      </div>
    </footer>
  );
}
