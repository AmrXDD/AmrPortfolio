/*
 * Branded email shell — the exact look of the contract generator documents
 * (ink #000 ground, bone type, ember accent, ring logo, uppercase tracked
 * section labels) rebuilt for email clients.
 *
 * Email rules that shape this file:
 *  - table-based layout + inline styles only (Gmail strips <style> blocks,
 *    Outlook ignores flex/grid)
 *  - no web fonts: Nexium can't load in mail, so we fall back to the same
 *    system stack the documents use as their fallback
 *  - no conic-gradient (unsupported): the ring logo is rebuilt as a solid
 *    ember disc with the italic "a", which renders identically everywhere
 */

export const BRAND = {
  ink: "#000000",
  panel: "#0d0d0f",
  bone: "#f5f5f5",
  body: "#d4d4d4",
  muted: "#8a8a8a",
  accent: "#ff4d1f",
  line: "#242426",
} as const;

const FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, Helvetica, Arial, sans-serif`;

export const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/* ── content atoms ─────────────────────────────────────────────────────── */

/** Big display headline. */
export const h1 = (s: string) =>
  `<h1 style="margin:0 0 8px;font-family:${FONT};font-size:28px;line-height:1.15;font-weight:600;color:${BRAND.bone};">${esc(s)}</h1>`;

/** Muted line under the headline (reference / date / meta). */
export const sub = (s: string) =>
  `<p style="margin:0 0 28px;font-family:${FONT};font-size:13px;line-height:1.6;color:${BRAND.muted};">${esc(s)}</p>`;

/** Uppercase tracked ember section label, same as the documents. */
export const section = (s: string) =>
  `<p style="margin:32px 0 12px;font-family:${FONT};font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:${BRAND.accent};">${esc(s)}</p>`;

/** Body paragraph. Pass `html` when the string already contains safe markup. */
export const p = (s: string, opts: { html?: boolean } = {}) =>
  `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.65;color:${BRAND.body};">${opts.html ? s : esc(s)}</p>`;

/** Ember-bulleted list (table-based so Outlook keeps the alignment). */
export const bullets = (items: string[]) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 14px;">${items
    .filter(Boolean)
    .map(
      (it) =>
        `<tr><td width="18" valign="top" style="padding:5px 0 0;font-family:${FONT};font-size:15px;line-height:1;color:${BRAND.accent};">&bull;</td><td style="padding:0 0 9px;font-family:${FONT};font-size:15px;line-height:1.6;color:${BRAND.body};">${esc(it)}</td></tr>`
    )
    .join("")}</table>`;

/** Key/value rows with hairline rules — the documents' detail tables. */
export const kv = (rows: [string, string][]) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 14px;border-top:1px solid ${BRAND.line};">${rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td width="150" valign="top" style="padding:13px 12px 13px 0;border-bottom:1px solid ${BRAND.line};font-family:${FONT};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${BRAND.muted};">${esc(k)}</td><td valign="top" style="padding:13px 0;border-bottom:1px solid ${BRAND.line};font-family:${FONT};font-size:14px;line-height:1.6;color:${BRAND.bone};">${esc(v)}</td></tr>`
    )
    .join("")}</table>`;

/** Bordered panel — the documents' "rule" box. */
export const panel = (lead: string, body: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px;background:${BRAND.panel};border:1px solid ${BRAND.line};border-radius:12px;"><tr><td style="padding:16px 18px;font-family:${FONT};font-size:14px;line-height:1.6;color:${BRAND.body};"><strong style="color:${BRAND.bone};">${esc(lead)}</strong> ${esc(body)}</td></tr></table>`;

/** Numbered step card. */
export const step = (no: string, head: string, body: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 12px;background:${BRAND.panel};border:1px solid ${BRAND.line};border-radius:12px;"><tr><td width="46" valign="top" style="padding:16px 0 16px 18px;font-family:${FONT};font-size:20px;line-height:1;color:${BRAND.accent};">${esc(no)}</td><td valign="top" style="padding:16px 18px 16px 0;"><p style="margin:0 0 4px;font-family:${FONT};font-size:15px;font-weight:600;color:${BRAND.bone};">${esc(head)}</p><p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.6;color:${BRAND.body};">${esc(body)}</p></td></tr></table>`;

/** Solid ember call-to-action button (bulletproof-ish for Outlook). */
export const button = (label: string, href: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 6px;"><tr><td align="center" bgcolor="${BRAND.accent}" style="border-radius:999px;"><a href="${esc(href)}" style="display:inline-block;padding:13px 28px;font-family:${FONT};font-size:12px;letter-spacing:0.16em;text-transform:uppercase;font-weight:600;color:#000000;text-decoration:none;border-radius:999px;">${esc(label)}</a></td></tr></table>`;

/** Quiet secondary link row. */
export const linkRow = (label: string, href: string) =>
  `<p style="margin:8px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${BRAND.muted};">${esc(label)} <a href="${esc(href)}" style="color:${BRAND.accent};text-decoration:none;">${esc(href.replace(/^https?:\/\//, ""))}</a></p>`;

/* ── the shell ─────────────────────────────────────────────────────────── */

export type ShellOpts = {
  /** Inbox preview line (hidden in the body). */
  preheader: string;
  /** Ember label top-right, mirrors the documents' accent tag. */
  badge: string;
  /** Main content, built from the atoms above. */
  body: string;
  /** Optional footer note above the signature block. */
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
</head>
<body style="margin:0;padding:0;background:${BRAND.ink};">
<div style="display:none;font-size:1px;color:${BRAND.ink};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${esc(preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${BRAND.ink}" style="background:${BRAND.ink};">
<tr><td align="center" style="padding:32px 16px 48px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%;">

  <!-- header: ring logo + wordmark, ember badge -->
  <tr><td style="padding:0 0 22px;border-bottom:1px solid ${BRAND.line};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td valign="middle">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="34" valign="middle">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="34" height="34" bgcolor="${BRAND.accent}" style="width:34px;height:34px;border-radius:50%;">
              <tr><td align="center" valign="middle" style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:18px;color:#000000;line-height:34px;">a</td></tr>
            </table>
          </td>
          <td style="padding-left:11px;font-family:${FONT};font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:${BRAND.bone};">Amr/Studio</td>
        </tr></table>
      </td>
      <td align="right" valign="middle" style="font-family:${FONT};font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${BRAND.accent};">${esc(badge)}</td>
    </tr></table>
  </td></tr>

  <!-- body -->
  <tr><td style="padding:36px 0 0;">${body}</td></tr>

  <!-- footer -->
  <tr><td style="padding:44px 0 0;">
    ${footerNote ? `<p style="margin:0 0 18px;font-family:${FONT};font-size:12px;line-height:1.6;color:${BRAND.muted};">${esc(footerNote)}</p>` : ""}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid ${BRAND.line};"><tr>
      <td style="padding:16px 0 0;font-family:${FONT};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.muted};">Amr Hassan &middot; Independent Developer</td>
      <td align="right" style="padding:16px 0 0;font-family:${FONT};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.muted};">Salmiya, Kuwait &middot; GMT+3</td>
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
