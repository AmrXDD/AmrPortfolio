"use client";

import { useMemo, useState } from "react";
import { Logo } from "@/components/ui/logo";
import { coldPitchEmail, followUpEmail, launchEmail } from "@/lib/emails/templates";
import { inquiryConfirmationEmail } from "@/lib/emails/templates";
import { SITE } from "@/lib/constants";

const field =
  "w-full rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-sm text-bone placeholder:text-bone/30 outline-none transition-colors focus:border-bone/40";
const lab = "text-mono text-[10px] uppercase tracking-[0.2em] text-bone/50";

type TemplateId = "pitch" | "followup" | "launch" | "confirmation";

const TABS: { id: TemplateId; label: string; blurb: string }[] = [
  { id: "pitch", label: "Cold outreach", blurb: "First touch to a studio or founder you want to work with." },
  { id: "followup", label: "Follow up", blurb: "The second (and last) nudge after silence." },
  { id: "launch", label: "Launch", blurb: "Tell past clients and contacts that something shipped." },
  { id: "confirmation", label: "Auto-confirm", blurb: "Read-only preview of what every new inquiry receives automatically." },
];

export function OutreachTool() {
  const [tab, setTab] = useState<TemplateId>("pitch");

  // shared
  const [recipients, setRecipients] = useState("");
  // pitch
  const [observation, setObservation] = useState("");
  const [angle, setAngle] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  // followup
  const [topic, setTopic] = useState("");
  const [newAngle, setNewAngle] = useState("");
  // launch
  const [projectName, setProjectName] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [story, setStory] = useState("");
  const [availability, setAvailability] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  // Each line carries its own company, so every recipient gets genuinely
  // different copy (and a different subject line) rather than one blast with
  // identical bodies — which is what trips spam filters.
  const parsed = useMemo(
    () =>
      recipients
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const [email, name = "", company = ""] = l.split("|").map((s) => s.trim());
          return { email, name, company };
        })
        .filter((r) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)),
    [recipients]
  );

  // Live preview uses the very same builders the server sends with.
  // Previews the FIRST recipient's copy, so what you see is one real send.
  const preview = useMemo(() => {
    const name = parsed[0]?.name || "Sara";
    const company = parsed[0]?.company || "";
    try {
      switch (tab) {
        case "pitch":
          return coldPitchEmail({
            toName: name,
            company: company || "your studio",
            observation: observation || "I came across your site and the work is strong, but the way it's presented undersells it.",
            angle: angle || "I build motion-first sites that make studio work land the way it deserves to.",
            proofUrl: proofUrl || undefined,
          });
        case "followup":
          return followUpEmail({
            toName: name,
            company: company || undefined,
            topic: topic || "your website",
            newAngle: newAngle || undefined,
          });
        case "launch":
          return launchEmail({
            toName: name,
            company: company || undefined,
            projectName: projectName || "A new project",
            projectUrl: projectUrl || SITE.url,
            story: story || "Six weeks of work, live today.",
            availability: availability || undefined,
          });
        case "confirmation":
          return inquiryConfirmationEmail({
            name: name,
            email: parsed[0]?.email || "client@company.com",
            service_label: "Website Development",
            budget: "1,500 - 3,000 USD",
            reason: "We need a new site for our studio before the trade show in October.",
          });
      }
    } catch {
      return null;
    }
  }, [tab, parsed, observation, angle, proofUrl, topic, newAngle, projectName, projectUrl, story, availability]);

  async function send() {
    if (tab === "confirmation") return;
    if (!parsed.length) {
      setError("Add at least one recipient as  email | Name");
      return;
    }
    setError("");
    setStatus("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/send-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: tab,
          // company travels per recipient inside `parsed`
          recipients: parsed,
          observation, angle, proofUrl,
          topic, newAngle,
          projectName, projectUrl, story, availability,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Send failed");
      const failed: { email: string; reason: string }[] = json.failed || [];
      setStatus(
        `Sent to ${json.sent.length} recipient${json.sent.length === 1 ? "" : "s"}.` +
          (failed.length ? ` ${failed.length} failed: ${failed.map((f) => f.email).join(", ")}` : "")
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink text-bone">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-ink/85 px-6 py-3.5 backdrop-blur md:px-10">
        <div className="flex items-center gap-2.5">
          <Logo size={22} />
          <span className="text-mono text-[11px] uppercase tracking-[0.24em] text-bone">Amr/Studio</span>
          <span className="text-bone/25">/</span>
          <span className="text-mono text-[11px] uppercase tracking-[0.24em] text-bone/45">Outreach</span>
        </div>
        <nav className="flex items-center gap-5">
          <a href="/admin/invoice" className="text-mono text-[11px] uppercase tracking-[0.2em] text-bone/60 transition-colors hover:text-accent">Invoices</a>
          <a href="/admin/proposal" className="text-mono text-[11px] uppercase tracking-[0.2em] text-bone/60 transition-colors hover:text-accent">Proposals</a>
          <a href="/admin/contract" className="text-mono text-[11px] uppercase tracking-[0.2em] text-bone/60 transition-colors hover:text-accent">Contracts</a>
          <a href="/admin" className="text-mono text-[11px] uppercase tracking-[0.2em] text-bone/60 transition-colors hover:text-accent">Inquiries</a>
        </nav>
      </header>

      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-10 md:px-10 lg:grid-cols-[440px_1fr]">
        <div className="grid content-start gap-4">
          <div>
            <h1 className="text-display text-2xl text-bone">Outreach</h1>
            <p className="mt-1 text-sm text-bone/45">
              Branded campaign templates in the same dark system as the contracts.
              Each recipient gets their own personalised send — never a shared blast.
            </p>
          </div>

          {/* template tabs */}
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setTab(t.id); setError(""); setStatus(""); }}
                className={`rounded-full border px-4 py-2 text-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  tab === t.id ? "border-accent bg-accent text-black" : "border-line text-bone/60 hover:border-bone/40 hover:text-bone"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="-mt-1 text-xs text-bone/40">{TABS.find((t) => t.id === tab)?.blurb}</p>

          {tab !== "confirmation" ? (
            <label className="grid gap-2">
              <span className={lab}>Recipients · one per line, email | Name | Company</span>
              <textarea
                className={`${field} resize-none`}
                rows={5}
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder={"sara@studio.com | Sara | Mirror Studio\nfounder@brand.co | Yousef | Brand Co"}
              />
              <span className="text-xs text-bone/35">
                {parsed.length} valid recipient{parsed.length === 1 ? "" : "s"} · max 25 per send.
                Each company is written into that person&apos;s own subject line and body.
              </span>
            </label>
          ) : (
            <div className="rounded-xl border border-line bg-white/[0.02] p-4">
              <p className="text-sm text-bone/60">
                This one sends itself. Every submission to the site&apos;s contact form
                triggers it automatically to the person who inquired, plus a lead
                notification to you.
              </p>
            </div>
          )}

          {tab === "pitch" ? (
            <>
              <label className="grid gap-2">
                <span className={lab}>What you noticed · makes it not a mass mail</span>
                <textarea className={`${field} resize-none`} rows={3} value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Your project photography is excellent but the site presents it as a flat grid…" />
              </label>
              <label className="grid gap-2">
                <span className={lab}>Your angle · what you would do</span>
                <textarea className={`${field} resize-none`} rows={3} value={angle} onChange={(e) => setAngle(e.target.value)} placeholder="I'd rebuild it as an editorial, motion-led experience…" />
              </label>
              <label className="grid gap-2">
                <span className={lab}>Proof link · optional</span>
                <input className={field} value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="https://scenariosd.vercel.app" />
              </label>
            </>
          ) : null}

          {tab === "followup" ? (
            <>
              <label className="grid gap-2">
                <span className={lab}>Topic · what the last conversation was about</span>
                <input className={field} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="rebuilding your studio site" />
              </label>
              <label className="grid gap-2">
                <span className={lab}>New angle · optional sweetener</span>
                <textarea className={`${field} resize-none`} rows={3} value={newAngle} onChange={(e) => setNewAngle(e.target.value)} placeholder="I have a slot opening in November…" />
              </label>
            </>
          ) : null}

          {tab === "launch" ? (
            <>
              <label className="grid gap-2">
                <span className={lab}>Project name</span>
                <input className={field} value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Smartee" />
              </label>
              <label className="grid gap-2">
                <span className={lab}>Project URL</span>
                <input className={field} value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)} placeholder="https://smartee.vercel.app" />
              </label>
              <label className="grid gap-2">
                <span className={lab}>The story · one paragraph</span>
                <textarea className={`${field} resize-none`} rows={4} value={story} onChange={(e) => setStory(e.target.value)} placeholder="A clinical-grade aligner studio with real-time treatment simulation…" />
              </label>
              <label className="grid gap-2">
                <span className={lab}>Availability line · optional</span>
                <textarea className={`${field} resize-none`} rows={2} value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="Two build slots open for Q4." />
              </label>
            </>
          ) : null}

          {error ? <p className="text-sm text-accent">{error}</p> : null}
          {status ? <p className="text-sm text-emerald-400">{status}</p> : null}

          {tab !== "confirmation" ? (
            <div className="mt-2">
              <button type="button" onClick={send} disabled={busy || !parsed.length} className="btn-solid !px-6 disabled:opacity-50">
                {busy ? "Sending…" : `Send to ${parsed.length || 0}`}
              </button>
            </div>
          ) : null}
        </div>

        {/* live preview — rendered with the exact builders the server sends */}
        <div className="min-h-[70vh] overflow-hidden rounded-2xl border border-line bg-black">
          {preview ? (
            <>
              <div className="border-b border-line px-5 py-3">
                <p className="text-mono text-[10px] uppercase tracking-[0.2em] text-bone/40">Subject</p>
                <p className="mt-1 text-sm text-bone">{preview.subject}</p>
              </div>
              <iframe title="Email preview" srcDoc={preview.html} className="h-full min-h-[74vh] w-full" />
            </>
          ) : (
            <div className="flex h-full min-h-[70vh] items-center justify-center p-10">
              <Logo size={40} static />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
