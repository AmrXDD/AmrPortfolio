"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { useLang } from "@/lib/i18n";

export type LegalBlock = string | { list: string[] };
export type LegalDoc = {
  title: string;
  intro: string[];
  sections: { h: string; body: LegalBlock[] }[];
};

/*
 * Renders a policy in the visitor's language. Both languages ship to the
 * client so the language toggle switches the document instantly.
 */
export function LegalPage({
  doc,
  updated,
  other,
}: {
  doc: { en: LegalDoc; ar: LegalDoc };
  updated: { en: string; ar: string };
  other: { href: string; label: { en: string; ar: string } };
}) {
  const { lang, toggle, t } = useLang();
  const d = doc[lang];
  const ar = lang === "ar";

  return (
    <div className="min-h-screen bg-ink text-bone">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" dir="ltr" className="flex items-center gap-2.5" aria-label={ar ? "الرئيسية" : "Home"}>
            <Logo size={22} />
            <span className="text-mono text-[11px] uppercase tracking-[0.24em]">Amr/studio</span>
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label={t("lang.label")}
            lang={ar ? "en" : "ar"}
            className="rounded-full border border-line px-3 py-1.5 text-[13px] text-bone/75 transition-colors hover:border-bone/40 hover:text-bone"
          >
            {ar ? "English" : "العربية"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-28 pt-14 md:pt-20">
        <p className="eyebrow">{ar ? `آخر تحديث: ${updated.ar}` : `Last updated: ${updated.en}`}</p>
        <h1 className="mt-4 text-display text-[clamp(2rem,5vw,3.25rem)] leading-tight">{d.title}</h1>
        <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-bone/80">
          {d.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {d.sections.map((s) => (
          <section key={s.h} className="mt-12 border-t border-line pt-8">
            <h2 className="text-display text-[clamp(1.2rem,2.4vw,1.6rem)] leading-snug">{s.h}</h2>
            <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-bone/75">
              {s.body.map((b, i) =>
                typeof b === "string" ? (
                  <p key={i}>{b}</p>
                ) : (
                  <ul key={i} className="space-y-2 ps-5">
                    {b.list.map((li) => (
                      <li key={li} className="list-disc marker:text-accent">
                        {li}
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </section>
        ))}

        <div className="mt-16 flex flex-wrap gap-6 border-t border-line pt-8 text-sm">
          <Link href="/" className="link-underline text-bone/80">
            {ar ? "العودة إلى الموقع" : "Back to the site"}
          </Link>
          <Link href={other.href} className="link-underline text-bone/80">
            {other.label[lang]}
          </Link>
        </div>
      </main>
    </div>
  );
}
