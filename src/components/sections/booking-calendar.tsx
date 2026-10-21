"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { CAL_EVENTS, CAL_URL, inlineBooking, themeBooking, warmBooking, type CalEvent } from "@/lib/cal";
import { useCopy } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const COPY = {
  en: {
    eyebrow: "Intro call",
    title: "Pick a time. It's in your time zone.",
    min: "min",
    loading: "Opening the calendar",
    fallback: "Open the calendar on Cal.com",
  },
  ar: {
    eyebrow: "مكالمة تعارف",
    title: "اختر موعدًا، بتوقيتك المحلي.",
    min: "دقيقة",
    loading: "جارٍ فتح التقويم",
    fallback: "افتح التقويم على Cal.com",
  },
};

/*
 * The booking calendar, inline in the contact section: Cal.com's month view
 * with the call's details beside it and the free times on the right, in the
 * site's colours and theme. It loads only as it comes near the screen.
 */
export function BookingCalendar() {
  const c = useCopy(COPY);
  const box = useRef<HTMLDivElement>(null);
  const hosts = useRef<Partial<Record<CalEvent, HTMLDivElement | null>>>({});
  const started = useRef<Partial<Record<CalEvent, boolean>>>({});
  const [event, setEvent] = useState<CalEvent>("long");
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState<Partial<Record<CalEvent, boolean>>>({});
  // per call: it couldn't show (a missing event, Cal.com unreachable, or no
  // sign of life after 12 s): then a direct link replaces the spinner
  const [failed, setFailed] = useState<Partial<Record<CalEvent, boolean>>>({});

  // start when it comes within a screen or so; follow the site's theme
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setNear(true), io.disconnect()), { rootMargin: "800px 0px" });
    io.observe(el);
    const mo = new MutationObserver(() => themeBooking());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  // each call's calendar is made once, in its own box, the first time it's
  // chosen; switching back and forth only shows or hides it
  useEffect(() => {
    const el = hosts.current[event];
    if (!near || !el || started.current[event]) return;
    started.current[event] = true;
    const k = event;
    let shown = false;
    inlineBooking(el, k, {
      ready: () => {
        shown = true;
        setReady((r) => ({ ...r, [k]: true }));
      },
      fail: () => setFailed((f) => ({ ...f, [k]: true })),
    });
    window.setTimeout(() => !shown && setFailed((f) => ({ ...f, [k]: true })), 12000);
  }, [near, event]);

  const loaded = !!ready[event];
  const broken = !!failed[event] && !loaded;

  return (
    <div id="book" ref={box} className="scroll-mt-24 overflow-hidden rounded-[28px] border border-line bg-ash/30">
      {/* the call: an ember bar with the length switch */}
      <div className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden bg-[linear-gradient(110deg,#FF4D1F,#c2341a_55%,#7c3aed)] px-6 py-5 text-white md:px-8">
        <div aria-hidden className="pointer-events-none absolute -end-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.28),transparent_65%)]" />
        <div className="relative">
          <p className="text-mono text-[10px] uppercase tracking-[0.26em] text-white/75">{c.eyebrow}</p>
          <p className="mt-1.5 text-[15px] font-medium md:text-[17px]">{c.title}</p>
        </div>
        <div role="radiogroup" aria-label={c.eyebrow} className="relative flex rounded-full bg-black/25 p-1">
          {(Object.keys(CAL_EVENTS) as CalEvent[]).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={event === k}
              data-cursor="link"
              onClick={() => setEvent(k)}
              onPointerEnter={warmBooking}
              className={cn(
                "rounded-full px-4 py-2 text-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-300",
                event === k ? "bg-white text-[#c2341a]" : "text-white/80 hover:text-white"
              )}
            >
              <span dir="ltr">{CAL_EVENTS[k].minutes}</span> {c.min}
            </button>
          ))}
        </div>
      </div>

      {/* the calendars */}
      {/* The site declares color-scheme: dark; Cal's page inside the iframe is
          a light-scheme document. When the two differ, the browser paints the
          iframe an opaque (white) backdrop whatever Cal's background is, so
          the frame here takes the light scheme to match: then the page is
          truly transparent over this dark panel. */}
      <div className="relative min-h-[560px] bg-ink p-2 [color-scheme:light] md:p-4" data-lenis-prevent>
        {!loaded && !broken ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-bone/50">
            <span className="h-2.5 w-2.5 animate-ping rounded-full bg-accent" />
            <span className="text-mono text-[10px] uppercase tracking-[0.24em]">{c.loading}</span>
          </div>
        ) : null}
        {broken ? (
          <div className="flex min-h-[540px] flex-col items-center justify-center gap-4">
            <a href={`https://cal.com/${CAL_EVENTS[event].link}`} target="_blank" rel="noreferrer" data-cursor="link" className="inline-flex items-center gap-2 text-mono text-[12px] uppercase tracking-[0.18em] text-accent">
              {c.fallback} <ArrowUpRight size={14} className="rtl:-scale-x-100" />
            </a>
            <a href={CAL_URL} target="_blank" rel="noreferrer" data-cursor="link" className="text-mono text-[10px] uppercase tracking-[0.2em] text-bone/50 underline-offset-4 hover:underline">
              cal.com/amrstudios
            </a>
          </div>
        ) : null}
        {(Object.keys(CAL_EVENTS) as CalEvent[]).map((k) => (
          <div
            key={k}
            ref={(n) => {
              hosts.current[k] = n;
            }}
            className={cn("w-full transition-opacity duration-500", event === k ? "block" : "hidden", ready[k] ? "opacity-100" : "opacity-0")}
          />
        ))}
      </div>
    </div>
  );
}
