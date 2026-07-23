import { NextResponse } from "next/server";
import { Resend } from "resend";
import { isAuthed } from "@/lib/admin-auth";
import { proposalEmail } from "@/lib/emails/templates";

export const runtime = "nodejs";

/*
 * Emails a generated proposal to the client with the PDF attached.
 * Admin-only: the PDF is built in the browser and posted here as base64.
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
  const projectTitle = str("projectTitle");
  const pdfBase64 = String(body.pdfBase64 ?? "");

  if (!emailRe.test(to) || !clientName || !projectTitle) {
    return NextResponse.json({ error: "Missing client email, name, or project title" }, { status: 422 });
  }
  if (pdfBase64 && pdfBase64.length * 0.75 > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "Proposal PDF is too large to email (8MB limit)" }, { status: 413 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Amr Studio <onboarding@resend.dev>";
  const replyTo = process.env.CONTACT_TO_EMAIL || undefined;
  if (!resendKey) {
    return NextResponse.json({ error: "Resend is not configured (RESEND_API_KEY missing)" }, { status: 503 });
  }

  const mail = proposalEmail({
    clientName,
    companyName: str("companyName"),
    projectTitle,
    investment: str("investment", 60),
    validUntil: str("validUntil", 60),
    ref: str("ref", 40),
    highlights: Array.isArray(body.highlights)
      ? (body.highlights as unknown[]).map((h) => String(h).slice(0, 200)).filter(Boolean).slice(0, 8)
      : [],
  });

  try {
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments: pdfBase64
        ? [{ filename: str("filename", 120) || "Proposal.pdf", content: pdfBase64 }]
        : undefined,
    });
    if (error) {
      console.error("[send-proposal] resend error:", error);
      return NextResponse.json({ error: error.message || "Resend rejected the send" }, { status: 502 });
    }
  } catch (e) {
    console.error("[send-proposal] send failed:", e);
    return NextResponse.json({ error: "Could not send the proposal" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, to });
}
