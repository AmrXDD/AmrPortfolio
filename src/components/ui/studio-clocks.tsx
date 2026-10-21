"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/*
 * Live local times for the studio's cities and its clients' main market:
 * London, Cairo and Kuwait. Read from the visitor's own clock through Intl
 * (so they are always right, summer time included), refreshed on the minute.
 */

export const CITIES = [
  { tz: "Europe/London", en: "London", ar: "لندن" },
  { tz: "Africa/Cairo", en: "Cairo", ar: "القاهرة" },
  { tz: "Asia/Kuwait", en: "Kuwait", ar: "الكويت" },
] as const;

const fmt = new Map<string, Intl.DateTimeFormat>();
export function timeIn(tz: string, at: Date) {
  let f = fmt.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });
    fmt.set(tz, f);
  }
  return f.format(at);
}

/** The current time, updated on each minute boundary (null before mount, so
 *  the server and first client render agree). */
export function useMinute() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    let t = 0;
    const tick = () => {
      const d = new Date();
      setNow(d);
      t = window.setTimeout(tick, 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 20);
    };
    tick();
    return () => clearTimeout(t);
  }, []);
  return now;
}

export function StudioClocks({ ar, className }: { ar: boolean; className?: string }) {
  const now = useMinute();
  return (
    <dl className={cn("grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line", className)}>
      {CITIES.map((c) => (
        <div key={c.tz} className="bg-ink px-4 py-3.5 md:px-5 md:py-4">
          <dt className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/50">{ar ? c.ar : c.en}</dt>
          <dd dir="ltr" className="mt-1.5 text-mono text-[clamp(1.15rem,4.6vw,1.6rem)] tabular-nums text-bone rtl:text-end">
            {now ? timeIn(c.tz, now) : "--:--"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
