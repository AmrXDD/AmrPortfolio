"use client";

import { LogoLoop, type LogoItem } from "@/components/ui/logo-loop";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useLang } from "@/lib/i18n";
import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
  SiThreedotjs,
  SiFramer,
  SiGreensock,
  SiVercel,
  SiJavascript,
} from "react-icons/si";

const techLogos: LogoItem[] = [
  { node: <SiReact />, title: "React", href: "https://react.dev" },
  { node: <SiNextdotjs />, title: "Next.js", href: "https://nextjs.org" },
  { node: <SiTypescript />, title: "TypeScript", href: "https://www.typescriptlang.org" },
  { node: <SiTailwindcss />, title: "Tailwind CSS", href: "https://tailwindcss.com" },
  { node: <SiThreedotjs />, title: "Three.js", href: "https://threejs.org" },
  { node: <SiFramer />, title: "Framer Motion", href: "https://www.framer.com/motion/" },
  { node: <SiGreensock />, title: "GSAP", href: "https://gsap.com" },
  { node: <SiJavascript />, title: "JavaScript", href: "https://developer.mozilla.org/docs/Web/JavaScript" },
  { node: <SiVercel />, title: "Vercel", href: "https://vercel.com" },
];

export function TechLoop() {
  const { lang } = useLang();
  return (
    <section className="relative border-b border-line px-5 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Eyebrow index="✦">{lang === "ar" ? "مبني باستخدام" : "Built with"}</Eyebrow>
          {/* the colophon that used to sit in the footer bar */}
          <p className="text-mono text-[10px] uppercase tracking-[0.22em] text-bone/45">
            {lang === "ar" ? "هذا الموقع" : "This site"} · <span dir="ltr">Next.js 16 · TS · Tailwind · WebGL · Framer Motion</span>
          </p>
        </div>
        <div dir="ltr" className="relative mt-8" style={{ height: 72 }}>
          <LogoLoop
            logos={techLogos}
            speed={90}
            direction="left"
            logoHeight={40}
            gap={64}
            hoverSpeed={20}
            scaleOnHover
            fadeOut
            ariaLabel={lang === "ar" ? "التقنيات المستخدمة" : "Technology stack"}
          />
        </div>
      </div>
    </section>
  );
}
