import type { Metadata } from "next";
import { LegalPage } from "../legal-doc";
import { TERMS, UPDATED } from "./content";
import { visitorLocale } from "@/lib/locale-server";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await visitorLocale();
  return {
    title: TERMS[lang].title,
    description: lang === "ar" ? "شروط استخدام موقع Amr Studio." : "The terms for using the Amr Studio website.",
    alternates: { canonical: "/terms" },
  };
}

export default function TermsPage() {
  return (
    <LegalPage
      doc={TERMS}
      updated={UPDATED}
      other={{ href: "/privacy", label: { en: "Privacy Policy", ar: "سياسة الخصوصية" } }}
    />
  );
}
