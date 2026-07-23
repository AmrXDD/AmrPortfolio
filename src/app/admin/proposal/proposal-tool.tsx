"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import { buildProposal, proposalRef, money, fmtDate, type ProposalData } from "./proposal-doc";
import { buildProposalPdf } from "./proposal-pdf";

const CURRENCIES = ["USD", "KWD", "EUR", "GBP", "AED", "SAR", "EGP"];

const PROJECT_TYPES = [
  "Website Development",
  "Web App / Product",
  "Brand & Website",
  "Social Media Marketing (SMMA)",
  "Development + SMMA",
  "Other",
];

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (n: number) =>
  new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const field =
  "w-full rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-sm text-bone placeholder:text-bone/30 outline-none transition-colors focus:border-bone/40";
const lab = "text-mono text-[10px] uppercase tracking-[0.2em] text-bone/50";

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

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

export function ProposalTool() {
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
  const [summary, setSummary] = useState("");
  const [objectives, setObjectives] = useState("");
  const [scope, setScope] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [phases, setPhases] = useState("Discovery & direction | Week 1\nDesign & build | Weeks 2-4\nReview & refinements | Week 5\nLaunch & handover | Week 6");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [upfrontPercent, setUpfrontPercent] = useState("50");
  const [paymentTerms, setPaymentTerms] = useState("50% upfront upon signing\n50% upon final delivery");
  const [options, setOptions] = useState("");
  const [dateOfIssue, setDateOfIssue] = useState(today());
  const [validUntil, setValidUntil] = useState(plusDays(14));
  const [notes, setNotes] = useState("");

  const [generated, setGenerated] = useState<ProposalData | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);

  const collect = (): ProposalData => ({
    clientName: clientName.trim(),
    companyName: companyName.trim(),
    projectTitle: projectTitle.trim(),
    projectType,
    summary: summary.trim(),
    objectives: lines(objectives),
    scope: lines(scope),
    exclusions: lines(exclusions),
    phases: lines(phases).map((l) => {
      const [name, duration = ""] = l.split("|").map((s) => s.trim());
      return { name, duration };
    }),
    price: price.trim(),
    currency,
    upfrontPercent: upfrontPercent.trim() || "50",
    paymentTerms: lines(paymentTerms),
    options: lines(options).map((l) => {
      const [name, p = "", note = ""] = l.split("|").map((s) => s.trim());
      return { name, price: p, note };
    }),
    dateOfIssue,
    validUntil,
    notes: notes.trim(),
  });

  const slug = (s: string) =>
    (s || "client").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";

  function validate(d: ProposalData) {
    if (!d.clientName || !d.projectTitle || !d.price || !d.summary || d.scope.length === 0) {
      setError("Fill in at least the client name, project title, overview, price, and the scope of work.");
      return false;
    }
    setError("");
    return true;
  }

  async function generate() {
    const d = collect();
    if (!validate(d)) return;
    setBusy(true);
    setStatus("");
    try {
      setGenerated(d);
      download(`Proposal-${slug(d.clientName)}-${d.dateOfIssue}.pdf`, await buildProposalPdf(d));
      setStatus("Proposal PDF downloaded.");
    } catch (e) {
      console.error(e);
      setError("PDF generation failed. Check the console and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function emailToClient() {
    const d = collect();
    if (!validate(d)) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
      setError("Add a valid client email before sending.");
      return;
    }
    setSending(true);
    setStatus("");
    try {
      const pdf = await buildProposalPdf(d);
      const res = await fetch("/api/admin/send-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: clientEmail.trim(),
          clientName: d.clientName,
          companyName: d.companyName,
          projectTitle: d.projectTitle,
          investment: money(d),
          validUntil: fmtDate(d.validUntil),
          ref: proposalRef(d),
          highlights: d.scope.slice(0, 6),
          filename: `Proposal-${slug(d.clientName)}-${d.dateOfIssue}.pdf`,
          pdfBase64: b64(pdf),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Send failed");
      setGenerated(d);
      setStatus(`Proposal emailed to ${clientEmail.trim()} with the PDF attached.`);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Could not send the proposal.");
    } finally {
      setSending(false);
    }
  }

  function printProposal() {
    if (!generated) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(buildProposal(generated));
    w.document.close();
    setTimeout(() => w.print(), 500);
  }

  return (
    <main className="min-h-screen bg-ink text-bone">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-ink/85 px-6 py-3.5 backdrop-blur md:px-10">
        <div className="flex items-center gap-2.5">
          <Logo size={22} />
          <span className="text-mono text-[11px] uppercase tracking-[0.24em] text-bone">Amr/Studio</span>
          <span className="text-bone/25">/</span>
          <span className="text-mono text-[11px] uppercase tracking-[0.24em] text-bone/45">Proposals</span>
        </div>
        <nav className="flex items-center gap-5">
          <a href="/admin/contract" className="text-mono text-[11px] uppercase tracking-[0.2em] text-bone/60 transition-colors hover:text-accent">Contracts</a>
          <a href="/admin/outreach" className="text-mono text-[11px] uppercase tracking-[0.2em] text-bone/60 transition-colors hover:text-accent">Outreach</a>
          <a href="/admin" className="text-mono text-[11px] uppercase tracking-[0.2em] text-bone/60 transition-colors hover:text-accent">Inquiries</a>
        </nav>
      </header>

      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-10 md:px-10 lg:grid-cols-[440px_1fr]">
        <div className="grid content-start gap-4">
          <div>
            <h1 className="text-display text-2xl text-bone">New proposal</h1>
            <p className="mt-1 text-sm text-bone/45">
              Fixed scope, fixed price, stated exclusions. Generates the same dark
              branded document as the contract, and can email it to the client with
              the PDF attached.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={lab}>Client name</span>
              <input className={field} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Full name" />
            </label>
            <label className="grid gap-2">
              <span className={lab}>Company name</span>
              <input className={field} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Optional" />
            </label>
          </div>

          <label className="grid gap-2">
            <span className={lab}>Client email · for sending</span>
            <input className={field} value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@company.com" inputMode="email" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={lab}>Project title</span>
              <input className={field} value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="e.g. Brand site + booking flow" />
            </label>
            <label className="grid gap-2">
              <span className={lab}>Project type</span>
              <select className={field} value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                {PROJECT_TYPES.map((p) => (<option key={p} value={p} className="bg-ink">{p}</option>))}
              </select>
            </label>
          </div>

          <label className="grid gap-2">
            <span className={lab}>Overview · your read on their situation</span>
            <textarea className={`${field} resize-none`} rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="You need a site that reads like a creative house rather than a catalogue…" />
          </label>

          <label className="grid gap-2">
            <span className={lab}>Objectives · one per line</span>
            <textarea className={`${field} resize-none`} rows={3} value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder={"Convert cold traffic into qualified inquiries\nPosition the studio above local competitors"} />
          </label>

          <label className="grid gap-2">
            <span className={lab}>Scope of work · one deliverable per line</span>
            <textarea className={`${field} resize-none`} rows={6} value={scope} onChange={(e) => setScope(e.target.value)} placeholder={"Responsive marketing site, 5 pages\nBilingual EN/AR with RTL\nContact form with email notifications\nDeployment and handover"} />
          </label>

          <label className="grid gap-2">
            <span className={lab}>Not included · one per line</span>
            <textarea className={`${field} resize-none`} rows={3} value={exclusions} onChange={(e) => setExclusions(e.target.value)} placeholder={"Copywriting and content production\nOngoing maintenance after handover\nPaid ad management"} />
          </label>

          <label className="grid gap-2">
            <span className={lab}>Timeline · Phase | Duration per line</span>
            <textarea className={`${field} resize-none`} rows={4} value={phases} onChange={(e) => setPhases(e.target.value)} />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2">
              <span className={lab}>Price</span>
              <input className={field} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1500" inputMode="decimal" />
            </label>
            <label className="grid gap-2">
              <span className={lab}>Currency</span>
              <select className={field} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (<option key={c} value={c} className="bg-ink">{c}</option>))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className={lab}>Upfront %</span>
              <input className={field} value={upfrontPercent} onChange={(e) => setUpfrontPercent(e.target.value)} inputMode="numeric" />
            </label>
          </div>

          <label className="grid gap-2">
            <span className={lab}>Payment terms · one per line</span>
            <textarea className={`${field} resize-none`} rows={3} value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
          </label>

          <label className="grid gap-2">
            <span className={lab}>Optional add-ons · Name | Price | Note per line</span>
            <textarea className={`${field} resize-none`} rows={3} value={options} onChange={(e) => setOptions(e.target.value)} placeholder={"Extra language | 300 USD | Full translation and RTL pass\nMonthly care plan | 150 USD/mo | Updates, backups, priority fixes"} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={lab}>Date of issue</span>
              <input type="date" className={field} value={dateOfIssue} onChange={(e) => setDateOfIssue(e.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className={lab}>Valid until</span>
              <input type="date" className={field} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </label>
          </div>

          <label className="grid gap-2">
            <span className={lab}>Additional notes</span>
            <textarea className={`${field} resize-none`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </label>

          {error ? <p className="text-sm text-accent">{error}</p> : null}
          {status ? <p className="text-sm text-emerald-400">{status}</p> : null}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="button" onClick={generate} disabled={busy} className="btn-solid !px-6 disabled:opacity-60">
              {busy ? "Generating…" : "Generate proposal PDF"}
            </button>
            <button type="button" onClick={emailToClient} disabled={sending} className="btn-ghost !px-5 !py-3 disabled:opacity-60">
              {sending ? "Sending…" : "Email to client"}
            </button>
            {generated ? (
              <button type="button" onClick={printProposal} className="btn-ghost !px-5 !py-3">
                Print / Save
              </button>
            ) : null}
          </div>
        </div>

        <div className="min-h-[70vh] overflow-hidden rounded-2xl border border-line bg-white/[0.02]">
          {generated ? (
            <iframe title="Proposal preview" srcDoc={buildProposal(generated)} className="h-full min-h-[80vh] w-full" />
          ) : (
            <div className="flex h-full min-h-[70vh] flex-col items-center justify-center gap-3 p-10 text-center">
              <Logo size={40} static />
              <p className="max-w-sm text-sm text-bone/40">
                The generated proposal previews here — overview, objectives, scope,
                exclusions, timeline, a hero investment block, optional add-ons, and an
                acceptance signature block, all in the same dark brand system as the contract.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
