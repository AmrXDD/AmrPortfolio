// __pitch_preview.mts
import { writeFileSync } from "node:fs";

// src/lib/constants.ts
var SITE = {
  name: "Amr",
  brand: "Amr Studio",
  role: "Creative Developer \xB7 Digital Experience Designer",
  tagline: "Independent creative developer in Salmiya, Kuwait. Cinematic interfaces, motion first websites, and product engineering for studios and founders who care about the millisecond.",
  shortTagline: "Designing cinematic interfaces and shipping software that feels inevitable.",
  city: "Salmiya, Kuwait",
  region: "KW",
  // Public contact address: shown on the site and in the schema.org JSON-LD.
  email: "info@amrstudio.dev",
  // E.164 format, digits only, used for wa.me links
  whatsapp: "96560318366",
  url: "https://amrstudio.dev",
  twitter: "@amrstudio",
  keywords: [
    "creative developer",
    "Kuwait web design",
    "Salmiya developer",
    "Next.js developer Kuwait",
    "motion design",
    "Framer Motion",
    "Three.js",
    "WebGL",
    "Lenis smooth scroll",
    "portfolio Kuwait",
    "frontend architect",
    "cinematic web design",
    "Awwwards",
    "Amr Studio"
  ]
};
var waLink = (msg) => `https://wa.me/${SITE.whatsapp}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;

// src/lib/emails/shell.ts
var BRAND = {
  ink: "#000000",
  panel: "#0d0d0f",
  bone: "#f5f5f5",
  body: "#dcdcdc",
  // rgba(245,245,245,0.85) flattened on ink
  muted: "#8a8a8a",
  // rgba(245,245,245,0.55) flattened on ink
  accent: "#ff4d1f",
  line: "#242426"
  // rgba(245,245,245,0.14) flattened on ink
};
var FONT = `'Nexium', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, Helvetica, Arial, sans-serif`;
var FONT_URL = `${SITE.url}/fonts/Nexium.otf`;
var esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
var h1 = (s) => `<h1 style="margin:0 0 6px;font-family:${FONT};font-size:38px;line-height:1.1;letter-spacing:0.01em;font-weight:400;color:${BRAND.bone};">${esc(s)}</h1>`;
var sub = (s) => `<p style="margin:0 0 36px;font-family:${FONT};font-size:13px;line-height:1.65;color:${BRAND.muted};">${esc(s)}</p>`;
var section = (s) => `<p style="margin:36px 0 12px;font-family:${FONT};font-size:13px;letter-spacing:0.26em;text-transform:uppercase;color:${BRAND.accent};">${esc(s)}</p>`;
var p = (s, opts = {}) => `<p style="margin:0 0 14px;font-family:${FONT};font-size:14.5px;line-height:1.65;color:${BRAND.body};">${opts.html ? s : esc(s)}</p>`;
var bullets = (items) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 14px;">${items.filter(Boolean).map(
  (it) => `<tr><td width="22" valign="top" style="padding:6px 0 0;font-family:${FONT};font-size:14.5px;line-height:1;color:${BRAND.accent};">&bull;</td><td style="padding:0 0 8px;font-family:${FONT};font-size:14.5px;line-height:1.65;color:${BRAND.body};">${esc(it)}</td></tr>`
).join("")}</table>`;
var button = (label, href) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 6px;"><tr><td align="center" bgcolor="${BRAND.accent}" style="border-radius:999px;"><a href="${esc(href)}" style="display:inline-block;padding:13px 28px;font-family:${FONT};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#000000;text-decoration:none;border-radius:999px;">${esc(label)}</a></td></tr></table>`;
var linkRow = (label, href) => `<p style="margin:8px 0 0;font-family:${FONT};font-size:13px;line-height:1.65;color:${BRAND.muted};">${esc(label)} <a href="${esc(href)}" style="color:${BRAND.accent};text-decoration:none;">${esc(href.replace(/^https?:\/\//, ""))}</a></p>`;
var ringLogo = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="34" height="34" bgcolor="${BRAND.accent}" style="width:34px;height:34px;border-radius:50%;background-image:linear-gradient(135deg,#FF4D1F 0%,#7C3AED 38%,#22D3EE 68%,#FF4D1F 100%);">
  <tr><td align="center" valign="middle" style="padding:4px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="26" height="26" bgcolor="${BRAND.ink}" style="width:26px;height:26px;border-radius:50%;">
      <tr><td align="center" valign="middle" style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:17px;line-height:26px;color:${BRAND.bone};">a</td></tr>
    </table>
  </td></tr>
</table>`;
function emailShell({ preheader, badge, body, footerNote }) {
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
function toText(html) {
  return html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<head[\s\S]*?<\/head>/gi, "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|tr|h1|h2|h3|div|table)>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&bull;/g, "-").replace(/&middot;/g, "\xB7").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\n{3,}/g, "\n\n").trim();
}

// src/lib/emails/templates.ts
var pack = (subject, html) => ({ subject, html, text: toText(html) });
function coldPitchEmail(d) {
  const who = (d.company || "").trim() || "you";
  const hook = (d.hook || "").trim() || "An outside read on";
  const opener = `${hook} ${who}`;
  const body = [
    h1(`${opener}.`),
    sub(`${SITE.role} \xB7 ${SITE.city}`),
    p(d.observation),
    p(d.angle),
    ...d.offer.length ? [section("What I do"), bullets(d.offer)] : [],
    ...d.proof.length ? [section("Recent work"), bullets(d.proof)] : [],
    p("If this is worth ten minutes, reply to this email or message me directly. No pitch deck, just a conversation about whether it's a fit."),
    button("Start a conversation", waLink(`Hi Amr, saw your note about ${who}.`)),
    linkRow(d.proofUrl ? "Relevant work:" : "The portfolio:", d.proofUrl || SITE.url)
  ].join("");
  return pack(
    opener,
    emailShell({
      preheader: d.observation.slice(0, 120),
      badge: "Introduction",
      body,
      footerNote: "Sent once by a person, not a list. Reply 'no thanks' and you'll never hear from me again."
    })
  );
}

// __pitch_preview.mts
var m = coldPitchEmail({
  company: "Mirror Studio",
  hook: "A second opinion on",
  observation: "Your consultancy positions itself on outcomes, but the site leads with services. The two are fighting each other.",
  angle: "I'd restructure it around the transformation you sell, not the deliverables you ship.",
  offer: ["Positioning and messaging audits for founder-led firms", "Conversion-focused site restructures", "Go-to-market copy that sounds like a person"],
  proof: ["Scenarios: repositioned a contractor as a creative studio; first international RFP within a month", "LivFunctional: bilingual funnel converting cold traffic at 4.1%"],
  proofUrl: "https://scenariosd.vercel.app"
});
writeFileSync("public/__pitch.html", m.html);
console.log("SUBJECT:", m.subject);
console.log("has em-dash in text:", m.text.includes("\u2014"));
