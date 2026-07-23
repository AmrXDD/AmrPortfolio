/*
 * Native PDF builders (pdf-lib + fontkit), run in the browser. Produces dark,
 * on-brand A4 documents with the real Nexium face embedded, the exact conic
 * ring logo (drawn on a canvas and embedded as PNG), crisp selectable text,
 * generous spacing, and a clear hierarchy. No html2canvas, no screenshots.
 */

import { PDFDocument, PDFFont, PDFImage, PDFPage, rgb, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { type ContractData, fmtDate } from "./doc-builders";

const A4 = { w: 595.28, h: 841.89 };
const MX = 56; // side margin
const TOP = 62;
const BOTTOM = 70;
const CONTENT = A4.w - MX * 2;

const INK = rgb(0, 0, 0);
const BONE = rgb(0.96, 0.96, 0.96);
const BODY = rgb(0.82, 0.82, 0.82);
const MUTED = rgb(0.5, 0.5, 0.52);
const ACCENT = rgb(1, 0.302, 0.122);
const LINE = rgb(0.19, 0.19, 0.2);
const PANEL = rgb(0.06, 0.06, 0.07);

const refId = (d: ContractData) =>
  `AS-${(d.dateOfIssue || "").replace(/-/g, "")}-${(d.clientName || "X").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "CLT"}`;

const money = (d: ContractData) => `${d.price} ${d.currency}`.trim();

/* ── shared, cached assets ── */
let fontBytesP: Promise<ArrayBuffer> | null = null;
function fontBytes() {
  if (!fontBytesP) fontBytesP = fetch("/fonts/Nexium.otf").then((r) => r.arrayBuffer());
  return fontBytesP;
}

/* Draw the exact site logo (conic ring + inner disc + "a") on a canvas and
   return PNG bytes, so the PDF logo matches the site precisely. */
let logoPngP: Promise<Uint8Array> | null = null;
function logoPng(): Promise<Uint8Array> {
  if (logoPngP) return logoPngP;
  logoPngP = new Promise((resolve) => {
    const S = 128;
    const c = document.createElement("canvas");
    c.width = S;
    c.height = S;
    const x = c.getContext("2d")!;
    const g = (x as CanvasRenderingContext2D & {
      createConicGradient?: (a: number, x: number, y: number) => CanvasGradient;
    }).createConicGradient?.(-Math.PI / 2, S / 2, S / 2);
    if (g) {
      g.addColorStop(0, "#FF4D1F");
      g.addColorStop(0.34, "#7C3AED");
      g.addColorStop(0.67, "#22D3EE");
      g.addColorStop(1, "#FF4D1F");
      x.fillStyle = g;
    } else {
      x.fillStyle = "#FF4D1F";
    }
    x.beginPath();
    x.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
    x.fill();
    // inner disc
    x.fillStyle = "#000";
    x.beginPath();
    x.arc(S / 2, S / 2, S / 2 - 14, 0, Math.PI * 2);
    x.fill();
    // the "a"
    x.fillStyle = "#f5f5f5";
    x.font = "italic 74px Georgia, serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("a", S / 2, S / 2 + 6);
    const url = c.toDataURL("image/png");
    const bin = atob(url.split(",")[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    resolve(bytes);
  });
  return logoPngP;
}

/* ── layout engine ── */
class Doc {
  pdf!: PDFDocument;
  font!: PDFFont;
  logo!: PDFImage;
  page!: PDFPage;
  y = 0;
  chars = new Set<number>();
  label = "";

  async init(label: string) {
    this.label = label;
    this.pdf = await PDFDocument.create();
    this.pdf.registerFontkit(fontkit);
    // NOT subset — see proposal-pdf.ts. Subsetting this OTF produces a CFF
    // font that viewers space wrongly ("Br and sit e"); the whole face is
    // ~28KB, so embedding it entirely costs nothing and renders correctly.
    this.font = await this.pdf.embedFont(await fontBytes(), { subset: false });
    this.font.getCharacterSet().forEach((c) => this.chars.add(c));
    this.logo = await this.pdf.embedPng(await logoPng());
    this.newPage();
  }

  safe(s: string) {
    let o = "";
    for (const ch of s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"'))
      o += this.chars.has(ch.codePointAt(0) ?? 63) ? ch : "?";
    return o;
  }
  w(s: string, size: number) {
    return this.font.widthOfTextAtSize(this.safe(s), size);
  }
  draw(s: string, x: number, size: number, color: RGB, y = this.y) {
    this.page.drawText(this.safe(s), { x, y, size, font: this.font, color });
  }
  wrap(s: string, size: number, maxW: number) {
    const out: string[] = [];
    let cur = "";
    for (const word of this.safe(s).split(/\s+/).filter(Boolean)) {
      const t = cur ? `${cur} ${word}` : word;
      if (this.font.widthOfTextAtSize(t, size) <= maxW) cur = t;
      else {
        if (cur) out.push(cur);
        cur = word;
      }
    }
    if (cur) out.push(cur);
    return out.length ? out : [""];
  }

  newPage() {
    this.page = this.pdf.addPage([A4.w, A4.h]);
    this.page.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: INK });
    this.y = A4.h - TOP;
    // brand header
    const cy = this.y - 5;
    this.page.drawImage(this.logo, { x: MX, y: cy - 11, width: 26, height: 26 });
    this.draw("AMR/STUDIO", MX + 36, 10.5, BONE, cy - 3.5);
    const lbl = this.label.toUpperCase();
    this.draw(lbl, A4.w - MX - this.w(lbl, 9), 9, ACCENT, cy - 3);
    this.y = cy - 24;
    this.hr();
    this.y -= 30;
  }
  ensure(h: number) {
    if (this.y - h < BOTTOM + 24) this.newPage();
  }
  hr(y = this.y) {
    this.page.drawLine({ start: { x: MX, y }, end: { x: A4.w - MX, y }, thickness: 0.6, color: LINE });
  }
  gap(h: number) {
    this.y -= h;
  }

  title(s: string) {
    this.ensure(48);
    this.draw(s, MX, 26, BONE);
    this.gap(14);
  }
  sub(s: string) {
    this.ensure(26);
    this.draw(s, MX, 10, MUTED);
    this.gap(30);
  }
  section(s: string) {
    this.ensure(46);
    this.gap(14);
    this.draw(s.toUpperCase(), MX, 10, ACCENT);
    this.gap(22);
  }
  para(s: string, color = BODY, size = 10.8) {
    for (const line of this.wrap(s, size, CONTENT)) {
      this.ensure(size + 7);
      this.draw(line, MX, size, color);
      this.gap(size + 6.5);
    }
  }
  bullets(items: string[]) {
    for (const it of items.filter(Boolean)) {
      const lines = this.wrap(it, 10.8, CONTENT - 16);
      this.ensure(lines.length * 17 + 4);
      this.page.drawCircle({ x: MX + 3, y: this.y + 3.5, size: 1.7, color: ACCENT });
      lines.forEach((line, i) => {
        this.draw(line, MX + 14, 10.8, BODY, this.y);
        if (i < lines.length - 1) this.gap(16);
      });
      this.gap(20);
    }
  }
  kv(rows: [string, string[]][]) {
    const lw = 128;
    const vx = MX + lw + 18;
    const vW = A4.w - MX - vx;
    this.hr();
    for (const [k, vals] of rows) {
      const lines = vals.flatMap((v) => this.wrap(v, 10.8, vW));
      const rowH = Math.max(30, lines.length * 15.5 + 15);
      this.ensure(rowH);
      this.gap(19);
      this.draw(k.toUpperCase(), MX, 8.5, MUTED);
      let vy = this.y + 0.5;
      for (const line of lines) {
        this.draw(line, vx, 10.8, rgb(0.9, 0.9, 0.9), vy);
        vy -= 15.5;
      }
      this.y = Math.min(this.y, vy + 15.5) - 12;
      this.hr();
    }
    this.gap(6);
  }
  rule(lead: string, body: string) {
    const pad = 15;
    const maxW = CONTENT - pad * 2;
    const L = this.wrap(lead, 10.8, maxW);
    const B = this.wrap(body, 10.2, maxW);
    const h = pad * 2 + L.length * 15.5 + B.length * 14.5 + 3;
    this.ensure(h + 12);
    this.page.drawRectangle({
      x: MX, y: this.y - h + 11, width: CONTENT, height: h,
      color: PANEL, borderColor: LINE, borderWidth: 0.7,
    });
    this.gap(pad);
    for (const l of L) { this.draw(l, MX + pad, 10.8, BONE); this.gap(15.5); }
    this.gap(2);
    for (const b of B) { this.draw(b, MX + pad, 10.2, rgb(0.75, 0.75, 0.75)); this.gap(14.5); }
    this.gap(pad + 12);
  }
  step(no: string, head: string, body: string) {
    const pad = 15;
    const tx = MX + pad + 40;
    const maxW = A4.w - MX - tx - pad;
    const B = this.wrap(body, 10.2, maxW);
    const h = pad * 2 + 18 + B.length * 14.5;
    this.ensure(h + 12);
    this.page.drawRectangle({
      x: MX, y: this.y - h + 11, width: CONTENT, height: h,
      color: PANEL, borderColor: LINE, borderWidth: 0.7,
    });
    this.draw(no, MX + pad, 21, ACCENT, this.y - pad - 4);
    this.gap(pad);
    this.draw(head, tx, 12.5, BONE);
    this.gap(20);
    for (const b of B) { this.draw(b, tx, 10.2, rgb(0.75, 0.75, 0.75)); this.gap(14.5); }
    this.gap(pad + 12);
  }
  signatures(d: ContractData) {
    this.ensure(120);
    const colW = (CONTENT - 34) / 2;
    const x2 = MX + colW + 34;
    const top = this.y;
    const block = (x: number, name: string, role: string) => {
      let y = top;
      this.page.drawText(this.safe(name), { x, y, size: 14, font: this.font, color: BONE });
      y -= 15;
      for (const l of this.wrap(role.toUpperCase(), 7.5, colW)) {
        this.page.drawText(this.safe(l), { x, y, size: 7.5, font: this.font, color: ACCENT });
        y -= 11;
      }
      y -= 30;
      this.page.drawLine({ start: { x, y }, end: { x: x + colW, y }, thickness: 0.9, color: rgb(0.42, 0.42, 0.42) });
      y -= 13;
      this.page.drawText("SIGNATURE  /  DATE", { x, y, size: 7, font: this.font, color: MUTED });
      return y;
    };
    const y1 = block(MX, "Amr Hassan", "Independent developer and not a licensed company");
    const y2 = block(x2, d.clientName || "Client", d.companyName || "Client");
    this.y = Math.min(y1, y2) - 12;
  }
  async finish(): Promise<Uint8Array> {
    for (const p of this.pdf.getPages()) {
      p.drawLine({ start: { x: MX, y: 48 }, end: { x: A4.w - MX, y: 48 }, thickness: 0.6, color: LINE });
      p.drawText("AMR HASSAN, INDEPENDENT DEVELOPER", { x: MX, y: 36, size: 7, font: this.font, color: MUTED });
      const r = "SALMIYA, KUWAIT  ·  GMT+3";
      p.drawText(r, { x: A4.w - MX - this.font.widthOfTextAtSize(r, 7), y: 36, size: 7, font: this.font, color: MUTED });
    }
    return this.pdf.save();
  }
}

/* ───── Contract ───── */
export async function buildContractPdf(d: ContractData): Promise<Uint8Array> {
  const doc = new Doc();
  await doc.init("Service Agreement");
  doc.title("Service Agreement");
  doc.sub(`Reference ${refId(d)}   ·   Issued ${fmtDate(d.dateOfIssue)}`);

  doc.section("01 · Parties");
  doc.kv([
    ["Developer", ["Amr Hassan, independent developer, operating as Amr Studio (not a licensed company)"]],
    ["Client", [`${d.clientName}${d.companyName ? `, representing ${d.companyName}` : ""}`]],
  ]);

  doc.section("02 · Project");
  doc.kv([
    ["Project type", [d.projectType]],
    ["Website type", [d.websiteType]],
    ...(d.companyName ? ([["Company", [d.companyName]]] as [string, string[]][]) : []),
    ["Date of issue", [fmtDate(d.dateOfIssue)]],
  ]);

  doc.section("03 · Agreed Scope");
  doc.para("The following deliverables define the full and final scope of this engagement:");
  doc.gap(6);
  doc.bullets(d.scope);
  if (d.notes) { doc.gap(2); doc.para(`Additional notes: ${d.notes}`, MUTED, 10.2); }

  doc.section("04 · Price & Payment");
  doc.kv([
    ["Total price", [money(d)]],
    ["Upfront", [`${d.upfrontPercent}% upon signing`]],
    ["Payment timeline", d.paymentTimeline],
  ]);

  doc.section("05 · General Rules");
  doc.rule("Refunds, client initiated.", "A refund requested by the client after 24 hours of payment completion is approved after deducting 40% of the upfront. After one week or more, 70% of the paid amount is deducted.");
  doc.rule("Refunds, developer initiated.", "If the refund is initiated by the developer, the full paid amount is returned, regardless of the time elapsed.");
  doc.rule("Edits & scope.", "Requested edits are allowed while the project is in development. No new features will be added beyond the agreed scope listed in section 03.");

  doc.section("06 · Signatures");
  doc.gap(8);
  doc.signatures(d);
  return doc.finish();
}

/* ───── Welcome ───── */
export async function buildWelcomePdf(d: ContractData): Promise<Uint8Array> {
  const doc = new Doc();
  await doc.init("Welcome");
  const first = (d.clientName || "there").split(" ")[0];
  doc.title(`Welcome aboard, ${first}.`);
  doc.sub(`${d.projectType}   ·   ${d.websiteType}   ·   Ref ${refId(d)}`);
  doc.para(`Thank you for trusting me with ${d.companyName || "your project"}. From here on, you have one developer, one point of contact, and one standard: work that feels inevitable.`);

  doc.section("What we agreed on");
  doc.bullets(d.scope);

  doc.section("The numbers");
  doc.kv([
    ["Total", [money(d)]],
    ["Upfront", [`${d.upfrontPercent}% upon signing`]],
    ["Timeline", d.paymentTimeline],
  ]);

  doc.section("How we work");
  doc.bullets([
    "Direct line on WhatsApp, replies in minutes during Kuwait daytime (GMT+3).",
    "You will see real progress, not mockups: live preview links as the build ships.",
    "Edits are welcome throughout development. New features beyond the agreed scope are a new conversation.",
  ]);

  doc.gap(8);
  doc.para(`Signed alongside your service agreement dated ${fmtDate(d.dateOfIssue)}. Check the companion file What's Next for the exact next steps.`, MUTED, 10.2);
  return doc.finish();
}

/* ───── What's Next ───── */
export async function buildWhatsNextPdf(d: ContractData): Promise<Uint8Array> {
  const doc = new Doc();
  await doc.init("What's Next");
  doc.title("What happens next");
  doc.sub(`${d.clientName}${d.companyName ? `  ·  ${d.companyName}` : ""}   ·   ${d.projectType}   ·   Issued ${fmtDate(d.dateOfIssue)}`);

  const steps: [string, string, string][] = [
    ["01", "Sign & send the upfront", `Sign the agreement (Ref ${refId(d)}) and complete the ${d.upfrontPercent}% upfront. Development is scheduled the moment it lands.`],
    ["02", "Kickoff handover", `Send everything the build needs: brand assets, copy, images, access, and references for your ${d.websiteType.toLowerCase() || "site"}. Missing pieces get flagged in the first 48 hours.`],
    ["03", "Build & live previews", "You receive a private preview link and watch the project take shape. Request edits at any point while development is running."],
    ["04", "Review round", "A structured walkthrough of the finished build against the agreed scope, with a final round of refinements."],
    ["05", "Final payment & delivery", "Settle the remaining balance per the payment timeline, then receive the full handover: deployment, credentials, and source."],
  ];
  for (const [no, head, body] of steps) doc.step(no, head, body);

  doc.section("Keep in mind");
  doc.bullets([
    "Edits are free while we build. Features outside the agreed scope are quoted separately.",
    "Refund terms follow the signed agreement: client initiated refunds after 24 hours deduct 40% of the upfront, after a week 70% of the paid amount. If I initiate the refund, you get everything back.",
    "Everything routes through one WhatsApp thread, no ticket systems, no waiting queues.",
  ]);
  return doc.finish();
}
