"use client";

import { PROCESS } from "@/lib/constants";
import { Reveal, RevealWords } from "@/components/ui/reveal";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

/**
 * The "lights on" beat of the page: a warm-white sheet with rounded top
 * corners rises out of the black field, the method typeset like an index —
 * giant numerals left, beat name + description right, hairline separators.
 * (The white lives on an inner wrapper: sections stay transparent in dark
 * mode, so the sheet's rounded corners reveal the cosmic field behind.)
 */
export function Process() {
  return (
    <section id="process" className="relative">
      <div className="rounded-t-[40px] bg-[#F4F3EF] px-5 py-20 text-[#0C0C0C] sm:rounded-t-[50px] sm:px-8 sm:py-24 md:rounded-t-[60px] md:px-10 md:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center sm:mb-20 md:mb-28">
            <p className="text-mono text-[11px] uppercase tracking-[0.3em] text-[#0C0C0C]/45">
              06 · Process
            </p>
            <h2 className="mt-6 text-display uppercase leading-none text-[#0C0C0C]" style={{ fontSize: "clamp(2.6rem, 9.5vw, 9rem)" }}>
              <RevealWords text="Method" />
            </h2>
            <ScrollReveal
              className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-[#0C0C0C]/70"
              text="A five beat method for inevitable software, the same sequence, every engagement, no improvisation where it counts."
            />
          </div>

          <div>
            {PROCESS.map((p, i) => (
              <Reveal key={p.no} delay={i * 0.1}>
                <div
                  data-tick
                  className="group flex flex-col gap-4 border-t border-[#0C0C0C]/15 py-8 sm:py-10 md:flex-row md:items-start md:gap-12 md:py-12"
                >
                  <span
                    className="text-display leading-none text-[#0C0C0C] transition-transform duration-500 group-hover:-translate-y-1 md:w-[220px]"
                    style={{ fontSize: "clamp(3rem, 10vw, 8.75rem)" }}
                  >
                    {p.no}
                  </span>
                  <div className="md:flex-1 md:pt-3">
                    <h3 className="text-display uppercase leading-tight text-[#0C0C0C]" style={{ fontSize: "clamp(1rem, 2.2vw, 2.1rem)" }}>
                      {p.title}
                    </h3>
                    <p className="mt-3 max-w-2xl font-light leading-relaxed text-[#0C0C0C]/60" style={{ fontSize: "clamp(0.85rem, 1.6vw, 1.25rem)" }}>
                      {p.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
            <div className="border-t border-[#0C0C0C]/15" />
          </div>
        </div>
      </div>
    </section>
  );
}
