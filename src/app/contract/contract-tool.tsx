"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import { buildContract, buildWelcome, buildWhatsNext, type ContractData } from "./doc-builders";

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

const field =
  "w-full rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-sm text-bone placeholder:text-bone/30 outline-none transition-colors focus:border-bone/40";
const lab = "text-mono text-[10px] uppercase tracking-[0.2em] text-bone/50";

function download(filename: string, html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function ContractTool() {
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
  const [websiteType, setWebsiteType] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [upfrontPercent, setUpfrontPercent] = useState("50");
  const [timeline, setTimeline] = useState("50% upfront upon signing\n50% upon final delivery");
  const [dateOfIssue, setDateOfIssue] = useState(today());
  const [scope, setScope] = useState("");
  const [notes, setNotes] = useState("");
  const [generated, setGenerated] = useState<ContractData | null>(null);
  const [error, setError] = useState("");

  const collect = (): ContractData => ({
    clientName: clientName.trim(),
    companyName: companyName.trim(),
    projectType,
    websiteType: websiteType.trim(),
    price: price.trim(),
    currency,
    upfrontPercent: upfrontPercent.trim() || "50",
    paymentTimeline: timeline.split("\n").map((s) => s.trim()).filter(Boolean),
    dateOfIssue,
    scope: scope.split("\n").map((s) => s.trim()).filter(Boolean),
    notes: notes.trim(),
  });

  function slug(s: string) {
    return (s || "client").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";
  }

  function generate() {
    const d = collect();
    if (!d.clientName || !d.price || !d.websiteType || d.scope.length === 0) {
      setError("Fill in at least the client name, website type, price, and the agreed scope.");
      return;
    }
    setError("");
    setGenerated(d);
    const base = slug(d.clientName);
    // The contract is the anchor document; the two companions auto-download
    // built from the same details.
    download(`Contract-${base}-${d.dateOfIssue}.html`, buildContract(d));
    download(`Welcome-${base}.html`, buildWelcome(d));
    download(`Whats-Next-${base}.html`, buildWhatsNext(d));
  }

  function printContract() {
    if (!generated) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(buildContract(generated));
    w.document.close();
    setTimeout(() => w.print(), 500);
  }

  return (
    <main className="min-h-screen bg-ink text-bone">
      {/* Top bar, same pattern as /admin but branded for contracts */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-ink/85 px-6 py-3.5 backdrop-blur md:px-10">
        <div className="flex items-center gap-2.5">
          <Logo size={22} />
          <span className="text-mono text-[11px] uppercase tracking-[0.24em] text-bone">Amr/Studio</span>
          <span className="text-bone/25">/</span>
          <span className="text-mono text-[11px] uppercase tracking-[0.24em] text-bone/45">Contracts</span>
        </div>
        <span className="text-mono text-[10px] uppercase tracking-[0.22em] text-accent/80">Generator</span>
      </header>

      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-10 md:px-10 lg:grid-cols-[420px_1fr]">
        {/* ── The form ── */}
        <div className="grid content-start gap-4">
          <div>
            <h1 className="text-display text-2xl text-bone">New agreement</h1>
            <p className="mt-1 text-sm text-bone/45">
              Fill the details, hit generate. The contract plus a Welcome letter and a What&apos;s
              Next guide download together, all built from the same data.
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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={lab}>Project type</span>
              <select className={field} value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                {PROJECT_TYPES.map((p) => (
                  <option key={p} value={p} className="bg-ink">{p}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className={lab}>Website type</span>
              <input className={field} value={websiteType} onChange={(e) => setWebsiteType(e.target.value)} placeholder="e.g. Portfolio, E commerce, Landing page" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 sm:col-span-1">
              <span className={lab}>Price</span>
              <input className={field} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1500" inputMode="decimal" />
            </label>
            <label className="grid gap-2">
              <span className={lab}>Currency</span>
              <select className={field} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c} className="bg-ink">{c}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className={lab}>Upfront %</span>
              <input className={field} value={upfrontPercent} onChange={(e) => setUpfrontPercent(e.target.value)} inputMode="numeric" />
            </label>
          </div>

          <label className="grid gap-2">
            <span className={lab}>Payment timeline · one milestone per line</span>
            <textarea className={`${field} resize-none`} rows={3} value={timeline} onChange={(e) => setTimeline(e.target.value)} />
          </label>

          <label className="grid gap-2">
            <span className={lab}>Date of issue</span>
            <input type="date" className={field} value={dateOfIssue} onChange={(e) => setDateOfIssue(e.target.value)} />
          </label>

          <label className="grid gap-2">
            <span className={lab}>Agreed scope · one deliverable per line</span>
            <textarea
              className={`${field} resize-none`}
              rows={6}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder={"Responsive marketing site, 5 pages\nBilingual EN/AR with RTL\nContact form with email notifications\nDeployment and handover"}
            />
          </label>

          <label className="grid gap-2">
            <span className={lab}>Additional notes</span>
            <textarea className={`${field} resize-none`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </label>

          {error ? <p className="text-sm text-accent">{error}</p> : null}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button type="button" onClick={generate} className="btn-solid !px-6">
              Generate all three files
            </button>
            {generated ? (
              <button type="button" onClick={printContract} className="btn-ghost !px-5 !py-3">
                Print / Save PDF
              </button>
            ) : null}
          </div>
        </div>

        {/* ── Live preview ── */}
        <div className="min-h-[70vh] overflow-hidden rounded-2xl border border-line bg-white/[0.02]">
          {generated ? (
            <iframe
              title="Contract preview"
              srcDoc={buildContract(generated)}
              className="h-full min-h-[80vh] w-full"
            />
          ) : (
            <div className="flex h-full min-h-[70vh] flex-col items-center justify-center gap-3 p-10 text-center">
              <Logo size={40} static />
              <p className="max-w-sm text-sm text-bone/40">
                The generated agreement previews here. Signature block is fixed to
                <span className="text-bone/70"> Amr Hassan, Independent Developer and not a licensed company</span>,
                with the refund and scope rules baked in.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
