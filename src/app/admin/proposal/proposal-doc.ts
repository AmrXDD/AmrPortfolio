/*
 * Proposal document builder — the client-facing HTML proposal, sharing the exact
 * look of the contract documents: ink ground, bone type, ember accent labels,
 * conic ring logo, Nexium with a system fallback. Used for the live preview in
 * the generator and for the print / save path.
 */

export type ProposalPhase = { name: string; duration: string };
export type ProposalOption = { name: string; price: string; note: string };

export type ProposalData = {
  clientName: string;
  companyName: string;
  projectTitle: string;
  projectType: string;
  /** Your read on their situation — the "I understand what you need" section. */
  summary: string;
  objectives: string[];
  scope: string[];
  /** What is explicitly NOT included — kills scope creep before it starts. */
  exclusions: string[];
  phases: ProposalPhase[];
  price: string;
  currency: string;
  upfrontPercent: string;
  paymentTerms: string[];
  /** Optional paid extras the client can add on. */
  options: ProposalOption[];
  dateOfIssue: string; // yyyy-mm-dd
  validUntil: string; // yyyy-mm-dd
  notes: string;
};

const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const FONT_URL = "/fonts/Nexium.otf";

export const fmtDate = (iso: string) => {
  const d = iso ? new Date(iso + "T12:00:00") : new Date();
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

export const money = (d: ProposalData) => `${d.price} ${d.currency}`.trim();

export const proposalRef = (d: ProposalData) =>
  `AS-P-${(d.dateOfIssue || "").replace(/-/g, "")}-${(d.clientName || "X").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "CLT"}`;

/* Shared shell — identical chrome to the contract documents. */
function shell(title: string, body: string, accentLabel: string) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  @font-face { font-family: "Nexium"; src: url("${FONT_URL}") format("opentype"); font-display: swap; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root { --ink:#000; --bone:#f5f5f5; --accent:#ff4d1f; --line:rgba(245,245,245,0.14); --muted:rgba(245,245,245,0.55); }
  body { background: var(--ink); color: var(--bone); font-family: "Nexium", "Segoe UI", system-ui, sans-serif; line-height: 1.65; }
  .page { max-width: 820px; margin: 0 auto; padding: 56px 32px 80px; }
  header.doc { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line); padding-bottom: 24px; margin-bottom: 40px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .ring { width: 34px; height: 34px; border-radius: 50%; background: conic-gradient(from 0deg, #FF4D1F, #7C3AED, #22D3EE, #FF4D1F); position: relative; }
  .ring::after { content: "a"; position: absolute; inset: 4px; border-radius: 50%; background: var(--ink); color: var(--bone); font-style: italic; font-family: Georgia, serif; display: flex; align-items: center; justify-content: center; font-size: 17px; }
  .word { font-size: 12px; letter-spacing: 0.24em; text-transform: uppercase; }
  .tag { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--accent); }
  h1 { font-size: clamp(28px, 5vw, 44px); line-height: 1.1; letter-spacing: 0.01em; margin-bottom: 6px; }
  .sub { color: var(--muted); font-size: 13px; margin-bottom: 36px; }
  h2 { font-size: 13px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--accent); margin: 36px 0 12px; }
  p, li { font-size: 14.5px; color: rgba(245,245,245,0.85); }
  ul, ol { padding-left: 22px; display: grid; gap: 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  td, th { border: 1px solid var(--line); padding: 10px 14px; font-size: 13.5px; text-align: left; vertical-align: top; }
  th { color: var(--muted); font-weight: 400; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.18em; width: 220px; }
  .rule { border: 1px solid var(--line); border-radius: 14px; padding: 18px 20px; margin-top: 10px; }
  .rule b { color: var(--bone); }
  .price { border: 1px solid var(--line); border-radius: 16px; padding: 26px 24px; margin-top: 12px; text-align: center; }
  .price .amt { font-size: 40px; line-height: 1; color: var(--bone); }
  .price .cap { font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--accent); margin-top: 10px; }
  .step { display: flex; gap: 18px; border: 1px solid var(--line); border-radius: 14px; padding: 18px 20px; margin-top: 12px; }
  .step .no { color: var(--accent); font-size: 22px; line-height: 1; min-width: 34px; }
  .step h3 { font-size: 15px; margin-bottom: 4px; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 48px; }
  .sig { border-top: 1px solid var(--line); padding-top: 14px; }
  .sig .name { font-size: 17px; }
  .sig .role { font-size: 9.5px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent); margin-top: 4px; }
  .sig .line { margin-top: 30px; border-bottom: 1px solid rgba(245,245,245,0.4); height: 34px; }
  .sig .cap { font-size: 10px; color: var(--muted); margin-top: 6px; text-transform: uppercase; letter-spacing: 0.18em; }
  footer.doc { margin-top: 64px; border-top: 1px solid var(--line); padding-top: 18px; display: flex; justify-content: space-between; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); }
  .rule, .step, table, .sig-grid, .price, h2 { break-inside: avoid; page-break-inside: avoid; }
  @media print {
    html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: var(--ink); }
    .page { padding: 28px 12px; }
  }
</style></head>
<body><div class="page">
<header class="doc">
  <div class="brand"><div class="ring"></div><div><div class="word">Amr/Studio</div></div></div>
  <div class="tag">${esc(accentLabel)}</div>
