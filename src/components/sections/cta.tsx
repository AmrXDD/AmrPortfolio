"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealWords, Reveal } from "@/components/ui/reveal";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { BorderGlow } from "@/components/ui/border-glow";
import { WhatsAppCTA, EmailCTA } from "@/components/ui/wa-cta";
import { ContactForm } from "@/components/sections/contact-form";
import { useLang } from "@/lib/i18n";
import { SITE } from "@/lib/constants";

export function CTA() {
  const { t, lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yA = useTransform(scrollYProgress, [0, 1], ["20%", "-20%"]);
  const yB = useTransform(scrollYProgress, [0, 1], ["10%", "-30%"]);
  const blur = useTransform(scrollYProgress, [0, 0.5, 1], [40, 0, 40]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  return (
    <section
      id="contact"
      ref={ref}
      className="relative overflow-hidden border-b border-line bg-ink px-5 py-40 md:px-10 md:py-56"
    >
      {/* Iridescent glow backdrop */}
      <motion.div
        style={{ y: yA, filter }}
        className="pointer-events-none absolute -left-32 top-1/3 h-[60vh] w-[60vh] rounded-full opacity-60"
        aria-hidden
      >
        <div className="h-full w-full rounded-full bg-gradient-to-br from-plasma via-accent to-cyan blur-3xl" />
      </motion.div>
      <motion.div
        style={{ y: yB, filter }}
        className="pointer-events-none absolute -right-32 bottom-1/4 h-[50vh] w-[50vh] rounded-full opacity-50"
        aria-hidden
      >
        <div className="h-full w-full rounded-full bg-gradient-to-tr from-cyan to-plasma blur-3xl" />
      </motion.div>

      <div className="relative mx-auto max-w-[1600px]">
        <div className="grid grid-cols-12 gap-y-12">
          <div className="col-span-12 md:col-span-3">
            <Eyebrow index="11">{t("contact.eyebrow")}</Eyebrow>
            <Reveal delay={0.2}>
              <p className="mt-8 text-mono text-[11px] uppercase tracking-[0.22em] text-bone/50">
                Engagement
              </p>
              <ScrollReveal
                className="mt-3 text-sm leading-relaxed text-bone/90"
                text="Founding-team work, flagship product launches, brand engineering, and the one-off cinematic landing page that earns a studio its next client."
              />
              <p className="mt-8 text-mono text-[11px] uppercase tracking-[0.22em] text-bone/50">
                Working from
              </p>
              <p className="mt-2 text-sm text-bone">{SITE.city}</p>
              <p className="mt-1 text-mono text-[10px] text-bone/50">GMT+3 · Worldwide</p>
            </Reveal>
          </div>

          <div className="col-span-12 md:col-span-9">
            <h2 key={lang} className="text-display text-bone size-display">
              <span className="block">
                <RevealWords text={t("contact.h1")} />
              </span>
              <span className="block italic text-bone/85">
                <RevealWords text={t("contact.h2")} delay={0.1} />
              </span>
              <span className="block">
                <span className="text-accent">
                  <RevealWords text={t("contact.h3")} delay={0.2} />
                </span>
              </span>
            </h2>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <WhatsAppCTA
                label="Open WhatsApp"
                message="Hey Amr — saw your portfolio. Want to talk about a project."
                className="!py-4 !px-6 !text-sm"
              />
              <EmailCTA />
            </div>

            {/* Inquiry form — budget · service (Dev/SMMA) · reason → Supabase + Resend */}
            <div className="mt-14 grid grid-cols-1 gap-12 border-t border-line pt-12 lg:grid-cols-[1.1fr_0.9fr]">
              <ContactForm />
              <div className="grid gap-4 self-start">
                <ContactRow
                  label="01 · Founding work"
                  title="Build something from zero."
                  desc="Founder-mode partnership for early-stage product. Design, engineering, brand — one pair of hands."
                />
                <ContactRow
                  label="02 · Flagship launches"
                  title="Make the hero moment."
                  desc="Marketing site, product launch, brand campaign. Cinematic execution, on a tight calendar."
                />
                <ContactRow
                  label="03 · Social & growth (SMMA)"
                  title="Own the feed."
                  desc="Content strategy, paid social, and short-form creative that compounds into pipeline."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactRow({ label, title, desc }: { label: string; title: string; desc: string }) {
  return (
    <BorderGlow radius={16} className="h-full">
      <div className="group h-full rounded-2xl border border-line bg-ash/40 p-6 transition-colors duration-500 hover:bg-ash md:p-8">
        <p className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/50">{label}</p>
        <p className="mt-4 text-display text-[clamp(1.25rem,2vw,1.75rem)] leading-tight text-bone">
          {title}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-bone/65">{desc}</p>
      </div>
    </BorderGlow>
  );
}
