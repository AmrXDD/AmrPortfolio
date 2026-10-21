"use client";

import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { useRef } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { BorderGlow } from "@/components/ui/border-glow";
import { Magnetic } from "@/components/ui/magnetic";
import { EmailCTA } from "@/components/ui/wa-cta";
import { Btn } from "@/components/ui/btn";
import { StudioClocks } from "@/components/ui/studio-clocks";
import { BookingCalendar } from "@/components/sections/booking-calendar";
import { CAL_URL, openBooking, warmBooking } from "@/lib/cal";
import { ContactForm } from "@/components/sections/contact-form";
import { useCopy, useLang } from "@/lib/i18n";
import { SITE, SITE_AR, waLink } from "@/lib/constants";

const COPY = {
  en: {
    engagement: "Engagement",
    engagementBody:
      "Websites built from zero, web design and consultation, and brand identities, for founders and studios who want the one site that earns them their next client.",
    workingFrom: "Working from",
    city: SITE.city as string,
    zone: "GMT+3 · Worldwide",
    openWa: "WhatsApp",
    waMsg: "Hey Amr, saw your portfolio. Want to talk about a project.",
    ring: "Book a call · Pick a time · Book a call · Pick a time · ",
    book: "Book a call",
    bookTitle: "Talk it through, face to face.",
    bookBody: "Pick a time on my calendar. It opens right here, in your own time zone.",
    overlap: "Where the day is",
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
    openWa: "واتساب",
    waMsg: "مرحبًا عمرو، شاهدت أعمالك وأرغب في الحديث عن مشروع.",
    ring: "احجز مكالمة   ·   اختر موعدًا   ·   احجز مكالمة   ·   اختر موعدًا   ·   ",
    book: "احجز مكالمة",
    bookTitle: "لنتحدّث عنه وجهًا لوجه.",
    bookBody: "اختر موعدًا من تقويمي. يفتح هنا مباشرةً، وبتوقيتك المحلي.",
    overlap: "الساعة الآن في",
    rows: [
      { label: "01 · تطوير المواقع", title: "ابنِ شيئًا من الصفر.", desc: "مواقع تعريفية ومواقع منتجات وتطبيقات ويب، يصمّمها ويبرمجها شخص واحد من أول سطر حتى الإطلاق." },
      { label: "02 · التصميم والاستشارات", title: "عين خبيرة ثانية.", desc: "توجيه تصميمي، وتدقيق لتجربة المستخدم والأداء، وإجابات واضحة عن التقنيات والبنية قبل أن تنفق على التنفيذ." },
      { label: "03 · الهوية البصرية", title: "امنحه وجهًا.", desc: "الشعار وأنظمة العلامة والخطوط والألوان ودليل الهوية، مصمّمة لتنتقل من الموقع إلى كل ما سواه." },
    ],
  },
};

const EASE = [0.19, 1, 0.22, 1] as const;

/*
 * Contact · the last word. The headline is set as big as the page allows and
 * slides together line by line as you arrive; an ember seal with the ask
 * running round its rim sits in the gap and leans toward the cursor; a
 * soft spotlight follows the pointer across the whole section. The form and
 * the three ways in sit underneath, unchanged in what they do.
 */

function Seal({ ring, href, label, ar }: { ring: string; href: string; label: string; ar: boolean }) {
  return (
    <Magnetic strength={0.35}>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={label}
        data-cursor="link"
        data-cursor-label={ar ? "احجز" : "Book"}
        onPointerEnter={warmBooking}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          if (openBooking()) e.preventDefault();
        }}
        className="group relative flex h-[150px] w-[150px] items-center justify-center rounded-full bg-accent text-ink shadow-[0_30px_80px_-20px_rgba(255,77,31,0.65)] transition-transform duration-500 hover:scale-[1.08] md:h-[210px] md:w-[210px]"
      >
        {/* laid out LTR along the path: the bidi pass still orders each Arabic run right-to-left */}
        <svg viewBox="0 0 200 200" style={{ direction: "ltr" }} className="absolute inset-0 h-full w-full animate-[spin_16s_linear_infinite] group-hover:animate-[spin_6s_linear_infinite]" aria-hidden>
          <defs>
            <path id="seal-ring" d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0" />
          </defs>
          <text className={ar ? "fill-ink" : "fill-ink text-mono"} style={ar ? { fontSize: 15, fontFamily: "var(--font-ar-sans), sans-serif", fontWeight: 600 } : { fontSize: 13.5, letterSpacing: "0.18em", textTransform: "uppercase" }}>
            <textPath href="#seal-ring">{ring}</textPath>
          </text>
        </svg>
        <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-ink text-accent transition-transform duration-500 group-hover:rotate-45 md:h-16 md:w-16">
          <ArrowUpRight size={26} className="rtl:-scale-x-100" />
        </span>
      </a>
    </Magnetic>
  );
}

