"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealWords, Reveal } from "@/components/ui/reveal";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { BorderGlow } from "@/components/ui/border-glow";
import { WhatsAppCTA, EmailCTA } from "@/components/ui/wa-cta";
import { ContactForm } from "@/components/sections/contact-form";
import { useCopy, useLang } from "@/lib/i18n";
import { SITE, SITE_AR } from "@/lib/constants";

const COPY = {
  en: {
    engagement: "Engagement",
    engagementBody:
      "Websites built from zero, web design and consultation, and brand identities, for founders and studios who want the one site that earns them their next client.",
    workingFrom: "Working from",
    city: SITE.city as string,
    zone: "GMT+3 · Worldwide",
    openWa: "Open WhatsApp",
    waMsg: "Hey Amr, saw your portfolio. Want to talk about a project.",
    rows: [
      { label: "01 · Web development", title: "Build something from zero.", desc: "Marketing sites, product sites and web apps, designed and engineered by one pair of hands, from first commit to launch." },
      { label: "02 · Design & consultation", title: "Get a second pair of eyes.", desc: "Design direction, UX and performance audits, and straight answers on stack and structure before you spend on a build." },
      { label: "03 · Brand identity", title: "Give it a face.", desc: "Logo and mark systems, typography, colour and guidelines, made to carry from the website to everything else." },
    ],
  },
  ar: {
    engagement: "مجالات العمل",
    engagementBody:
      "مواقع تُبنى من الصفر، وتصميم مواقع واستشارات، وهويات بصرية، للمؤسسين والاستوديوهات الذين يريدون موقعًا يجلب لهم عميلهم القادم.",
    workingFrom: "أعمل من",
    city: SITE_AR.city,
    zone: "GMT+3 · حول العالم",
    openWa: "افتح واتساب",
    waMsg: "مرحبًا عمرو، شاهدت أعمالك وأرغب في الحديث عن مشروع.",
    rows: [
      { label: "01 · تطوير المواقع", title: "ابنِ شيئًا من الصفر.", desc: "مواقع تعريفية ومواقع منتجات وتطبيقات ويب، يصمّمها ويبرمجها شخص واحد من أول سطر حتى الإطلاق." },
      { label: "02 · التصميم والاستشارات", title: "عين خبيرة ثانية.", desc: "توجيه تصميمي، وتدقيق لتجربة المستخدم والأداء، وإجابات واضحة عن التقنيات والبنية قبل أن تنفق على التنفيذ." },
      { label: "03 · الهوية البصرية", title: "امنحه وجهًا.", desc: "الشعار وأنظمة العلامة والخطوط والألوان ودليل الهوية، مصمّمة لتنتقل من الموقع إلى كل ما سواه." },
    ],
  },
};

export function CTA() {
  const { t, lang } = useLang();
  const c = useCopy(COPY);
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
      {/* Iridescent glow backdrop — much smaller & softer on mobile so the
          saturated colours read as a subtle ambient glow, not harsh blobs */}
      <motion.div
        style={{ y: yA, filter }}
        className="pointer-events-none absolute -left-24 top-1/3 h-[34vh] w-[34vh] rounded-full opacity-30 md:-left-32 md:h-[60vh] md:w-[60vh] md:opacity-60"
        aria-hidden
      >
        <div className="h-full w-full rounded-full bg-gradient-to-br from-plasma via-accent to-cyan blur-3xl" />
      </motion.div>
      <motion.div
        style={{ y: yB, filter }}
        className="pointer-events-none absolute -right-24 bottom-1/4 h-[30vh] w-[30vh] rounded-full opacity-25 md:-right-32 md:h-[50vh] md:w-[50vh] md:opacity-50"
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
                {c.engagement}
              </p>
              <ScrollReveal key={lang} className="mt-3 text-sm leading-relaxed text-bone/90" text={c.engagementBody} />
              <p className="mt-8 text-mono text-[11px] uppercase tracking-[0.22em] text-bone/50">
                {c.workingFrom}
              </p>
              <p className="mt-2 text-sm text-bone">{c.city}</p>
              <p className="mt-1 text-mono text-[10px] text-bone/50">{c.zone}</p>
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
                label={c.openWa}
                message={c.waMsg}
                className="!py-4 !px-6 !text-sm"
              />
              <EmailCTA />
            </div>

            {/* Inquiry form — budget · service · reason → Supabase + Resend */}
            <div className="mt-14 grid grid-cols-1 gap-12 border-t border-line pt-12 lg:grid-cols-[1.1fr_0.9fr]">
              <ContactForm />
              <div className="grid gap-4 self-start">
                {c.rows.map((r) => (
                  <ContactRow key={r.label} label={r.label} title={r.title} desc={r.desc} />
                ))}
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
