"use client";

import { BookCall } from "@/components/ui/book-call";
import { WhatsAppCTA } from "@/components/ui/wa-cta";
import { Reveal } from "@/components/ui/reveal";
import { useCopy } from "@/lib/i18n";

const COPY = {
  en: {
    eyebrow: "Next step",
    a: "Seen enough to talk?",
    b: "Pick a time.",
    wa: "WhatsApp",
    msg: "Hey Amr, saw your case studies. Want to talk about a project.",
  },
  ar: {
    eyebrow: "الخطوة التالية",
    a: "رأيت ما يكفي لنتحدّث؟",
    b: "اختر موعدًا.",
    wa: "واتساب",
    msg: "مرحبًا عمرو، شاهدت دراسات الحالة وأرغب في الحديث عن مشروع.",
  },
};

/*
 * A slim band after the case studies, where a visitor has just seen the
 * work: the booking, one tap away (and WhatsApp beside it).
 */
export function BookingStrip() {
  const c = useCopy(COPY);
  return (
    <section className="relative overflow-hidden border-b border-line px-5 py-16 md:px-10 md:py-24">
      <div aria-hidden className="pointer-events-none absolute -start-[10%] top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,77,31,0.14),transparent_62%)]" />
      <Reveal className="relative mx-auto flex max-w-[1600px] flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex items-center gap-3 text-mono text-[11px] uppercase tracking-[0.22em] text-bone/50">
            <span className="h-px w-8 bg-accent" />
            {c.eyebrow}
          </p>
          <h2 className="mt-5 text-balance text-display leading-[1.05] text-bone" style={{ fontSize: "clamp(1.9rem, 5vw, 4.4rem)" }}>
            {c.a} <span className="italic text-accent">{c.b}</span>
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <BookCall />
          <WhatsAppCTA variant="ghost" label={c.wa} message={c.msg} />
        </div>
      </Reveal>
    </section>
  );
}
