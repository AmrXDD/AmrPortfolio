"use client";

import { CAPABILITIES } from "@/lib/constants";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal, RevealWords } from "@/components/ui/reveal";

export function Expertise() {
  return (
    <section id="services" className="relative z-10 -mt-10 scroll-mt-24 border-b border-line sm:-mt-12 md:-mt-14">
      {/* opaque dark panel with rounded top — slides up over the white Process sheet */}
      <div className="rounded-t-[40px] bg-ink px-5 py-32 sm:rounded-t-[50px] md:rounded-t-[60px] md:px-10 md:py-40">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-16 grid grid-cols-12 items-end gap-y-8">
          <div className="col-span-12 md:col-span-6">
            <Eyebrow index="07">Capabilities</Eyebrow>
            <h2 className="mt-6 text-display size-h2 text-bone">
              <RevealWords text="Full stack" />
              <br />
              <span className="italic text-bone/80">
                <RevealWords text="of taste & craft." delay={0.1} />
              </span>
            </h2>
          </div>
          <div className="col-span-12 md:col-span-5 md:col-start-8">
            <Reveal>
              <p className="text-sm leading-relaxed text-bone/65">
                I&apos;m a one-person studio for the things that matter most — strategy,
                interaction, motion, and shipping. For everything else I assemble teams I
                trust and lead them on the work.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px border-t border-line bg-line md:grid-cols-3">
          {CAPABILITIES.map((c, i) => (
            <Reveal key={c.title} delay={(i % 3) * 0.05}>
              <div data-tick className="group relative flex h-full flex-col gap-6 bg-ink p-8 transition-colors duration-500 hover:bg-ash md:p-10">
                <div className="flex items-center justify-between">
                  <span className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40">
                    0{i + 1}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-accent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </div>
                <h3 className="text-display text-[clamp(1.5rem,2.4vw,2.25rem)] leading-none text-bone">
                  {c.title}
                </h3>
                <ul className="mt-auto space-y-2">
                  {c.items.map((it) => (
                    <li
                      key={it}
                      className="flex items-center gap-3 text-sm text-bone/65 transition-colors group-hover:text-bone/85"
                    >
                      <span className="h-px w-3 bg-bone/30" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}

          {/* CTA cell — fills the last row so there's no empty grey space */}
          <Reveal className="md:col-span-2">
            <a
              href="#contact"
              data-cursor="link"
              data-cursor-label="Contact"
              className="group relative flex h-full min-h-[220px] flex-col justify-between gap-6 overflow-hidden bg-ink p-8 transition-colors duration-500 hover:bg-ash md:p-10"
            >
              <span className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-accent/20 opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative flex items-center justify-between">
                <span className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/40">Next</span>
                <span className="h-1 w-1 rounded-full bg-accent" />
              </div>
              <div className="relative">
                <h3 className="max-w-lg text-display text-[clamp(1.6rem,2.6vw,2.6rem)] leading-[1.05] text-bone">
                  Have something in mind? <span className="italic text-bone/70">Let&apos;s build it.</span>
                </h3>
                <span className="mt-6 inline-flex items-center gap-2 text-mono text-[11px] uppercase tracking-[0.2em] text-bone/70 transition-colors group-hover:text-bone">
                  Start a project
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </span>
              </div>
            </a>
          </Reveal>
        </div>
      </div>
      </div>
    </section>
  );
}
