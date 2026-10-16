"use client";

import { Eyebrow } from "@/components/ui/eyebrow";
import { RevealWords } from "@/components/ui/reveal";
import { ScrollStack, ScrollStackItem } from "@/components/ui/scroll-stack";
import { BorderGlow } from "@/components/ui/border-glow";
import { useCopy, useLang } from "@/lib/i18n";

const AR_CARDS = [
  {
    t: "شخص واحد من البداية للنهاية.",
    b: "الاستراتيجية والتصميم والحركة والبرمجة، بلا تسليم بين أقسام ولا رسائل تضيع في الطريق. من تشرح له المشروع هو من يسلّمه، ولا شيء يضيع بين أقسام غير موجودة أصلًا.",
  },
  {
    t: "حركة لها معنى.",
    b: "لا شيء يتحرّك على الشاشة بلا سبب. كل انتقال يوضّح تسلسلًا أو علاقة سبب ونتيجة أو عناية، ولا يكون زينة لمجرد الزينة. الحركة التي لا تستحق إطاراتها لا تُطلق.",
  },
  {
    t: "جاهز للإطلاق من اليوم الأول.",
    b: "جودة إنتاج من أول سطر برمجي: ميزانيات أداء، وإتاحة، وتحسين لمحركات البحث، وتحليلات مدمجة لا مُلحقة. التسليم مفتاح نشر، لا مجلد من الاحتمالات.",
  },
];

const CARDS = [
  {
    no: "01",
    t: "One pair of hands.",
    b: "Strategy, design, motion, and code, no hand offs, no telephone game. The person you brief is the person who ships, and nothing gets lost between departments that don't exist.",
    c: "#FF4D1F",
  },
  {
    no: "02",
    t: "Motion with meaning.",
    b: "Nothing on screen moves without a reason. Every transition communicates hierarchy, causality, or care, never decoration for its own sake. If an animation doesn't earn its frame budget, it doesn't ship.",
    c: "#FFB38A",
  },
  {
    no: "03",
    t: "Ship ready, day one.",
    b: "Production quality from the first commit, performance budgets, accessibility, SEO, and analytics built in, not bolted on. The handover is a deploy key, not a folder of maybes.",
    c: "#F5F5F5",
  },
];

export function Guarantees() {
  const { lang } = useLang();
  const c = useCopy({
    en: { eyebrow: "The Craft · In Writing", h1: "Three guarantees,", h2: "in writing." },
    ar: { eyebrow: "الحِرفة · مكتوبة", h1: "ثلاثة التزامات،", h2: "مكتوبة." },
  });
  const cards = lang === "ar" ? CARDS.map((card, i) => ({ ...card, ...AR_CARDS[i] })) : CARDS;
  return (
    <section className="relative border-b border-line px-5 py-24 md:px-10 md:py-36">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-12 md:mb-16">
          <Eyebrow index="A3">{c.eyebrow}</Eyebrow>
          <h2 key={lang} className="mt-6 text-display size-h2 text-bone">
            <RevealWords text={c.h1} />
            <br />
            <span className="italic text-accent">
              <RevealWords text={c.h2} delay={0.1} />
            </span>
          </h2>
        </div>

        <ScrollStack>
          {cards.map((card) => (
            <ScrollStackItem key={card.no}>
              <BorderGlow radius={32} colors={[card.c, "#FFB38A", "#F5F5F5"]} className="h-full">
                <div className="grid min-h-[48vh] grid-cols-1 items-start gap-6 p-8 md:grid-cols-[200px_1fr] md:gap-12 md:p-14">
                  <span className="text-display leading-none text-bone/90" style={{ fontSize: "clamp(3rem, 9vw, 7.5rem)" }}>
                    {card.no}
                  </span>
                  <div className="md:pt-4">
                    <span className="inline-block h-1 w-12 rounded-full" style={{ background: card.c }} />
                    <h3 className="mt-5 text-display leading-tight text-bone" style={{ fontSize: "clamp(1.6rem, 3.4vw, 3rem)" }}>
                      {card.t}
                    </h3>
                    <p className="mt-5 max-w-xl text-base leading-relaxed text-bone/70 md:text-lg">{card.b}</p>
                  </div>
                </div>
              </BorderGlow>
            </ScrollStackItem>
          ))}
        </ScrollStack>
      </div>
    </section>
  );
}
