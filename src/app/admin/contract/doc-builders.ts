/*
 * Builders for the three generated documents: the contract itself, the client
 * welcome letter, and the "what's next" guide. Each returns a fully standalone
 * HTML file (inline CSS, no external deps except the Nexium font, which falls
 * back to system sans when opened offline). All share the site's look: ink
 * background, bone type, ember accent, and the conic-ring logo.
 */

export type ContractData = {
  clientName: string;
  companyName: string;
  projectType: string;
  websiteType: string;
  price: string;
  currency: string;
  upfrontPercent: string;
  paymentTimeline: string[]; // one milestone per line
  dateOfIssue: string; // yyyy-mm-dd
  scope: string[]; // agreed deliverables, one per line
  notes: string;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Same-origin so the in-app preview, print path, and html2pdf capture all
// load the real Nexium face without CORS issues.
const FONT_URL = "/fonts/Nexium.otf";

export const fmtDate = (iso: string) => {
  const d = iso ? new Date(iso + "T12:00:00") : new Date();
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const money = (d: ContractData) => `${esc(d.price)} ${esc(d.currency)}`.trim();

const refId = (d: ContractData) =>
  `AS-${(d.dateOfIssue || "").replace(/-/g, "")}-${(d.clientName || "X").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "CLT"}`;

/* Shared shell: page chrome, logo, typography. */
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
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 48px; }
  .sig { border-top: 1px solid var(--line); padding-top: 14px; }
  .sig .name { font-size: 17px; }
  .sig .role { font-size: 9.5px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent); margin-top: 4px; }
  .sig .line { margin-top: 30px; border-bottom: 1px solid rgba(245,245,245,0.4); height: 34px; }
  .sig .cap { font-size: 10px; color: var(--muted); margin-top: 6px; text-transform: uppercase; letter-spacing: 0.18em; }
  footer.doc { margin-top: 64px; border-top: 1px solid var(--line); padding-top: 18px; display: flex; justify-content: space-between; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); }
  .step { display: flex; gap: 18px; border: 1px solid var(--line); border-radius: 14px; padding: 18px 20px; margin-top: 12px; }
  .step .no { color: var(--accent); font-size: 22px; line-height: 1; min-width: 34px; }
  .step h3 { font-size: 15px; margin-bottom: 4px; }
  /* Keep whole blocks together when paginating (print + html2pdf capture). */
  .rule, .step, table, .sig-grid, h2 { break-inside: avoid; page-break-inside: avoid; }
  /* Print keeps the exact same dark look; force background graphics on. */
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

const list = (items: string[]) =>
  items.filter(Boolean).map((s) => `<li>${esc(s)}</li>`).join("");

