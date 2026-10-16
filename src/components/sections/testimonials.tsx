"use client";

import { Marquee } from "@/components/ui/marquee";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealWords } from "@/components/ui/reveal";
import { useLang } from "@/lib/i18n";

// Only clients whose work is shown on this page. Listed twice so the band
// is long enough to loop without a visible gap.
const CLIENTS = ["Scenarios", "Quipmed", "LivFunctional", "Smartee"];
const LOGOS = [...CLIENTS, ...CLIENTS];

/* The client band. No quotes: only names whose work is on this page. */
export function Testimonials() {
  const { lang } = useLang();
  const ar = lang === "ar";
  return (
    <section className="relative border-b border-line bg-ink py-24 md:py-32">
      <div className="mx-auto mb-14 max-w-[1600px] px-5 md:px-10">
        <Eyebrow index="10">{ar ? "العملاء" : "Clients"}</Eyebrow>
        <h2 key={lang} className="mt-6 text-display size-h2 text-bone">
          <RevealWords text={ar ? "صُنع لـ" : "Built for"} />{" "}
          <span className="italic text-bone/80">
            <RevealWords text={ar ? "هؤلاء." : "these four."} delay={0.1} />
          </span>
        </h2>
      </div>

      <div dir="ltr">
        <Marquee speed={60} className="border-y border-line py-10">
          {LOGOS.map((l, i) => (
            <span key={i} className="flex items-center gap-12 text-display text-[clamp(2rem,4vw,3.5rem)] italic text-bone/60">
              <span>{l}</span>
              <span className="h-2 w-2 rounded-full bg-bone/30" />
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