export function CTA() {
  const { t, lang } = useLang();
  const c = useCopy(COPY);
  const ref = useRef<HTMLElement>(null);
  const ar = lang === "ar";

  // the headline lines slide together as the section arrives
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.15"] });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const dir = ar ? -1 : 1;
  const x1 = useTransform(p, [0, 1], [`${-14 * dir}%`, "0%"]);
  const x2 = useTransform(p, [0, 1], [`${18 * dir}%`, "0%"]);
  const x3 = useTransform(p, [0, 1], [`${-10 * dir}%`, "0%"]);
  const sealR = useTransform(p, [0, 1], [-140, 0]);

  // pointer spotlight
  const mx = useMotionValue(-1000);
  const my = useMotionValue(-1000);
  const sx = useSpring(mx, { stiffness: 120, damping: 22 });
  const sy = useSpring(my, { stiffness: 120, damping: 22 });

  const line = (text: string, x: typeof x1, cls: string, d: number) => (
    <motion.span style={{ x }} className="block will-change-transform">
      <span className="block overflow-hidden pb-[0.08em]">
        <motion.span
          initial={{ y: "105%" }}
          whileInView={{ y: "0%" }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.1, ease: EASE, delay: d }}
          className={`block whitespace-nowrap ${cls}`}
        >
          {text}
        </motion.span>
      </span>
    </motion.span>
  );

  return (
    <section
      id="contact"
      ref={ref}
      onPointerMove={(e) => {
        if (e.pointerType === "touch") return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
      className="relative overflow-hidden border-b border-line bg-ink px-5 py-32 md:px-10 md:py-44"
    >
      {/* moved by transform only, so following the pointer never repaints */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 -ml-[520px] -mt-[520px] h-[1040px] w-[1040px] rounded-full bg-[radial-gradient(circle,rgba(255,77,31,0.16),transparent_60%)] will-change-transform"
        style={{ x: sx, y: sy }}
      />
      {/* a static ember haze, cheap (no animated blur) */}
      <div aria-hidden className="pointer-events-none absolute -start-[20vw] top-[8%] h-[60vw] w-[60vw] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.16),transparent_62%)]" />
      <div aria-hidden className="pointer-events-none absolute -end-[18vw] top-[30%] h-[50vw] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(255,77,31,0.12),transparent_62%)]" />

      <div className="relative mx-auto max-w-[1600px]">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Eyebrow index="12">{t("contact.eyebrow")}</Eyebrow>
          <p className="text-mono text-[11px] uppercase tracking-[0.22em] text-bone/50">
            {c.workingFrom} <span className="text-bone">{c.city}</span> · <span dir="ltr">{c.zone}</span>
          </p>
        </div>

        {/* the headline + the seal */}
        <div className="relative mt-14 md:mt-20">
          <h2 key={lang} className="text-display text-[clamp(2.2rem,11vw,14rem)] leading-[0.92] text-bone rtl:leading-[1.3] md:text-[clamp(3rem,12.5vw,14rem)]">
            {line(t("contact.h1"), x1, "", 0)}
            {line(t("contact.h2"), x2, "italic text-bone/85 md:ps-[18vw]", 0.08)}
            {line(t("contact.h3"), x3, "text-accent", 0.16)}
          </h2>
          <motion.div style={{ rotate: sealR }} className="mt-10 md:absolute md:end-[2vw] md:top-[28%] md:mt-0">
            <Seal ring={c.ring} href={CAL_URL} label={c.book} ar={ar} />
          </motion.div>
        </div>

        <div className="mt-16 grid grid-cols-12 gap-y-10 border-t border-line pt-12 md:mt-24">
          <Reveal className="col-span-12 md:col-span-5">
            <p className="text-mono text-[11px] uppercase tracking-[0.22em] text-bone/50">{c.engagement}</p>
            <ScrollReveal key={lang} className="mt-3 max-w-md text-sm leading-relaxed text-bone/90" text={c.engagementBody} />
          </Reveal>

          {/* the booking desk: the call, the clocks, the other ways in */}
          <Reveal className="col-span-12 md:col-span-6 md:col-start-7">
            <div className="relative overflow-hidden rounded-[28px] border border-line bg-ash/40 p-6 md:p-8">
              <div aria-hidden className="pointer-events-none absolute -end-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,77,31,0.22),transparent_65%)]" />
              <p className="text-display text-[clamp(1.5rem,5.4vw,2.4rem)] leading-tight text-bone">{c.bookTitle}</p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-bone/65">{c.bookBody}</p>
              <p className="mt-7 text-mono text-[10px] uppercase tracking-[0.22em] text-bone/45">{c.overlap}</p>
              <StudioClocks ar={ar} className="mt-3" />
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Btn href="#book" variant="ember" icon={<CalendarDays size={16} strokeWidth={1.8} />} cursorLabel={ar ? "احجز" : "Book"}>
                  {c.book}
                </Btn>
                <Btn href={waLink(c.waMsg)} target="_blank" rel="noreferrer" variant="ghost" cursorLabel="WhatsApp">
                  {c.openWa}
                </Btn>
              </div>
              <EmailCTA className="mt-6 inline-block text-bone/70" />
            </div>
          </Reveal>
        </div>

        {/* the calendar itself: book a call without leaving the page */}
        <div className="mt-14 md:mt-20">
          <BookingCalendar />
        </div>

        {/* Inquiry form — budget · service · reason → Supabase + Resend */}
        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <ContactForm />
          <div className="grid gap-4 self-start">
            {c.rows.map((r, i) => (
              <motion.div
                key={r.label}
                initial={{ opacity: 0, x: ar ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ duration: 0.9, ease: EASE, delay: i * 0.1 }}
              >
                <ContactRow label={r.label} title={r.title} desc={r.desc} />
              </motion.div>
            ))}
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
        <p className="mt-4 text-display text-[clamp(1.25rem,2vw,1.75rem)] leading-tight text-bone">{title}</p>
        <p className="mt-3 text-sm leading-relaxed text-bone/65">{desc}</p>
      </div>
    </BorderGlow>
  );
}
