/*
 * Branded email shell — a faithful port of the contract-document look
 * (src/app/admin/contract/doc-builders.ts) into email-safe HTML.
 *
 * The document CSS this mirrors, value for value:
 *   --ink:#000  --bone:#f5f5f5  --accent:#ff4d1f
 *   --line:rgba(245,245,245,0.14)  --muted:rgba(245,245,245,0.55)
 *   h1 44px/1.1 · .sub 13px muted · h2 13px 0.26em uppercase ember
 *   body 14.5px rgba(245,245,245,0.85) · th 10.5px 0.18em uppercase
 *   .rule 1px border radius 14px · .step .no ember 22px
 *
 * Email constraints that shape the port:
 *  - table layout + inline styles (Gmail drops <style>, Outlook drops flex/grid)
 *  - font names MUST be single-quoted: they sit inside a double-quoted style
 *    attribute, and double quotes there terminate the attribute and kill the
 *    whole declaration
 *  - conic-gradient is unsupported, so the ring logo is rebuilt from nested
 *    tables: gradient outer disc, black inner disc, bone italic "a". That keeps
 *    the mark correct even when a client blocks images.
 */

import { SITE } from "@/lib/constants";

export const BRAND = {
  ink: "#000000",
  panel: "#0d0d0f",
  bone: "#f5f5f5",
  body: "#dcdcdc", // rgba(245,245,245,0.85) flattened on ink
  muted: "#8a8a8a", // rgba(245,245,245,0.55) flattened on ink
  accent: "#ff4d1f",
  line: "#242426", // rgba(245,245,245,0.14) flattened on ink
} as const;

/* Nexium first (clients that honour @font-face), then the document's own
   fallback chain. Single quotes only — see the header note. */
const FONT = `'Nexium', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, Helvetica, Arial, sans-serif`;

const FONT_URL = `${SITE.url}/fonts/Nexium.otf`;

export const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/* ── content atoms, matching the document type scale ───────────────────── */

export const h1 = (s: string) =>
  `<h1 style="margin:0 0 6px;font-family:${FONT};font-size:38px;line-height:1.1;letter-spacing:0.01em;font-weight:400;color:${BRAND.bone};">${esc(s)}</h1>`;

export const sub = (s: string) =>
  `<p style="margin:0 0 36px;font-family:${FONT};font-size:13px;line-height:1.65;color:${BRAND.muted};">${esc(s)}</p>`;

export const section = (s: string) =>
  `<p style="margin:36px 0 12px;font-family:${FONT};font-size:13px;letter-spacing:0.26em;text-transform:uppercase;color:${BRAND.accent};">${esc(s)}</p>`;

export const p = (s: string, opts: { html?: boolean } = {}) =>
  `<p style="margin:0 0 14px;font-family:${FONT};font-size:14.5px;line-height:1.65;color:${BRAND.body};">${opts.html ? s : esc(s)}</p>`;

/** Ember-bulleted list — the documents' <ul>. */
export const bullets = (items: string[]) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 14px;">${items
    .filter(Boolean)
    .map(
      (it) =>
        `<tr><td width="22" valign="top" style="padding:6px 0 0;font-family:${FONT};font-size:14.5px;line-height:1;color:${BRAND.accent};">&bull;</td><td style="padding:0 0 8px;font-family:${FONT};font-size:14.5px;line-height:1.65;color:${BRAND.body};">${esc(it)}</td></tr>`
    )
    .join("")}</table>`;

/** Fully bordered detail table — the documents' <table> with <th>/<td>. */
export const kv = (rows: [string, string][]) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 14px;border-collapse:collapse;">${rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td width="190" valign="top" style="border:1px solid ${BRAND.line};padding:10px 14px;font-family:${FONT};font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.muted};">${esc(k)}</td><td valign="top" style="border:1px solid ${BRAND.line};padding:10px 14px;font-family:${FONT};font-size:13.5px;line-height:1.6;color:${BRAND.bone};">${esc(v)}</td></tr>`
    )
    .join("")}</table>`;

/** Rounded bordered panel — the documents' .rule. */
export const panel = (lead: string, body: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:10px 0 0;border:1px solid ${BRAND.line};border-radius:14px;"><tr><td style="padding:18px 20px;font-family:${FONT};font-size:14.5px;line-height:1.65;color:${BRAND.body};"><strong style="color:${BRAND.bone};font-weight:600;">${esc(lead)}</strong> ${esc(body)}</td></tr></table>`;

