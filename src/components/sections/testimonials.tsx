"use client";

import { TESTIMONIALS } from "@/lib/constants";
import { Marquee } from "@/components/ui/marquee";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealWords } from "@/components/ui/reveal";
import { BorderGlow } from "@/components/ui/border-glow";
import { useLang } from "@/lib/i18n";

// Only clients whose work is shown on this page. Listed twice so the band
// is long enough to loop without a visible gap.
const CLIENTS = ["Scenarios", "Quipmed", "LivFunctional", "Smartee"];
const LOGOS = [...CLIENTS, ...CLIENTS];

export function Testimonials() {
  const { lang } = useLang();
  const ar = lang === "ar";
  return (
    <section className="relative border-b border-line bg-ink py-32 md:py-40">
      <div className="mx-auto mb-20 max-w-[1600px] px-5 md:px-10">
        <div className="grid grid-cols-12 items-end gap-y-8">
          <div className="col-span-12 md:col-span-6">
            <Eyebrow index="10">{ar ? "الشهادات" : "Receipts"}</Eyebrow>
            <h2 key={lang} className="mt-6 text-display size-h2 text-bone">
              <RevealWords text={ar ? "ماذا يقول" : "What the people"} />
              <br />
              <span className="italic text-bone/80">
                <RevealWords text={ar ? "عملائي عنّي." : "paying me say."} delay={0.1} />
              </span>
            </h2>
          </div>
        </div>
      </div>

      <div dir="ltr">
      <Marquee speed={60} className="border-y border-line py-10">
        {LOGOS.map((l, i) => (
          <span
            key={i}
            className="flex items-center gap-12 text-display text-[clamp(2rem,4vw,3.5rem)] italic text-bone/60"
          >
            <span>{l}</span>
            <span className="h-2 w-2 rounded-full bg-bone/30" />
          </span>
        ))}
      </Marquee>
      </div>

      <div className="mx-auto mt-20 grid max-w-[1600px] grid-cols-1 gap-4 px-5 md:grid-cols-2 md:gap-6 md:px-10 lg:grid-cols-4">
        {TESTIMONIALS.map((raw, i) => {
          const t = ar ? raw.ar : raw;
          return (
          <BorderGlow key={i} radius={24} className="h-full">
          <figure
            data-tick
            className="group relative flex h-full flex-col gap-8 rounded-3xl border border-line bg-ash p-8 transition-colors duration-500 hover:bg-smoke md:p-10"
          >
            <span className="text-display text-5xl italic leading-none text-accent">{ar ? "”" : "“"}</span>
            <blockquote className="text-base leading-relaxed text-bone/85">
              {t.quote}
            </blockquote>
            <figcaption className="mt-auto border-t border-line pt-6">
              <p className="text-sm text-bone">{t.author}</p>
              <p className="mt-1 text-mono text-[10px] uppercase tracking-[0.22em] text-bone/50">
                {t.role}
              </p>
            </figcaption>
          </figure>
          </BorderGlow>
          );
        })}
      </div>
    </section>
  );
}
