"use client";

import { OptionWheel } from "@/components/ui/option-wheel";
import { GradualBlur } from "@/components/ui/gradual-blur";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealWords } from "@/components/ui/reveal";
import { useTheme } from "@/components/providers/theme-provider";
import { CLICK_SOUND } from "@/lib/constants";
import { useCopy, useLang } from "@/lib/i18n";

const COPY = {
  en: {
    eyebrow: "Sound · Interaction",
    h1: "Spin the",
    h2: "dial.",
    p: "Drag, scroll, or arrow through the wheel. The soft click you hear is the very same tick wired into every interactive element across the site, motion and sound treated as one material.",
    genres: ["Ambient", "House", "Techno", "Jazz", "Lo Fi", "Synthwave"],
  },
  ar: {
    eyebrow: "الصوت · التفاعل",
    h1: "أدِر",
    h2: "القرص.",
    p: "اسحب أو مرّر أو استخدم الأسهم لتدوير العجلة. النقرة الهادئة التي تسمعها هي نفسها المربوطة بكل عنصر تفاعلي في الموقع؛ الحركة والصوت مادة واحدة.",
    genres: ["أمبيانت", "هاوس", "تكنو", "جاز", "لو-فاي", "سينث ويف"],
  },
};

export function SoundStudio() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const c = useCopy(COPY);
  const { lang } = useLang();
  return (
    <section className="relative overflow-hidden border-b border-line bg-ink px-5 py-24 md:px-10 md:py-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 md:grid-cols-2">
        <div>
          <Eyebrow index="A3">{c.eyebrow}</Eyebrow>
          <h2 key={lang} className="mt-6 text-display size-h2 text-bone">
            <RevealWords text={c.h1} />{" "}
            <span className="italic text-accent">
              <RevealWords text={c.h2} delay={0.1} />
            </span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-bone/65">{c.p}</p>
        </div>

        {/* The wheel, with a progressive blur fading its top & bottom edges */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl border border-line bg-ash/30">
            <OptionWheel
              key={lang}
              items={c.genres}
              defaultSelected={2}
              textColor={isLight ? "rgba(17,17,17,0.32)" : "rgba(245,245,245,0.35)"}
              activeColor={isLight ? "#111111" : "#f5f5f5"}
              side="center"
              fontSize={2.6}
              spacing={1.2}
              tilt={0}
              blur={2}
              fade={0.28}
              smoothing={200}
              inset={24}
              loop={false}
              draggable
              soundUrl={CLICK_SOUND}
              soundVolume={0.5}
            />
            {/* centred selection guide lines */}
            <div className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-[1.6rem] border-t border-bone/15" />
            <div className="pointer-events-none absolute inset-x-6 top-1/2 translate-y-[1.6rem] border-t border-bone/15" />

            <GradualBlur position="top" height="5rem" strength={2} divCount={5} curve="bezier" exponential opacity={1} />
            <GradualBlur position="bottom" height="5rem" strength={2} divCount={5} curve="bezier" exponential opacity={1} />
          </div>
        </div>
      </div>
    </section>
  );
}
