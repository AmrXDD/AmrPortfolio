"use client";

import { useEffect, useState } from "react";
import { WhatsAppCTA, EmailCTA } from "@/components/ui/wa-cta";
import { SITE, NAV_LINKS, waLink } from "@/lib/constants";

const SOCIAL = [
  { l: "Instagram", h: "https://instagram.com/amrrstudios" },
  { l: "Github", h: "https://github.com/AmrXDD" },
  { l: "WhatsApp", h: waLink("Hey Amr, saw your portfolio. Let's talk.") },
];

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
  return (
    <footer className="relative bg-ink">
      {/* Giant signature — centred, single, no repetition */}
      <div className="flex items-center justify-center gap-5 border-y border-line py-10 md:py-14">
        <span className="text-display text-[clamp(2.75rem,11vw,10rem)] leading-none text-bone">
          Amr <span className="text-bone/70">Studio</span>
        </span>
        <span className="h-3 w-3 rounded-full bg-accent" />
      </div>

      <div className="mx-auto grid max-w-[1600px] grid-cols-12 gap-y-12 px-5 py-20 md:px-10">
        <div className="col-span-12 md:col-span-5">
          <p className="text-mono text-[11px] uppercase tracking-[0.22em] text-bone/50">
            The end of the page
          </p>
          <h3 className="mt-6 text-display text-[clamp(1.75rem,3vw,2.75rem)] leading-tight text-bone">
            Most people stop scrolling before this. <span className="italic text-bone/70">You didn&apos;t.</span> Let&apos;s talk.
          </h3>
          <div className="mt-8 flex items-center gap-4">
            <WhatsAppCTA label="WhatsApp" />
            <EmailCTA />
          </div>
        </div>

        <div className="col-span-6 md:col-span-2 md:col-start-7">
          <p className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40">Index</p>
          <ul className="mt-5 space-y-3">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  data-cursor="link"
                  className="link-underline text-sm text-bone/85"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-6 md:col-span-2">
          <p className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40">Elsewhere</p>
          <ul className="mt-5 space-y-3">
            {SOCIAL.map((s) => (
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
          <p className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40">Coordinates</p>
          <ul className="mt-5 space-y-3 text-sm text-bone/85">
            <li>{SITE.city}</li>
            <li className="tabular-nums">{time} · GMT+3</li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Selectively available
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-4 px-5 py-8 text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40 md:flex-row md:items-center md:px-10">
          <span>© 2026 {SITE.name} Studio. All work hand coded.</span>
          <span>Built with Next.js 15 · TS · Tailwind · R3F · Framer Motion</span>
          <span>
            3D devices:{" "}
            <a href="https://sketchfab.com/3d-models/macbook-pro-m3-16-inch-2024-8e34fc2b303144f78490007d91ff57c4" target="_blank" rel="noreferrer" className="link-underline">jackbaeten</a>
            {" · "}
            <a href="https://sketchfab.com/3d-models/iphone-15-pro-max-5b7b35513a154ac69619dc2b2fe15686" target="_blank" rel="noreferrer" className="link-underline">MpPower™</a>
            {" "}(CC BY 4.0)
          </span>
          <span>v.05 · Site of the day candidate</span>
        </div>
      </div>
    </footer>
  );
}
