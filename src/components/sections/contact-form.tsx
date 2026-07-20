"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { ArrowUpRight } from "lucide-react";

type Status = "idle" | "sending" | "sent" | "error";

const BUDGETS = ["< $2k", "$2k – $5k", "$5k – $10k", "$10k – $25k", "$25k+"];

export function ContactForm() {
  const { t, lang } = useLang();
  const [status, setStatus] = useState<Status>("idle");
  const [service, setService] = useState("dev");
  const [budget, setBudget] = useState(BUDGETS[1]);

  const services = [
    { id: "dev", label: t("form.serviceDev") },
    { id: "smma", label: t("form.serviceSmma") },
    { id: "brand", label: t("form.serviceBrand") },
    { id: "other", label: t("form.serviceOther") },
  ];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      service,
      service_label: services.find((s) => s.id === service)?.label ?? service,
      budget,
      reason: String(fd.get("reason") || ""),
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
          <input name="name" required autoComplete="name" className={field} placeholder="—" />
        </label>
        <label className="grid gap-2">
          <span className="text-mono text-[10px] uppercase tracking-[0.2em] text-bone/50">{t("form.email")}</span>
          <input name="email" type="email" required autoComplete="email" className={field} placeholder="you@studio.com" />
        </label>
      </div>

      {/* Service — the thing asked for (Development / SMMA / …) */}
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
        <span className="text-mono text-[10px] uppercase tracking-[0.2em] text-bone/50">{t("form.budget")}</span>
        <div className="flex flex-wrap gap-2">
          {BUDGETS.map((b) => (
            <button
              key={b}
              type="button"
              data-cursor="link"
              onClick={() => setBudget(b)}
              className={`rounded-full border px-4 py-2 text-[12px] tabular-nums transition-colors ${
                budget === b
                  ? "border-accent bg-accent/15 text-bone"
                  : "border-line bg-ink/30 text-bone/70 hover:border-bone/40 hover:text-bone"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Reason for inquiry / details */}
      <label className="grid gap-2">
        <span className="text-mono text-[10px] uppercase tracking-[0.2em] text-bone/50">{t("form.reason")}</span>
        <textarea name="reason" rows={4} required className={`${field} resize-none`} placeholder="—" />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          data-cursor="link"
          disabled={status === "sending"}
          className="btn-solid !px-6 disabled:opacity-60"
        >
          {status === "sending" ? t("form.sending") : t("form.send")}
          <ArrowUpRight size={14} />
        </button>
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
