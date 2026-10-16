import type { Metadata } from "next";
import { LegalPage } from "../legal-doc";
import { PRIVACY, UPDATED } from "./content";
import { visitorLocale } from "@/lib/locale-server";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await visitorLocale();
  return {
    title: PRIVACY[lang].title,
    description: lang === "ar" ? "كيف يجمع Amr Studio بياناتك ويستخدمها ويحميها." : "How Amr Studio collects, uses and protects your data.",
    alternates: { canonical: "/privacy" },
  };
}

export default function PrivacyPage() {
  return (
    <LegalPage
      doc={PRIVACY}
      updated={UPDATED}
      other={{ href: "/terms", label: { en: "Terms of Use", ar: "شروط الاستخدام" } }}
    />
  );
}
