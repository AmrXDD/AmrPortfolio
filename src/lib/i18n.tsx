"use client";

/*
 * Language layer. The server decides the starting language from the visitor's
 * location (src/proxy.ts) and renders <html lang dir> to match, so this
 * provider only has to carry it and handle the manual toggle.
 *
 * Short UI labels live in STRINGS below; each section keeps its own longer copy
 * next to its markup as { en, ar } objects read through useCopy().
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import {
  CURRENCY_COOKIE,
  FALLBACK_RATES,
  LANG_COOKIE,
  budgetBrackets,
  type CurrencyCode,
  type Lang,
  type Rates,
} from "./locale";

export type { Lang };
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
  "cta.hire": { en: "Hire", ar: "اعمل معي" },
  "cta.liveProject": { en: "Live Project", ar: "مشروع مباشر" },
  "cta.previewBuild": { en: "Preview Build", ar: "معاينة" },
  "cta.visitLive": { en: "Visit live site", ar: "زيارة الموقع" },
  "cta.previewBuild2": { en: "Preview build", ar: "معاينة النسخة" },

  "lang.toggle": { en: "ع", ar: "EN" },
  "lang.label": { en: "التبديل إلى العربية", ar: "Switch to English" },

  "hero.available": { en: "Available · Q4 2026 · Selectively", ar: "متاح · الربع الرابع 2026 · بعدد محدود" },
  "hero.line1": { en: "Cinematic interfaces", ar: "واجهات سينمائية" },
  "hero.line2": { en: "engineered with", ar: "مصممة بدقة" },
  "hero.line3": { en: "precision.", ar: "متناهية." },
  "hero.subtitle": {
    en: "I design and engineer products that feel like culture, not software. Studios trust me with the hero moments.",
    ar: "أصمّم وأبني منتجات تُحسّ كثقافة لا كبرمجيات — تأتمنني الاستوديوهات على أهم اللحظات.",
  },

  "work.eyebrow": { en: "Selected Work", ar: "أعمال مختارة" },
  "work.h1": { en: "Recent", ar: "أحدث" },
  "work.h2": { en: "proofs", ar: "البراهين" },
  "work.h3": { en: "of practice.", ar: "على الممارسة." },
  "work.intro": {
    en: "Four recent engagements, one flagship, two shipped, one in the kiln. The cards stack as you scroll; each opens the live site.",
    ar: "أربعة مشاريع حديثة — واحد رئيسي، اثنان مُطلقان، وواحد قيد التطوير. تتراكم البطاقات أثناء التمرير، وكل منها يفتح الموقع المباشر.",
  },

  "work.introMobile": {
    en: "Four recent engagements. Each card opens the live site.",
    ar: "أربعة مشاريع حديثة. كل بطاقة تفتح الموقع المباشر.",
  },

  "contact.eyebrow": { en: "Contact", ar: "تواصل" },
  "contact.h1": { en: "Let's build", ar: "لنبنِ" },
  "contact.h2": { en: "something", ar: "شيئًا" },
  "contact.h3": { en: "unforgettable.", ar: "لا يُنسى." },

  "form.title": { en: "Start an inquiry", ar: "ابدأ استفسارًا" },
  "form.name": { en: "Name", ar: "الاسم" },
  "form.email": { en: "Email", ar: "البريد الإلكتروني" },
  "form.service": { en: "What do you need?", ar: "ما الذي تحتاجه؟" },
  "form.serviceDev": { en: "Web Development", ar: "تطوير المواقع" },
  "form.serviceDesign": { en: "Web Design & Consultation", ar: "تصميم المواقع والاستشارات" },
  "form.serviceBrand": { en: "Brand Identity Design", ar: "تصميم الهوية البصرية" },
  "form.serviceOther": { en: "Something else", ar: "شيء آخر" },
  "form.budget": { en: "Budget", ar: "الميزانية" },
  "form.reason": { en: "Reason for inquiry / details", ar: "سبب الاستفسار / التفاصيل" },
  "form.send": { en: "Send inquiry", ar: "إرسال الاستفسار" },
  "form.sending": { en: "Sending…", ar: "جارٍ الإرسال…" },
  "form.success": { en: "Thanks, your inquiry is in. I'll reply shortly.", ar: "شكرًا، تم استلام استفسارك. سأرد قريبًا." },
  "form.error": { en: "Something went wrong. Try again or use WhatsApp.", ar: "حدث خطأ ما. حاول مجددًا أو راسلني على واتساب." },
  "form.namePh": { en: "Your name", ar: "اسمك" },
  "form.emailPh": { en: "you@studio.com", ar: "you@studio.com" },
  "form.reasonPh": { en: "Tell me what you're building", ar: "أخبرني عمّا تبنيه" },
  "form.budgetNote": { en: "Converted at today's rate and rounded, so approximate.", ar: "محوّلة بسعر صرف اليوم ومقرّبة، لذا فهي تقريبية." },
  "form.consentPre": { en: "I agree that Amr Studio may store this inquiry to reply to me, as described in the", ar: "أوافق على أن يحتفظ Amr Studio بهذا الاستفسار للرد عليّ، كما هو موضح في" },
  "form.consentLink": { en: "Privacy Policy", ar: "سياسة الخصوصية" },
  "form.consentRequired": { en: "Please tick the consent box to send.", ar: "يُرجى الموافقة على سياسة الخصوصية للإرسال." },

  "legal.privacy": { en: "Privacy", ar: "الخصوصية" },
  "legal.terms": { en: "Terms", ar: "الشروط" },
};

export function t(key: string, lang: Lang): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[lang] || entry.en;
}

type LangState = {
  lang: Lang;
  dir: "ltr" | "rtl";
  currency: CurrencyCode;
  rates: Rates;
  setCurrency: (code: CurrencyCode) => void;
  toggle: () => void;
  t: (key: string) => string;
};

const LangContext = createContext<LangState>({
  lang: "en",
  dir: "ltr",
  currency: "USD",
  rates: FALLBACK_RATES,
  setCurrency: () => {},
  toggle: () => {},
  t: (k) => k,
});

function apply(lang: Lang) {
  const el = document.documentElement;
  el.lang = lang;
  el.dir = lang === "ar" ? "rtl" : "ltr";
  try {
    // A year, like the proxy's cookie — the visitor's choice beats geo next time.
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  } catch {}
}

export function LanguageProvider({
  children,
  initialLang = "en",
  initialCurrency = "USD",
  rates = FALLBACK_RATES,
}: {
  children: React.ReactNode;
  initialLang?: Lang;
  initialCurrency?: CurrencyCode;
  rates?: Rates;
}) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [currency, setCurrencyState] = useState<CurrencyCode>(initialCurrency);

  // The visitor's pick beats the country default from now on.
  const setCurrency = useCallback(
    (code: CurrencyCode) => {
      if (!rates[code]) return;
      setCurrencyState(code);
      try {
        document.cookie = `${CURRENCY_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`;
      } catch {}
    },
    [rates]
  );

  const toggle = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === "en" ? "ar" : "en";
      apply(next);
      return next;
    });
  }, []);

  const value = useMemo<LangState>(
    () => ({ lang, dir: lang === "ar" ? "rtl" : "ltr", currency, rates, setCurrency, toggle, t: (k) => t(k, lang) }),
    [lang, currency, rates, setCurrency, toggle]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** Pick the active language's half of a { en, ar } copy object. */
export function useCopy<T>(copy: { en: T; ar: T }): T {
  return copy[useLang().lang];
}

/** Budget brackets in the visitor's currency and language. */
export function useBudgets() {
  const { currency, lang, rates } = useLang();
  return useMemo(() => budgetBrackets(currency, lang, rates), [currency, lang, rates]);
}
