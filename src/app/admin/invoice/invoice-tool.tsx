"use client";

import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/ui/logo";
import type { ContractRow } from "@/lib/supabase";
import {
  buildInvoice, parseMoney, fmtMoney, KIND_LABEL,
  type InvoiceData, type InvoiceKind, type InvoiceLine,
} from "./invoice-doc";
import { buildInvoicePdf } from "./invoice-pdf";

const CURRENCIES = ["USD", "KWD", "EUR", "GBP", "AED", "SAR", "EGP"];
const KINDS: InvoiceKind[] = ["deposit", "final", "full", "custom"];

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const field =
  "w-full rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-sm text-bone placeholder:text-bone/30 outline-none transition-colors focus:border-bone/40";
const lab = "text-mono text-[10px] uppercase tracking-[0.2em] text-bone/50";

function download(filename: string, bytes: Uint8Array) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const b64 = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

export function InvoiceTool() {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [contractId, setContractId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("AS-INV-0001");
  const [loading, setLoading] = useState(true);

  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [projectType, setProjectType] = useState("");
  const [websiteType, setWebsiteType] = useState("");
  const [contractRef, setContractRef] = useState("");
  const [contractTotal, setContractTotal] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [upfrontPercent, setUpfrontPercent] = useState("50");

  const [kind, setKind] = useState<InvoiceKind>("deposit");
  const [amount, setAmount] = useState("");
  const [customLines, setCustomLines] = useState("");
  const [issueDate, setIssueDate] = useState(today());
  const [dueDate, setDueDate] = useState(plusDays(7));
  const [paymentDetails, setPaymentDetails] = useState(
    "Bank transfer — account details on request.\nOr pay by link: send a message and I'll issue one."
  );
  const [notes, setNotes] = useState("");
  const [paid, setPaid] = useState(false);

  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);

  /* Load saved contracts + the number this invoice will take. */
  useEffect(() => {
    (async () => {
      try {
        const [c, i] = await Promise.all([
          fetch("/api/admin/contracts").then((r) => r.json()),
          fetch("/api/admin/invoices").then((r) => r.json()),
        ]);
        if (Array.isArray(c.contracts)) setContracts(c.contracts);
        if (i.nextNumber) setInvoiceNo(i.nextNumber);
        if (c.error || i.error) setError(c.error || i.error);
      } catch {
        setError("Could not reach the server. Is Supabase configured?");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* Selecting a contract fills everything this invoice needs from it. */
  function pickContract(id: string) {
    setContractId(id);
    setSaved(false);
    const c = contracts.find((x) => x.id === id);
    if (!c) return;
    setClientName(c.client_name || "");
    setCompanyName(c.company_name || "");
    setClientEmail(c.client_email || "");
    setProjectType(c.project_type || "");
    setWebsiteType(c.website_type || "");
    setContractRef(c.ref || "");
    setContractTotal(c.price || "");
    setCurrency(c.currency || "USD");
    setUpfrontPercent(c.upfront_percent || "50");
  }

  /* Amount follows the contract maths unless you're writing a custom one. */
  const computed = useMemo(() => {
    const total = parseMoney(contractTotal);
    const pct = parseMoney(upfrontPercent) || 0;
    const deposit = (total * pct) / 100;
    return { total, deposit, final: total - deposit };
  }, [contractTotal, upfrontPercent]);

  useEffect(() => {
    if (kind === "custom") return;
    const v =
      kind === "deposit" ? computed.deposit : kind === "final" ? computed.final : computed.total;
    setAmount(v ? fmtMoney(v) : "");
  }, [kind, computed]);

  const lines: InvoiceLine[] = useMemo(() => {
    if (kind === "custom") {
      return customLines
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const [label, amt = ""] = l.split("|").map((s) => s.trim());
          return { label, amount: amt };
        });
    }
    const what = [projectType, websiteType].filter(Boolean).join(" · ") || "Project";
    if (kind === "deposit")
      return [{ label: `${what} — ${upfrontPercent}% deposit upon signing`, amount: fmtMoney(computed.deposit) }];
    if (kind === "final")
      return [{ label: `${what} — final balance upon delivery`, amount: fmtMoney(computed.final) }];
    return [{ label: `${what} — full payment`, amount: fmtMoney(computed.total) }];
  }, [kind, customLines, projectType, websiteType, upfrontPercent, computed]);

  const collect = (): InvoiceData => ({
    invoiceNo,
    contractRef: contractRef.trim(),
    clientName: clientName.trim(),
    companyName: companyName.trim(),
    clientEmail: clientEmail.trim(),
    projectType: projectType.trim(),
    websiteType: websiteType.trim(),
    kind,
    amount: amount.trim(),
    currency,
    contractTotal: contractTotal.trim(),
    upfrontPercent: upfrontPercent.trim() || "50",
    issueDate,
    dueDate,
    lines,
    paymentDetails: paymentDetails.trim(),
    notes: notes.trim(),
    paid,
  });

  const slug = (s: string) =>
    (s || "client").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";

  function validate(d: InvoiceData) {
    if (!d.clientName || !d.amount) {
      setError("Pick a contract (or fill in the client name) and make sure the amount isn't empty.");
      return false;
    }
    setError("");
    return true;
  }

  /** Records the invoice so numbering stays sequential. Runs once per invoice. */
  async function persist(d: InvoiceData) {
    if (saved) return true;
    const res = await fetch("/api/admin/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractId: contractId || null,
        clientName: d.clientName,
        companyName: d.companyName,
        clientEmail: d.clientEmail,
        kind: d.kind,
        amount: d.amount,
        currency: d.currency,
        issueDate: d.issueDate,
        dueDate: d.dueDate,
        status: d.paid ? "paid" : "unpaid",
        lineItems: d.lines.map((l) => `${l.label} | ${l.amount}`),
        notes: d.notes,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Could not record the invoice");
    if (json.invoice?.invoice_no) setInvoiceNo(json.invoice.invoice_no);
    setSaved(true);
    return true;
  }

  async function generate() {
    const d = collect();
    if (!validate(d)) return;
    setBusy(true);
    setStatus("");
    try {
      await persist(d);
      download(`Invoice-${d.invoiceNo}-${slug(d.clientName)}.pdf`, await buildInvoicePdf(d));
      setStatus(`Invoice ${d.invoiceNo} recorded and downloaded.`);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Invoice generation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function emailToClient() {
    const d = collect();
    if (!validate(d)) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.clientEmail)) {
      setError("Add a valid client email before sending.");
      return;
    }
    setSending(true);
    setStatus("");
    try {
      await persist(d);
      const pdf = await buildInvoicePdf(d);
      const res = await fetch("/api/admin/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: d.clientEmail,
          clientName: d.clientName,
          companyName: d.companyName,
          invoiceNo: d.invoiceNo,
          amount: `${d.amount} ${d.currency}`,
          dueDate: d.dueDate,
          kindLabel: KIND_LABEL[d.kind],
          contractRef: d.contractRef,
          lines: d.lines.map((l) => `${l.label} — ${l.amount} ${d.currency}`),
          paymentDetails: d.paymentDetails,
          filename: `Invoice-${d.invoiceNo}-${slug(d.clientName)}.pdf`,
          pdfBase64: b64(pdf),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Send failed");
      setStatus(`Invoice ${d.invoiceNo} emailed to ${d.clientEmail} with the PDF attached.`);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Could not send the invoice.");
    } finally {
      setSending(false);
    }
  }

  function printInvoice() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(buildInvoice(collect()));
    w.document.close();
    setTimeout(() => w.print(), 500);
  }

  const preview = clientName || amount ? buildInvoice(collect()) : "";

  return (
    <main className="min-h-screen bg-ink text-bone">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-ink/85 px-6 py-3.5 backdrop-blur md:px-10">
        <div className="flex items-center gap-2.5">
          <Logo size={22} />
          <span className="text-mono text-[11px] uppercase tracking-[0.24em] text-bone">Amr/Studio</span>
          <span className="text-bone/25">/</span>
          <span className="text-mono text-[11px] uppercase tracking-[0.24em] text-bone/45">Invoices</span>
        </div>
        <nav className="flex items-center gap-5">
          <a href="/admin/contract" className="text-mono text-[11px] uppercase tracking-[0.2em] text-bone/60 transition-colors hover:text-accent">Contracts</a>
          <a href="/admin/proposal" className="text-mono text-[11px] uppercase tracking-[0.2em] text-bone/60 transition-colors hover:text-accent">Proposals</a>
          <a href="/admin/outreach" className="text-mono text-[11px] uppercase tracking-[0.2em] text-bone/60 transition-colors hover:text-accent">Outreach</a>
          <a href="/admin" className="text-mono text-[11px] uppercase tracking-[0.2em] text-bone/60 transition-colors hover:text-accent">Inquiries</a>
        </nav>
      </header>

      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-10 md:px-10 lg:grid-cols-[440px_1fr]">
        <div className="grid content-start gap-4">
          <div>
            <h1 className="text-display text-2xl text-bone">New invoice</h1>
            <p className="mt-1 text-sm text-bone/45">
              Pick a contract and everything fills in — client, project, totals, and
              the deposit or balance figure worked out from the agreed terms.
            </p>
          </div>

          {/* ── the contract picker ── */}
          <label className="grid gap-2">
            <span className={lab}>Bill against contract</span>
            <select className={field} value={contractId} onChange={(e) => pickContract(e.target.value)} disabled={loading}>
              <option value="" className="bg-ink">
                {loading ? "Loading contracts…" : contracts.length ? "Select a contract…" : "No saved contracts yet"}
              </option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id} className="bg-ink">
                  {c.client_name}{c.company_name ? ` · ${c.company_name}` : ""} — {c.price} {c.currency} ({c.ref})
                </option>
              ))}
            </select>
            {!loading && !contracts.length ? (
              <span className="text-xs text-bone/35">
                Generate a contract first — every contract you produce is saved here automatically.
              </span>
            ) : (
              <span className="text-xs text-bone/35">Invoice number {invoiceNo} · assigned when you generate</span>
            )}
          </label>

          {/* ── what to bill ── */}
          <div className="grid gap-2">
            <span className={lab}>What are you billing</span>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => { setKind(k); setSaved(false); }}
                  className={`rounded-full border px-4 py-2 text-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                    kind === k ? "border-accent bg-accent text-black" : "border-line text-bone/60 hover:border-bone/40 hover:text-bone"
                  }`}
                >
                  {KIND_LABEL[k]}
                </button>
              ))}
            </div>
            {kind !== "custom" && computed.total > 0 ? (
              <span className="text-xs text-bone/35">
                From the contract: {fmtMoney(computed.total)} {currency} total ·
                {" "}{upfrontPercent}% deposit = {fmtMoney(computed.deposit)} · balance = {fmtMoney(computed.final)}
              </span>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={lab}>Client name</span>
              <input className={field} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Full name" />
            </label>
            <label className="grid gap-2">
              <span className={lab}>Company</span>
              <input className={field} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Optional" />
            </label>
          </div>

          <label className="grid gap-2">
            <span className={lab}>Client email · for sending</span>
            <input className={field} value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@company.com" inputMode="email" />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2">
              <span className={lab}>Amount due</span>
              <input
                className={field}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setKind("custom"); }}
                placeholder="1200"
                inputMode="decimal"
              />
            </label>
            <label className="grid gap-2">
              <span className={lab}>Currency</span>
              <select className={field} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (<option key={c} value={c} className="bg-ink">{c}</option>))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className={lab}>Contract total</span>
              <input className={field} value={contractTotal} onChange={(e) => setContractTotal(e.target.value)} placeholder="2400" inputMode="decimal" />
            </label>
          </div>

          {kind === "custom" ? (
            <label className="grid gap-2">
              <span className={lab}>Line items · Description | Amount per line</span>
              <textarea
                className={`${field} resize-none`}
                rows={4}
                value={customLines}
                onChange={(e) => setCustomLines(e.target.value)}
                placeholder={"Extra language pass | 300\nMonthly care plan, July | 150"}
              />
            </label>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={lab}>Issue date</span>
              <input type="date" className={field} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className={lab}>Due date</span>
              <input type="date" className={field} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
          </div>

          <label className="grid gap-2">
            <span className={lab}>How to pay</span>
            <textarea className={`${field} resize-none`} rows={3} value={paymentDetails} onChange={(e) => setPaymentDetails(e.target.value)} />
          </label>

          <label className="grid gap-2">
            <span className={lab}>Notes</span>
            <textarea className={`${field} resize-none`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </label>

          <label className="flex items-center gap-3">
            <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-4 w-4 accent-accent" />
            <span className="text-sm text-bone/70">Mark as paid (stamps the document)</span>
          </label>

          {error ? <p className="text-sm text-accent">{error}</p> : null}
          {status ? <p className="text-sm text-emerald-400">{status}</p> : null}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="button" onClick={generate} disabled={busy} className="btn-solid !px-6 disabled:opacity-60">
              {busy ? "Generating…" : "Generate invoice PDF"}
            </button>
            <button type="button" onClick={emailToClient} disabled={sending} className="btn-ghost !px-5 !py-3 disabled:opacity-60">
              {sending ? "Sending…" : "Email to client"}
            </button>
            <button type="button" onClick={printInvoice} className="btn-ghost !px-5 !py-3">Print / Save</button>
          </div>
        </div>

        <div className="min-h-[70vh] overflow-hidden rounded-2xl border border-line bg-white/[0.02]">
          {preview ? (
            <iframe title="Invoice preview" srcDoc={preview} className="h-full min-h-[80vh] w-full" />
          ) : (
            <div className="flex h-full min-h-[70vh] flex-col items-center justify-center gap-3 p-10 text-center">
              <Logo size={40} static />
              <p className="max-w-sm text-sm text-bone/40">
                Pick a contract above and the invoice builds itself — client details,
                project, and the deposit or balance calculated from the agreed terms.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