/* ───────────────────────── The contract ───────────────────────── */
export function buildContract(d: ContractData): string {
  const body = `
<h1>Service Agreement</h1>
<p class="sub">Reference ${refId(d)} · Issued ${fmtDate(d.dateOfIssue)}</p>

<h2>01 · Parties</h2>
<table>
  <tr><th>Developer</th><td>Amr Hassan, independent developer, operating as Amr Studio (not a licensed company)</td></tr>
  <tr><th>Client</th><td>${esc(d.clientName)}${d.companyName ? `, representing ${esc(d.companyName)}` : ""}</td></tr>
</table>

<h2>02 · Project</h2>
<table>
  <tr><th>Project type</th><td>${esc(d.projectType)}</td></tr>
  <tr><th>Website type</th><td>${esc(d.websiteType)}</td></tr>
  ${d.companyName ? `<tr><th>Company</th><td>${esc(d.companyName)}</td></tr>` : ""}
  <tr><th>Date of issue</th><td>${fmtDate(d.dateOfIssue)}</td></tr>
</table>

<h2>03 · Agreed Scope</h2>
<p>The following deliverables define the full and final scope of this engagement:</p>
<ul>${list(d.scope)}</ul>
${d.notes ? `<p style="margin-top:12px"><b>Additional notes:</b> ${esc(d.notes)}</p>` : ""}

<h2>04 · Price &amp; Payment</h2>
<table>
  <tr><th>Total price</th><td>${money(d)}</td></tr>
  <tr><th>Upfront</th><td>${esc(d.upfrontPercent)}% upon signing</td></tr>
  <tr><th>Payment timeline</th><td><ul style="padding-left:18px">${list(d.paymentTimeline)}</ul></td></tr>
</table>

<h2>05 · General Rules</h2>
<div class="rule"><b>Refunds, client initiated.</b> A refund requested by the client after 24 hours of payment completion is approved after deducting <b>40% of the upfront</b>. After one week or more, <b>70% of the paid amount</b> is deducted.</div>
<div class="rule"><b>Refunds, developer initiated.</b> If the refund is initiated by the developer, the <b>full paid amount is returned</b>, regardless of the time elapsed.</div>
<div class="rule"><b>Edits &amp; scope.</b> Requested edits are allowed while the project is in development. No new features will be added beyond the agreed scope listed in section 03.</div>

<h2>06 · Signatures</h2>
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
  return shell(`Service Agreement · ${d.clientName}`, body, "Service Agreement");
}

/* ───────────────────────── Welcome letter ───────────────────────── */
export function buildWelcome(d: ContractData): string {
  const first = (d.clientName || "there").split(" ")[0];
  const body = `
<h1>Welcome aboard, ${esc(first)}.</h1>
<p class="sub">${esc(d.projectType)} · ${esc(d.websiteType)} · Ref ${refId(d)}</p>

<p>Thank you for trusting me with ${d.companyName ? `<b>${esc(d.companyName)}</b>` : "your project"}. From here on, you have one developer, one point of contact, and one standard: work that feels inevitable.</p>

<h2>What we agreed on</h2>
<ul>${list(d.scope)}</ul>

<h2>The numbers</h2>
<table>
  <tr><th>Total</th><td>${money(d)}</td></tr>
  <tr><th>Upfront</th><td>${esc(d.upfrontPercent)}% upon signing</td></tr>
  <tr><th>Timeline</th><td><ul style="padding-left:18px">${list(d.paymentTimeline)}</ul></td></tr>
</table>

<h2>How we work</h2>
<ul>
  <li>Direct line on WhatsApp, replies in minutes during Kuwait daytime (GMT+3).</li>
  <li>You will see real progress, not mockups: live preview links as the build ships.</li>
  <li>Edits are welcome throughout development. New features beyond the agreed scope are a new conversation.</li>
</ul>

<p style="margin-top:28px">Signed alongside your service agreement dated ${fmtDate(d.dateOfIssue)}. Check the companion file <b>What&#8217;s Next</b> for the exact next steps.</p>`;
  return shell(`Welcome · ${d.clientName}`, body, "Welcome");
}

/* ───────────────────────── What's next guide ───────────────────────── */
export function buildWhatsNext(d: ContractData): string {
  const steps: [string, string][] = [
    ["Sign & send the upfront", `Sign the agreement (Ref ${refId(d)}) and complete the ${esc(d.upfrontPercent)}% upfront. Development is scheduled the moment it lands.`],
    ["Kickoff handover", `Send everything the build needs: brand assets, copy, images, access, and references for your ${esc(d.websiteType).toLowerCase() || "site"}. Missing pieces get flagged in the first 48 hours.`],
    ["Build & live previews", "You receive a private preview link and watch the project take shape. Request edits at any point while development is running."],
    ["Review round", "A structured walkthrough of the finished build against the agreed scope, with a final round of refinements."],
    ["Final payment & delivery", `Settle the remaining balance per the payment timeline, then receive the full handover: deployment, credentials, and source.`],
  ];
  const body = `
<h1>What happens next</h1>
<p class="sub">${esc(d.clientName)}${d.companyName ? ` · ${esc(d.companyName)}` : ""} · ${esc(d.projectType)} · Issued ${fmtDate(d.dateOfIssue)}</p>
${steps.map(([t, b], i) => `<div class="step"><div class="no">0${i + 1}</div><div><h3>${t}</h3><p>${b}</p></div></div>`).join("")}
<h2>Keep in mind</h2>
<ul>
  <li>Edits are free while we build. Features outside the agreed scope are quoted separately.</li>
  <li>Refund terms follow the signed agreement: client initiated refunds after 24 hours deduct 40% of the upfront, after a week 70% of the paid amount. If I initiate the refund, you get everything back.</li>
  <li>Everything routes through one WhatsApp thread, no ticket systems, no waiting queues.</li>
</ul>`;
  return shell(`What's Next · ${d.clientName}`, body, "What's Next");
}
