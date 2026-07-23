/*
 * Native proposal PDF (pdf-lib + fontkit), built in the browser — same visual
 * system as the contract PDFs: A4, ink ground, embedded Nexium, the conic ring
 * logo drawn to canvas and embedded as PNG, selectable text, ember section
 * labels. Self-contained so the working contract builders stay untouched.
 */

import { PDFDocument, PDFFont, PDFImage, PDFPage, rgb, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { type ProposalData, fmtDate, money, proposalRef } from "./proposal-doc";

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
    this.font = await this.pdf.embedFont(await fontBytes(), { subset: true });
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
    for (const line of this.wrap(s, 26, CONTENT)) {
      this.ensure(48);
      this.draw(line, MX, 26, BONE);
      this.gap(31);
    }
    this.gap(-17);
  }
  sub(s: string) {
    for (const line of this.wrap(s, 10, CONTENT)) {
      this.ensure(26);
      this.draw(line, MX, 10, MUTED);
      this.gap(14);
    }
    this.gap(18);
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
  /** Two-column table with an ember header row — timeline / add-ons. */
  table(head: [string, string], rows: [string, string, string?][]) {
    const rx = A4.w - MX - 150;
    this.ensure(34);
    this.draw(head[0].toUpperCase(), MX, 8.5, ACCENT);
    this.draw(head[1].toUpperCase(), rx, 8.5, ACCENT);
    this.gap(11);
    this.hr();
    for (const [a, b, note] of rows) {
      const aLines = this.wrap(a, 10.8, rx - MX - 14);
      const noteLines = note ? this.wrap(note, 9.2, rx - MX - 14) : [];
      const h = Math.max(30, aLines.length * 15 + noteLines.length * 12.5 + 16);
      this.ensure(h);
      this.gap(18);
      let ay = this.y;
      for (const l of aLines) { this.draw(l, MX, 10.8, rgb(0.9, 0.9, 0.9), ay); ay -= 15; }
      for (const l of noteLines) { this.draw(l, MX, 9.2, MUTED, ay); ay -= 12.5; }
      this.draw(b, rx, 10.8, BONE, this.y);
      this.y = Math.min(this.y - 12, ay - 6);
      this.hr();
    }
    this.gap(6);
  }
  /** Centred hero price block. */
  priceBlock(amount: string, caption: string) {
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
  signatures(clientName: string, companyName: string) {
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
    const y2 = block(x2, clientName || "Client", companyName || "Client");
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

export async function buildProposalPdf(d: ProposalData): Promise<Uint8Array> {
  const doc = new Doc();
  await doc.init("Proposal");

  doc.title(d.projectTitle || "Project Proposal");
  doc.sub(
    `Prepared for ${d.clientName}${d.companyName ? `  ·  ${d.companyName}` : ""}   ·   Ref ${proposalRef(d)}   ·   Issued ${fmtDate(d.dateOfIssue)}`
  );

  doc.section("01 · Overview");
  doc.para(d.summary);

  if (d.objectives.length) {
    doc.section("02 · Objectives");
    doc.para("What this project has to achieve to be worth doing:");
    doc.gap(6);
    doc.bullets(d.objectives);
  }

  doc.section("03 · Scope of Work");
  doc.para("The following deliverables define the full and final scope of this engagement:");
  doc.gap(6);
  doc.bullets(d.scope);

  if (d.exclusions.length) {
    doc.section("04 · Not Included");
    doc.para("Stated up front so there are no surprises later. Any of these can be quoted separately:");
    doc.gap(6);
    doc.bullets(d.exclusions);
  }

  if (d.phases.length) {
    doc.section("05 · Timeline");
    doc.table(["Phase", "Duration"], d.phases.map((p) => [p.name, p.duration] as [string, string]));
  }

  doc.section("06 · Investment");
  doc.priceBlock(money(d), "Total project investment · fixed price");
  doc.kv([
    ["Upfront", [`${d.upfrontPercent}% upon signing`]],
    ["Payment terms", d.paymentTerms],
    ["Valid until", [fmtDate(d.validUntil)]],
  ]);

  if (d.options.length) {
    doc.section("07 · Optional Add-ons");
    doc.table(["Add-on", "Price"], d.options.map((o) => [o.name, o.price, o.note] as [string, string, string]));
  }

  doc.section("08 · Why Amr Studio");
  doc.rule("One developer, start to finish.", "No account managers, no handoffs, no junior doing the real work. You talk to the person building it.");
  doc.rule("Production-grade on day one.", "The demo is the product - no throwaway prototypes rebuilt later at your cost.");
  doc.rule("Motion and performance as features.", "Tuned to 60fps on a five-year-old laptop, because the feel is the product.");

  doc.section("09 · How We Proceed");
  const steps: [string, string, string][] = [
    ["01", "Approve the proposal", "Reply to confirm the scope in section 03. Adjustments are normal at this stage - tell me what to change before we lock it."],
    ["02", "Sign the agreement", `You receive the service agreement built from exactly these terms, plus the ${d.upfrontPercent}% upfront invoice.`],
    ["03", "Kickoff", "Send brand assets, copy, images, and access. Anything missing gets flagged inside 48 hours."],
    ["04", "Build with live previews", "A private preview link from the first milestone. You watch it take shape and request edits while development runs."],
    ["05", "Delivery & handover", "Final payment per the terms, then full handover: deployment, credentials, and source."],
  ];
  for (const [no, head, body] of steps) doc.step(no, head, body);

  doc.section("10 · Terms");
  doc.rule("Validity.", `This pricing holds until ${fmtDate(d.validUntil)}. After that the scope stands but the numbers may need revisiting.`);
  doc.rule("Edits & scope.", "Requested edits are welcome while the project is in development. New features beyond the scope in section 03 are quoted separately.");
  doc.rule("Refunds.", "Client-initiated refunds after 24 hours deduct 40% of the upfront; after one week or more, 70% of the paid amount. If the developer initiates the refund, the full paid amount is returned regardless of time elapsed.");
  if (d.notes) doc.rule("Additional notes.", d.notes);

  doc.section("11 · Acceptance");
  doc.para("Countersigning below converts this proposal into an active engagement under the terms above.");
  doc.gap(8);
  doc.signatures(d.clientName, d.companyName);

  return doc.finish();
}
