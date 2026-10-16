"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WhatsAppCTA, EmailCTA } from "@/components/ui/wa-cta";
import { SITE, SITE_AR, NAV_LINKS, waLink } from "@/lib/constants";
import { useCopy, useLang } from "@/lib/i18n";

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
    built: "Built with Next.js 16 · TS · Tailwind · R3F · Framer Motion",
    version: "v.05",
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
    built: "مبني بـ Next.js 16 · TS · Tailwind · R3F · Framer Motion",
    version: "v.05",
  },
};

function useTime() {
  const [t, setT] = useState("--:--");
  useEffect(() => {
    const f = () =>
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Kuwait",
      }).format(new Date());
    setT(f());
    const id = setInterval(() => setT(f()), 30_000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export function Footer() {
  const time = useTime();
  const c = useCopy(COPY);
  const { t, lang } = useLang();
  const social = [
    { l: "Instagram", h: "https://instagram.com/amrrstudios" },
    { l: "Github", h: "https://github.com/AmrXDD" },
    { l: lang === "ar" ? "واتساب" : "WhatsApp", h: waLink(c.waMsg) },
  ];
  return (
    <footer className="relative bg-ink">
      {/* Giant signature — centred, single, no repetition */}
      <div dir="ltr" className="flex items-center justify-center gap-5 border-y border-line py-10 md:py-14">
        <span className="text-display text-[clamp(2.75rem,11vw,10rem)] leading-none text-bone">
          Amr <span className="text-bone/70">Studio</span>
        </span>
        <span className="h-3 w-3 rounded-full bg-accent" />
      </div>

      <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-y-12 px-5 py-20 md:px-10">
        <div className="col-span-12 md:col-span-5">
          <p className="text-mono text-[11px] uppercase tracking-[0.22em] text-bone/50">
            {c.end}
          </p>
          <h3 className="mt-6 text-display text-[clamp(1.75rem,3vw,2.75rem)] leading-tight text-bone">
            {c.hA} <span className="italic text-bone/70">{c.hB}</span> {c.hC}
          </h3>
          <div className="mt-8 flex items-center gap-4">
            <WhatsAppCTA label={lang === "ar" ? "واتساب" : "WhatsApp"} message={c.waMsg} />
            <EmailCTA />
          </div>
        </div>

        <div className="col-span-6 md:col-span-2 md:col-start-7">
          <p className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40">{c.index}</p>
          <ul className="mt-5 space-y-3">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  data-cursor="link"
                  className="link-underline text-sm text-bone/85"
                >
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
                <a
                  href={s.h}
                  target="_blank"
                  rel="noreferrer"
                  data-cursor="link"
                  className="link-underline text-sm text-bone/85"
                >
                  {s.l}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-12 md:col-span-3">
          <p className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40">{c.coords}</p>
          <ul className="mt-5 space-y-3 text-sm text-bone/85">
            <li>{c.city}</li>
            <li dir="ltr" className="tabular-nums rtl:text-right">{time} · GMT+3</li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              {c.available}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-4 px-5 py-8 text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40 md:flex-row md:items-center md:px-10">
          <span>{c.rights}</span>
          <span className="flex gap-4">
            <Link href="/privacy" data-cursor="link" className="link-underline">{t("legal.privacy")}</Link>
            <Link href="/terms" data-cursor="link" className="link-underline">{t("legal.terms")}</Link>
          </span>
          <span>{c.built}</span>
          <span>{c.version}</span>
        </div>
      </div>
    </footer>
  );
}
