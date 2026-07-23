import { NextResponse } from "next/server";
import { Resend } from "resend";
import { isAuthed } from "@/lib/admin-auth";
import { coldPitchEmail, followUpEmail, launchEmail } from "@/lib/emails/templates";

export const runtime = "nodejs";

/*
 * Sends a marketing template to a small list of recipients, one personalised
 * message each (never a shared To:/BCC blast). Admin-only.
 */

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 25;

type Recipient = { email: string; name: string };

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

  const str = (k: string, max = 2000) => String(body[k] ?? "").trim().slice(0, max);
  const template = str("template", 40);

  const recipients: Recipient[] = (Array.isArray(body.recipients) ? body.recipients : [])
    .map((r) => {
      const o = (r ?? {}) as Record<string, unknown>;
      return { email: String(o.email ?? "").trim(), name: String(o.name ?? "").trim() };
    })
    .filter((r) => emailRe.test(r.email))
    .slice(0, MAX_RECIPIENTS);

  if (!recipients.length) {
    return NextResponse.json({ error: "No valid recipients" }, { status: 422 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Amr Studio <onboarding@resend.dev>";
  const replyTo = process.env.CONTACT_TO_EMAIL || undefined;
  if (!resendKey) {
    return NextResponse.json({ error: "Resend is not configured (RESEND_API_KEY missing)" }, { status: 503 });
  }

  const build = (name: string) => {
    switch (template) {
      case "pitch":
        return coldPitchEmail({
          toName: name,
          company: str("company", 160),
          observation: str("observation"),
          angle: str("angle"),
          proofUrl: str("proofUrl", 300) || undefined,
        });
      case "followup":
        return followUpEmail({
          toName: name,
          company: str("company", 160),
          topic: str("topic", 200),
          newAngle: str("newAngle") || undefined,
        });
      case "launch":
        return launchEmail({
          toName: name,
          projectName: str("projectName", 160),
          projectUrl: str("projectUrl", 300),
          story: str("story"),
          availability: str("availability") || undefined,
        });
      default:
        return null;
    }
  };

  if (!build("test")) {
    return NextResponse.json({ error: `Unknown template "${template}"` }, { status: 422 });
  }

  const resend = new Resend(resendKey);
  const sent: string[] = [];
  const failed: { email: string; reason: string }[] = [];

  // Sequential, one personalised send per recipient.
  for (const r of recipients) {
    const mail = build(r.name || "there")!;
    try {
      const { error } = await resend.emails.send({
        from,
        to: r.email,
        replyTo,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
      if (error) failed.push({ email: r.email, reason: error.message || "rejected" });
      else sent.push(r.email);
    } catch (e) {
      failed.push({ email: r.email, reason: e instanceof Error ? e.message : "send failed" });
    }
  }

  return NextResponse.json({ ok: failed.length === 0, sent, failed });
}
