"use client";

/*
 * Lightweight language layer: flips the document to Arabic RTL and translates
 * the UI chrome (nav, buttons, section labels). Long-form editorial copy stays
 * in English unless an Arabic string is supplied here.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Lang = "en" | "ar";

type Dict = Record<string, { en: string; ar: string }>;

// UI-label dictionary. Add keys here to translate more of the chrome.
export const STRINGS: Dict = {
  "nav.home": { en: "Home", ar: "الرئيسية" },
  "nav.work": { en: "Work", ar: "الأعمال" },
  "nav.craft": { en: "Craft", ar: "الحِرفة" },
  "nav.services": { en: "Services", ar: "الخدمات" },
  "nav.process": { en: "Process", ar: "المنهجية" },
  "nav.contact": { en: "Contact", ar: "تواصل" },

  "cta.selectedWork": { en: "Selected work", ar: "أعمال مختارة" },
  "cta.startProject": { en: "Start a project", ar: "ابدأ مشروعًا" },
  "cta.hire": { en: "Hire", ar: "وظّفني" },
  "cta.liveProject": { en: "Live Project", ar: "مشروع مباشر" },
  "cta.previewBuild": { en: "Preview Build", ar: "معاينة" },
  "cta.visitLive": { en: "Visit live site", ar: "زيارة الموقع" },
  "cta.previewBuild2": { en: "Preview build", ar: "معاينة النسخة" },

  "lang.toggle": { en: "AR", ar: "EN" },
  "lang.label": { en: "Arabic", ar: "English" },

  "hero.available": { en: "Available · Q3 2026 · Selectively", ar: "متاح · الربع الثالث 2026 · بشكل انتقائي" },
  "hero.line1": { en: "Cinematic interfaces", ar: "واجهات سينمائية" },
  "hero.line2": { en: "engineered with", ar: "مصممة بدقة" },
  "hero.line3": { en: "precision.", ar: "متناهية." },
  "hero.subtitle": {
    en: "I design and engineer products that feel like culture, not software — studios trust me with the hero moments.",
    ar: "أصمّم وأبني منتجات تُحسّ كثقافة لا كبرمجيات — تأتمنني الاستوديوهات على أهم اللحظات.",
  },

  "work.eyebrow": { en: "Selected Work", ar: "أعمال مختارة" },
  "work.h1": { en: "Recent", ar: "أحدث" },
  "work.h2": { en: "proofs", ar: "البراهين" },
  "work.h3": { en: "of practice.", ar: "على الممارسة." },
  "work.intro": {
    en: "Four recent engagements — one flagship, two shipped, one in the kiln. The cards stack as you scroll; each opens the live site.",
    ar: "أربعة مشاريع حديثة — واحد رئيسي، اثنان مُطلقان، وواحد قيد التطوير. تتراكم البطاقات أثناء التمرير، وكل منها يفتح الموقع المباشر.",
  },

  "contact.eyebrow": { en: "Contact", ar: "تواصل" },
  "contact.h1": { en: "Let's build", ar: "لنبنِ" },
  "contact.h2": { en: "something", ar: "شيئًا" },
  "contact.h3": { en: "unforgettable.", ar: "لا يُنسى." },

  "form.title": { en: "Start an inquiry", ar: "ابدأ استفسارًا" },
  "form.name": { en: "Name", ar: "الاسم" },
  "form.email": { en: "Email", ar: "البريد الإلكتروني" },
  "form.service": { en: "What do you need?", ar: "ما الذي تحتاجه؟" },
  "form.serviceDev": { en: "Web / Product Development", ar: "تطوير الويب / المنتجات" },
  "form.serviceSmma": { en: "Social Media Marketing (SMMA)", ar: "تسويق عبر السوشيال ميديا" },
  "form.serviceBrand": { en: "Brand & Design", ar: "الهوية والتصميم" },
  "form.serviceOther": { en: "Something else", ar: "شيء آخر" },
  "form.budget": { en: "Budget", ar: "الميزانية" },
  "form.reason": { en: "Reason for inquiry / details", ar: "سبب الاستفسار / التفاصيل" },
  "form.send": { en: "Send inquiry", ar: "إرسال الاستفسار" },
  "form.sending": { en: "Sending…", ar: "جارٍ الإرسال…" },
  "form.success": { en: "Thanks — your inquiry is in. I'll reply shortly.", ar: "شكرًا — تم استلام استفسارك. سأرد قريبًا." },
  "form.error": { en: "Something went wrong. Try again or use WhatsApp.", ar: "حدث خطأ ما. حاول مجددًا أو استخدم واتساب." },
};

export function t(key: string, lang: Lang): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[lang] || entry.en;
}

const LangContext = createContext<{
  lang: Lang;
  dir: "ltr" | "rtl";
  toggle: () => void;
  t: (key: string) => string;
}>({
  lang: "en",
  dir: "ltr",
  toggle: () => {},
  t: (k) => k,
});

function apply(lang: Lang) {
  const el = document.documentElement;
  el.lang = lang;
  el.dir = lang === "ar" ? "rtl" : "ltr";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    let initial: Lang = "en";
    try {
      const saved = localStorage.getItem("lang") as Lang | null;
      if (saved === "ar" || saved === "en") initial = saved;
    } catch {}
    setLang(initial);
    apply(initial);
  }, []);

  const toggle = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === "en" ? "ar" : "en";
      apply(next);
      try {
        localStorage.setItem("lang", next);
      } catch {}
      return next;
    });
  }, []);

  return (
    <LangContext.Provider
      value={{ lang, dir: lang === "ar" ? "rtl" : "ltr", toggle, t: (k) => t(k, lang) }}
    >
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