/** Numbered step card — the documents' .step. */
export const step = (no: string, head: string, body: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:12px 0 0;border:1px solid ${BRAND.line};border-radius:14px;"><tr><td width="52" valign="top" style="padding:18px 0 18px 20px;font-family:${FONT};font-size:22px;line-height:1;color:${BRAND.accent};">${esc(no)}</td><td valign="top" style="padding:18px 20px 18px 0;"><p style="margin:0 0 4px;font-family:${FONT};font-size:15px;line-height:1.4;color:${BRAND.bone};">${esc(head)}</p><p style="margin:0;font-family:${FONT};font-size:14.5px;line-height:1.65;color:${BRAND.body};">${esc(body)}</p></td></tr></table>`;

/** Centred hero figure — the proposal document's .price block. */
export const hero = (amount: string, caption: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:12px 0 14px;border:1px solid ${BRAND.line};border-radius:16px;"><tr><td align="center" style="padding:26px 24px;"><div style="font-family:${FONT};font-size:40px;line-height:1;color:${BRAND.bone};">${esc(amount)}</div><div style="margin-top:10px;font-family:${FONT};font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:${BRAND.accent};">${esc(caption)}</div></td></tr></table>`;

export const button = (label: string, href: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 6px;"><tr><td align="center" bgcolor="${BRAND.accent}" style="border-radius:999px;"><a href="${esc(href)}" style="display:inline-block;padding:13px 28px;font-family:${FONT};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#000000;text-decoration:none;border-radius:999px;">${esc(label)}</a></td></tr></table>`;

export const linkRow = (label: string, href: string) =>
  `<p style="margin:8px 0 0;font-family:${FONT};font-size:13px;line-height:1.65;color:${BRAND.muted};">${esc(label)} <a href="${esc(href)}" style="color:${BRAND.accent};text-decoration:none;">${esc(href.replace(/^https?:\/\//, ""))}</a></p>`;

/* ── the ring logo, rebuilt without conic-gradient ─────────────────────── */
/* Outer 34px disc carries the ember→violet→cyan sweep (linear stand-in for the
   conic); Outlook ignores the gradient and keeps the solid ember bgcolor. The
   inner 26px black disc and bone italic "a" complete the mark. */
const ringLogo = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="34" height="34" bgcolor="${BRAND.accent}" style="width:34px;height:34px;border-radius:50%;background-image:linear-gradient(135deg,#FF4D1F 0%,#7C3AED 38%,#22D3EE 68%,#FF4D1F 100%);">
  <tr><td align="center" valign="middle" style="padding:4px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="26" height="26" bgcolor="${BRAND.ink}" style="width:26px;height:26px;border-radius:50%;">
      <tr><td align="center" valign="middle" style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:17px;line-height:26px;color:${BRAND.bone};">a</td></tr>
    </table>
  </td></tr>
</table>`;

/* ── the shell ─────────────────────────────────────────────────────────── */

export type ShellOpts = {
  preheader: string;
  badge: string;
  body: string;
  footerNote?: string;
};

export function emailShell({ preheader, badge, body, footerNote }: ShellOpts): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(badge)}</title>
<style>
  @font-face { font-family: 'Nexium'; src: url('${FONT_URL}') format('opentype'); font-display: swap; }
  body { margin:0; padding:0; background:${BRAND.ink}; }
  a { text-decoration: none; }
  @media only screen and (max-width:620px) {
    .shell { width:100% !important; }
    .h1 { font-size:30px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.ink};">
<div style="display:none;font-size:1px;color:${BRAND.ink};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${esc(preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${BRAND.ink}" style="background:${BRAND.ink};">
<tr><td align="center" style="padding:40px 16px 56px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="shell" style="width:600px;max-width:100%;">

  <!-- header: ring logo + wordmark, ember badge -->
  <tr><td style="padding:0 0 24px;border-bottom:1px solid ${BRAND.line};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td valign="middle">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="34" valign="middle">${ringLogo}</td>
          <td valign="middle" style="padding-left:12px;font-family:${FONT};font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:${BRAND.bone};">Amr/Studio</td>
        </tr></table>
      </td>
      <td align="right" valign="middle" style="font-family:${FONT};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${BRAND.accent};">${esc(badge)}</td>
    </tr></table>
  </td></tr>

  <!-- body -->
  <tr><td style="padding:40px 0 0;">${body}</td></tr>

  <!-- footer -->
  <tr><td style="padding:64px 0 0;">
    ${footerNote ? `<p style="margin:0 0 18px;font-family:${FONT};font-size:12px;line-height:1.65;color:${BRAND.muted};">${esc(footerNote)}</p>` : ""}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid ${BRAND.line};"><tr>
      <td style="padding:18px 0 0;font-family:${FONT};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND.muted};">Amr Hassan &middot; Independent Developer</td>
      <td align="right" style="padding:18px 0 0;font-family:${FONT};font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND.muted};">Salmiya, Kuwait &middot; GMT+3</td>
    </tr></table>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

/** Crude HTML→text so every send has a plaintext part (deliverability). */
export function toText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|tr|h1|h2|h3|div|table)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&bull;/g, "-")
    .replace(/&middot;/g, "·")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