</header>
${body}
<footer class="doc"><span>Amr Hassan · Independent Developer</span><span>Salmiya, Kuwait · GMT+3</span></footer>
</div></body></html>`;
}

const list = (items: string[]) => items.filter(Boolean).map((s) => `<li>${esc(s)}</li>`).join("");

export function buildProposal(d: ProposalData): string {
  const steps: [string, string][] = [
    ["Approve the proposal", `Reply to confirm the scope in section 03. Adjustments are normal at this stage — tell me what to change before we lock it.`],
    ["Sign the agreement", `You receive the service agreement built from exactly these terms, plus the ${esc(d.upfrontPercent)}% upfront invoice.`],
    ["Kickoff", "Send brand assets, copy, images, and access. Anything missing gets flagged inside 48 hours."],
    ["Build with live previews", "A private preview link from the first milestone. You watch it take shape and request edits while development runs."],
    ["Delivery & handover", "Final payment per the terms below, then full handover: deployment, credentials, and source."],
  ];

  const body = `
<h1>${esc(d.projectTitle) || "Project Proposal"}</h1>
<p class="sub">Prepared for ${esc(d.clientName)}${d.companyName ? ` · ${esc(d.companyName)}` : ""} · Ref ${proposalRef(d)} · Issued ${fmtDate(d.dateOfIssue)}</p>

<h2>01 · Overview</h2>
<p>${esc(d.summary).replace(/\n/g, "<br>")}</p>

${d.objectives.length ? `<h2>02 · Objectives</h2>
<p>What this project has to achieve to be worth doing:</p>
<ul>${list(d.objectives)}</ul>` : ""}

<h2>03 · Scope of Work</h2>
<p>The following deliverables define the full and final scope of this engagement:</p>
<ul>${list(d.scope)}</ul>

${d.exclusions.length ? `<h2>04 · Not Included</h2>
<p>Stated up front so there are no surprises later. Any of these can be quoted separately:</p>
<ul>${list(d.exclusions)}</ul>` : ""}

${d.phases.length ? `<h2>05 · Timeline</h2>
<table>
  <tr><th>Phase</th><th style="width:auto">Duration</th></tr>
  ${d.phases.map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(p.duration)}</td></tr>`).join("")}
</table>` : ""}

<h2>06 · Investment</h2>
<div class="price">
  <div class="amt">${esc(money(d))}</div>
  <div class="cap">Total project investment · fixed price</div>
</div>
<table style="margin-top:14px">
  <tr><th>Upfront</th><td>${esc(d.upfrontPercent)}% upon signing</td></tr>
  <tr><th>Payment terms</th><td><ul style="padding-left:18px">${list(d.paymentTerms)}</ul></td></tr>
  <tr><th>Proposal valid until</th><td>${fmtDate(d.validUntil)}</td></tr>
</table>

${d.options.length ? `<h2>07 · Optional Add-ons</h2>
<table>
  <tr><th>Add-on</th><th style="width:150px">Price</th></tr>
  ${d.options.map((o) => `<tr><td><b>${esc(o.name)}</b>${o.note ? `<br><span style="color:rgba(245,245,245,0.55);font-size:12.5px">${esc(o.note)}</span>` : ""}</td><td>${esc(o.price)}</td></tr>`).join("")}
</table>` : ""}

<h2>08 · Why Amr Studio</h2>
<div class="rule"><b>One developer, start to finish.</b> No account managers, no handoffs, no junior doing the real work. You talk to the person building it.</div>
<div class="rule"><b>Production-grade on day one.</b> The demo is the product — no throwaway prototypes rebuilt later at your cost.</div>
<div class="rule"><b>Motion and performance as features.</b> Tuned to 60fps on a five-year-old laptop, because the feel is the product.</div>

<h2>09 · How We Proceed</h2>
${steps.map(([t, b], i) => `<div class="step"><div class="no">0${i + 1}</div><div><h3>${esc(t)}</h3><p>${b}</p></div></div>`).join("")}

<h2>10 · Terms</h2>
<div class="rule"><b>Validity.</b> This pricing holds until ${fmtDate(d.validUntil)}. After that the scope stands but the numbers may need revisiting.</div>
<div class="rule"><b>Edits &amp; scope.</b> Requested edits are welcome while the project is in development. New features beyond the scope in section 03 are quoted separately.</div>
<div class="rule"><b>Refunds.</b> Client-initiated refunds after 24 hours deduct 40% of the upfront; after one week or more, 70% of the paid amount. If the developer initiates the refund, the full paid amount is returned regardless of time elapsed.</div>
${d.notes ? `<div class="rule"><b>Additional notes.</b> ${esc(d.notes)}</div>` : ""}

<h2>11 · Acceptance</h2>
<p>Countersigning below converts this proposal into an active engagement under the terms above.</p>
<div class="sig-grid">
  <div class="sig">
    <div class="name">Amr Hassan</div>
    <div class="role">Independent Developer and not a licensed company</div>
    <div class="line"></div>
    <div class="cap">Signature · Date</div>
  </div>
  <div class="sig">
    <div class="name">${esc(d.clientName)}</div>
    <div class="role">${d.companyName ? esc(d.companyName) : "Client"}</div>
    <div class="line"></div>
    <div class="cap">Signature · Date</div>
  </div>
</div>`;
  return shell(`Proposal · ${d.clientName}`, body, "Proposal");
}
