/*
 * Native invoice PDF (pdf-lib + fontkit), built in the browser — same system as
 * the contract and proposal PDFs. Note the font is embedded WHOLE, not subset:
 * subsetting this OTF emits a CFF font that viewers space wrongly.
 */

import { PDFDocument, PDFFont, PDFImage, PDFPage, rgb, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { type InvoiceData, fmtDate, KIND_LABEL, money } from "./invoice-doc";

const A4 = { w: 595.28, h: 841.89 };
const MX = 56;
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

let fontBytesP: Promise<ArrayBuffer> | null = null;
function fontBytes() {
  if (!fontBytesP) fontBytesP = fetch("/fonts/Nexium.otf").then((r) => r.arrayBuffer());
  return fontBytesP;
}

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
    x.fillStyle = "#000";
    x.beginPath();
    x.arc(S / 2, S / 2, S / 2 - 14, 0, Math.PI * 2);
    x.fill();
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
    // Whole face, never subset — see the note at the top of this file.
    this.font = await this.pdf.embedFont(await fontBytes(), { subset: false });
    this.font.getCharacterSet().forEach((c) => this.chars.add(c));
    this.logo = await this.pdf.embedPng(await logoPng());
    this.newPage();
  }

  safe(s: string) {
    let o = "";
    for (const ch of String(s ?? "").replace(/[’‘]/g, "'").replace(/[“”]/g, '"'))
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
    for (const line of this.wrap(s, 10, CONTENT)) {
      this.ensure(26);
      this.draw(line, MX, 10, MUTED);
      this.gap(14);
    }
    this.gap(16);
  }
  section(s: string) {
    this.ensure(46);
    this.gap(14);
    this.draw(s.toUpperCase(), MX, 10, ACCENT);
    this.gap(22);
  }
  para(s: string, color = BODY, size = 10.8) {
    for (const chunk of String(s ?? "").split("\n")) {
      for (const line of this.wrap(chunk, size, CONTENT)) {
        this.ensure(size + 7);
        this.draw(line, MX, size, color);
        this.gap(size + 6.5);
      }
    }
  }
  kv(rows: [string, string[]][]) {
    const vx = MX + 146;
    const vW = A4.w - MX - vx;
    this.hr();
    for (const [k, vals] of rows) {
      const lines = vals.flatMap((v) => this.wrap(v, 10.8, vW));
      this.ensure(Math.max(30, lines.length * 15.5 + 15));
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
  /** Charge rows with right-aligned amounts. */
  charges(rows: [string, string][], total: [string, string]) {
    const rightEdge = A4.w - MX;
    this.draw("DESCRIPTION", MX, 8.5, ACCENT);
    const ah = "AMOUNT";
    this.draw(ah, rightEdge - this.w(ah, 8.5), 8.5, ACCENT);
    this.gap(11);
    this.hr();
    for (const [label, amount] of rows) {
      const lines = this.wrap(label, 10.8, CONTENT - 150);
      this.ensure(Math.max(30, lines.length * 15.5 + 16));
      this.gap(18);
      let ly = this.y;
      for (const l of lines) {
        this.draw(l, MX, 10.8, rgb(0.9, 0.9, 0.9), ly);
        ly -= 15.5;
      }
      this.draw(amount, rightEdge - this.w(amount, 10.8), 10.8, BONE, this.y);
      this.y = Math.min(this.y - 12, ly - 4);
      this.hr();
    }
    // total row, emphasised
    this.ensure(34);
    this.gap(19);
    this.draw(total[0], MX, 11.5, BONE);
    this.draw(total[1], rightEdge - this.w(total[1], 11.5), 11.5, ACCENT);
    this.gap(13);
    this.hr();
    this.gap(6);
  }
  /** Centred amount-due block. */
  totalBlock(amount: string, caption: string) {
    const h = 92;
    this.ensure(h + 14);
    this.page.drawRectangle({
      x: MX, y: this.y - h + 14, width: CONTENT, height: h,
      color: PANEL, borderColor: LINE, borderWidth: 0.7,
    });
    const aw = this.w(amount, 30);
    this.draw(amount, MX + (CONTENT - aw) / 2, 30, BONE, this.y - 30);
    const cw = this.w(caption.toUpperCase(), 8.5);
    this.draw(caption.toUpperCase(), MX + (CONTENT - cw) / 2, 8.5, ACCENT, this.y - 56);
    this.gap(h + 12);
  }
  rule(lead: string, body: string) {
    const pad = 15;
    const maxW = CONTENT - pad * 2;
    const L = this.wrap(lead, 10.8, maxW);
    const B = String(body ?? "").split("\n").flatMap((c) => this.wrap(c, 10.2, maxW));
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

export async function buildInvoicePdf(d: InvoiceData): Promise<Uint8Array> {
  const doc = new Doc();
  await doc.init("Invoice");

  doc.title(`Invoice ${d.invoiceNo}`);
  doc.sub(
    `${KIND_LABEL[d.kind]}   ·   Issued ${fmtDate(d.issueDate)}   ·   Due ${fmtDate(d.dueDate)}` +
      (d.contractRef ? `   ·   Against contract ${d.contractRef}` : "")
  );

  doc.section("01 · Billed To");
  doc.kv([
    ["Client", [`${d.clientName}${d.companyName ? `, ${d.companyName}` : ""}`]],
    ...(d.clientEmail ? ([["Email", [d.clientEmail]]] as [string, string[]][]) : []),
    ...(d.projectType
      ? ([["Project", [`${d.projectType}${d.websiteType ? ` · ${d.websiteType}` : ""}`]]] as [string, string[]][])
      : []),
    ["From", ["Amr Hassan, independent developer, operating as Amr Studio (not a licensed company)"]],
  ]);

  doc.section("02 · Charges");
  doc.charges(
    d.lines.filter((l) => l.label).map((l) => [l.label, `${l.amount} ${d.currency}`] as [string, string]),
    ["Total due", `${d.amount} ${d.currency}`]
  );
  if (d.contractTotal && d.kind !== "full" && d.kind !== "custom") {
    doc.para(
      `Full contract value ${d.contractTotal} ${d.currency}` +
        (d.kind === "deposit"
          ? `, of which ${d.upfrontPercent}% is due upfront.`
          : ", this invoice settles the remaining balance."),
      MUTED,
      9.6
    );
  }

  doc.gap(6);
  doc.totalBlock(money(d), d.paid ? "Paid in full · thank you" : `Amount due by ${fmtDate(d.dueDate)}`);

  let n = 3;
  if (d.paymentDetails) {
    doc.section(`0${n++} · How To Pay`);
    doc.rule("Payment details.", d.paymentDetails);
  }

  doc.section(`0${n} · Terms`);
  doc.rule("Payment window.", `This invoice is due by ${fmtDate(d.dueDate)}. Work scheduled against it begins once payment clears.`);
  doc.rule("Scope.", `This invoice covers the agreed scope in contract ${d.contractRef || "on file"}. Anything beyond it is quoted separately.`);
  if (d.notes) doc.rule("Notes.", d.notes);

  return doc.finish();
}
