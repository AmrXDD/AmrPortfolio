"use client";

import { useState } from "react";
import Link from "next/link";
import { useBudgets, useLang } from "@/lib/i18n";
import { CurrencyPicker } from "@/components/ui/currency-picker";
import { Btn } from "@/components/ui/btn";

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const { t, lang, currency } = useLang();
  const [status, setStatus] = useState<Status>("idle");
  const [service, setService] = useState("dev");
  // Brackets are in the visitor's currency; the id survives a language toggle.
  const budgets = useBudgets();
  const [budgetId, setBudgetId] = useState("b2");
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);

  const services = [
    { id: "dev", label: t("form.serviceDev") },
    { id: "design", label: t("form.serviceDesign") },
    { id: "brand", label: t("form.serviceBrand") },
    { id: "other", label: t("form.serviceOther") },
  ];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    if (!consent) {
      setConsentError(true);
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);
    const bracket = budgets.find((b) => b.id === budgetId) ?? budgets[1];
    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      service,
      service_label: services.find((s) => s.id === service)?.label ?? service,
      // Local figure for the reply, USD alongside so leads stay comparable.
      budget: currency === "USD" ? bracket.label : `${bracket.label} (≈ ${bracket.usd})`,
      reason: String(fd.get("reason") || ""),
      locale: lang,
      consent: true,
    };
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("bad status");
      setStatus("sent");
      form.reset();
      setConsent(false);
    } catch {
      setStatus("error");
    }
  }

  const field =
    "w-full rounded-xl border border-line bg-ink/40 px-4 py-3 text-sm text-bone placeholder:text-bone/35 outline-none transition-colors focus:border-bone/40";

  return (
    <form onSubmit={onSubmit} dir={lang === "ar" ? "rtl" : "ltr"} className="grid gap-4">
      <p className="text-display text-[clamp(1.25rem,2vw,1.75rem)] leading-tight text-bone">
        {t("form.title")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-mono text-[10px] uppercase tracking-[0.2em] text-bone/50">{t("form.name")}</span>
          <input name="name" required autoComplete="name" className={field} placeholder={t("form.namePh")} />
        </label>
        <label className="grid gap-2">
          <span className="text-mono text-[10px] uppercase tracking-[0.2em] text-bone/50">{t("form.email")}</span>
          <input name="email" type="email" required autoComplete="email" dir="ltr" className={`${field} rtl:text-right`} placeholder={t("form.emailPh")} />
        </label>
      </div>

      {/* Service — the thing asked for (Development / Design / Brand / …) */}
      <div className="grid gap-2">
        <span className="text-mono text-[10px] uppercase tracking-[0.2em] text-bone/50">{t("form.service")}</span>
        <div className="flex flex-wrap gap-2">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              data-cursor="link"
              onClick={() => setService(s.id)}
              className={`rounded-full border px-4 py-2 text-[12px] transition-colors ${
                service === s.id
                  ? "border-bone bg-bone text-ink"
                  : "border-line bg-ink/30 text-bone/70 hover:border-bone/40 hover:text-bone"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-mono text-[10px] uppercase tracking-[0.2em] text-bone/50">{t("form.budget")}</span>
          <CurrencyPicker />
        </div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("form.budget")}>
          {budgets.map((b) => (
            <button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={budgetId === b.id}
              data-cursor="link"
              onClick={() => setBudgetId(b.id)}
              className={`rounded-full border px-4 py-2 text-[12px] tabular-nums transition-colors ${
                budgetId === b.id
                  ? "border-accent bg-accent/15 text-bone"
                  : "border-line bg-ink/30 text-bone/70 hover:border-bone/40 hover:text-bone"
              }`}
            >
              {/* server and browser ICU can differ on compact figures */}
              <span suppressHydrationWarning>{b.label}</span>
            </button>
          ))}
        </div>
        {currency !== "USD" ? (
          <span className="text-[11px] text-bone/40">{t("form.budgetNote")}</span>
        ) : null}
      </div>

      {/* Reason for inquiry / details */}
      <label className="grid gap-2">
        <span className="text-mono text-[10px] uppercase tracking-[0.2em] text-bone/50">{t("form.reason")}</span>
        <textarea name="reason" rows={4} required className={`${field} resize-none`} placeholder={t("form.reasonPh")} />
      </label>

      {/* Consent — required before anything is stored (see /privacy) */}
      <label className="flex items-start gap-3 text-[12px] leading-relaxed text-bone/65">
        <input
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (e.target.checked) setConsentError(false);
          }}
          aria-invalid={consentError}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#FF4D1F]"
        />
        <span>
          {t("form.consentPre")}{" "}
          <Link href="/privacy" target="_blank" data-cursor="link" className="link-underline text-bone">
            {t("form.consentLink")}
          </Link>
          .
        </span>
      </label>
      {consentError ? <span className="-mt-2 text-[12px] text-accent">{t("form.consentRequired")}</span> : null}

      <div className="flex flex-wrap items-center gap-4">
        <Btn type="submit" variant="solid" disabled={status === "sending"}>
          {status === "sending" ? t("form.sending") : t("form.send")}
        </Btn>
        {status === "sent" ? (
          <span className="text-sm text-emerald-400">{t("form.success")}</span>
        ) : null}
        {status === "error" ? (
          <span className="text-sm text-accent">{t("form.error")}</span>
        ) : null}
      </div>
    </form>
  );
}
