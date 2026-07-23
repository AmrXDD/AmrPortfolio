import { NextResponse } from "next/server";
import { Resend } from "resend";
import { isAuthed } from "@/lib/admin-auth";
import { invoiceEmail } from "@/lib/emails/templates";
import { INBOX, FROM_PROPOSALS } from "@/lib/emails/addresses";

export const runtime = "nodejs";

/*
 * Emails an invoice to the client with the PDF attached. Admin-only; the PDF is
 * built in the browser and posted here as base64, then decoded to real bytes.
 */

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PDF_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const str = (k: string, max = 300) => String(body[k] ?? "").trim().slice(0, max);
  const to = str("to");
  const clientName = str("clientName");
  const invoiceNo = str("invoiceNo", 40);
  const amount = str("amount", 60);
  const pdfBase64 = String(body.pdfBase64 ?? "");

  if (!emailRe.test(to) || !clientName || !invoiceNo || !amount) {
    return NextResponse.json(
      { error: "Missing client email, name, invoice number, or amount" },
      { status: 422 }
    );
  }
  if (pdfBase64 && pdfBase64.length * 0.75 > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "Invoice PDF is too large to email (8MB limit)" }, { status: 413 });
  }

  // Confirm the payload really is a PDF before it reaches a client's inbox.
  let pdf: Buffer | null = null;
  if (pdfBase64) {
    pdf = Buffer.from(pdfBase64, "base64");
    if (pdf.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return NextResponse.json(
        { error: "Attachment did not decode to a valid PDF — nothing was sent." },
        { status: 422 }
      );
    }
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "Resend is not configured (RESEND_API_KEY missing)" }, { status: 503 });
  }

  const mail = invoiceEmail({
    clientName,
    companyName: str("companyName", 200),
    invoiceNo,
    amount,
    dueDate: str("dueDate", 40),
    kindLabel: str("kindLabel", 60) || "Invoice",
    contractRef: str("contractRef", 60),
    lines: Array.isArray(body.lines)
      ? (body.lines as unknown[]).map((l) => String(l).slice(0, 200)).filter(Boolean).slice(0, 12)
      : [],
    paymentDetails: str("paymentDetails", 1000),
  });

  try {
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from: FROM_PROPOSALS,
      to,
      replyTo: INBOX,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments: pdf
        ? [
            {
              filename: str("filename", 120) || `Invoice-${invoiceNo}.pdf`,
              content: pdf,
              contentType: "application/pdf",
            },
          ]
        : undefined,
    });
    if (error) {
      console.error("[send-invoice] resend error:", error);
      return NextResponse.json({ error: error.message || "Resend rejected the send" }, { status: 502 });
    }
  } catch (e) {
    console.error("[send-invoice] send failed:", e);
    return NextResponse.json({ error: "Could not send the invoice" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, to });
}
