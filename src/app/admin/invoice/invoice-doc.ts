/*
 * Invoice document builder — same visual system as the contract and proposal
 * documents (ink ground, bone type, ember accent labels, ring logo, Nexium
 * with a system fallback). Used for the live preview and the print path.
 */

export type InvoiceKind = "deposit" | "final" | "full" | "custom";

export type InvoiceLine = { label: string; amount: string };

export type InvoiceData = {
  invoiceNo: string;
  /** Contract this bills against, if it came from one. */
  contractRef: string;
  clientName: string;
  companyName: string;
  clientEmail: string;
  projectType: string;
  websiteType: string;
  kind: InvoiceKind;
  /** Amount actually due on this invoice. */
  amount: string;
  currency: string;
  /** Full contract value, shown for context when part-billing. */
  contractTotal: string;
  upfrontPercent: string;
  issueDate: string; // yyyy-mm-dd
  dueDate: string; // yyyy-mm-dd
  lines: InvoiceLine[];
  paymentDetails: string;
  notes: string;
  paid: boolean;
};

const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const FONT_URL = "/fonts/Nexium.otf";

export const fmtDate = (iso: string) => {
  const d = iso ? new Date(iso + "T12:00:00") : new Date();
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

export const KIND_LABEL: Record<InvoiceKind, string> = {
  deposit: "Deposit invoice",
  final: "Final invoice",
  full: "Full payment",
  custom: "Invoice",
};

/** Money helpers — contract prices are free text, so parse defensively. */
export const parseMoney = (s: string) => {
  const n = parseFloat(String(s ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
export const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const money = (d: InvoiceData) => `${d.amount} ${d.currency}`.trim();

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
  ul { padding-left: 22px; display: grid; gap: 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  td, th { border: 1px solid var(--line); padding: 10px 14px; font-size: 13.5px; text-align: left; vertical-align: top; }
  th { color: var(--muted); font-weight: 400; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.18em; }
  .num { text-align: right; white-space: nowrap; }
  .total { border: 1px solid var(--line); border-radius: 16px; padding: 26px 24px; margin-top: 14px; text-align: center; }
  .total .amt { font-size: 40px; line-height: 1; color: var(--bone); }
  .total .cap { font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--accent); margin-top: 10px; }
  .rule { border: 1px solid var(--line); border-radius: 14px; padding: 18px 20px; margin-top: 10px; white-space: pre-wrap; }
  .rule b { color: var(--bone); }
  .paid { display: inline-block; border: 1px solid var(--accent); color: var(--accent); border-radius: 999px; padding: 4px 14px; font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase; margin-bottom: 14px; }
  footer.doc { margin-top: 64px; border-top: 1px solid var(--line); padding-top: 18px; display: flex; justify-content: space-between; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); }
  .rule, table, .total, h2 { break-inside: avoid; page-break-inside: avoid; }
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

export function buildInvoice(d: InvoiceData): string {
  const lines = d.lines.filter((l) => l.label);
  const body = `
${d.paid ? `<div class="paid">Paid</div>` : ""}
<h1>Invoice ${esc(d.invoiceNo)}</h1>
<p class="sub">${esc(KIND_LABEL[d.kind])} · Issued ${fmtDate(d.issueDate)} · Due ${fmtDate(d.dueDate)}${d.contractRef ? ` · Against contract ${esc(d.contractRef)}` : ""}</p>

<h2>01 · Billed To</h2>
<table>
  <tr><th style="width:200px">Client</th><td>${esc(d.clientName)}${d.companyName ? `, ${esc(d.companyName)}` : ""}</td></tr>
  ${d.clientEmail ? `<tr><th>Email</th><td>${esc(d.clientEmail)}</td></tr>` : ""}
  ${d.projectType ? `<tr><th>Project</th><td>${esc(d.projectType)}${d.websiteType ? ` · ${esc(d.websiteType)}` : ""}</td></tr>` : ""}
  <tr><th>From</th><td>Amr Hassan, independent developer, operating as Amr Studio (not a licensed company)</td></tr>
</table>

<h2>02 · Charges</h2>
<table>
  <tr><th>Description</th><th class="num" style="width:170px">Amount</th></tr>
  ${lines.map((l) => `<tr><td>${esc(l.label)}</td><td class="num">${esc(l.amount)} ${esc(d.currency)}</td></tr>`).join("")}
  <tr><td><b>Total due</b></td><td class="num"><b>${esc(d.amount)} ${esc(d.currency)}</b></td></tr>
</table>
${d.contractTotal && d.kind !== "full" && d.kind !== "custom"
  ? `<p style="margin-top:10px;color:rgba(245,245,245,0.55);font-size:12.5px">Full contract value ${esc(d.contractTotal)} ${esc(d.currency)}${d.kind === "deposit" ? `, of which ${esc(d.upfrontPercent)}% is due upfront.` : ", this invoice settles the remaining balance."}</p>`
  : ""}

<div class="total">
  <div class="amt">${esc(money(d))}</div>
  <div class="cap">${d.paid ? "Paid in full · thank you" : `Amount due by ${fmtDate(d.dueDate)}`}</div>
</div>

${d.paymentDetails ? `<h2>03 · How To Pay</h2><div class="rule">${esc(d.paymentDetails)}</div>` : ""}

<h2>${d.paymentDetails ? "04" : "03"} · Terms</h2>
<div class="rule"><b>Payment window.</b> This invoice is due by ${fmtDate(d.dueDate)}. Work scheduled against it begins once payment clears.</div>
<div class="rule"><b>Scope.</b> This invoice covers the agreed scope in contract ${esc(d.contractRef || "on file")}. Anything beyond it is quoted separately.</div>
${d.notes ? `<div class="rule"><b>Notes.</b> ${esc(d.notes)}</div>` : ""}

<p style="margin-top:28px;color:rgba(245,245,245,0.55);font-size:12.5px">
  Amr Hassan · Independent developer, not a licensed company · Salmiya, Kuwait
</p>`;
  return shell(`Invoice ${d.invoiceNo} · ${d.clientName}`, body, "Invoice");
}
