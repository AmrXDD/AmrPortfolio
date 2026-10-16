import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin, isSupabaseConfigured, CONTACT_TABLE } from "@/lib/supabase";
import { inquiryConfirmationEmail, inquiryNotificationEmail } from "@/lib/emails/templates";
import { INBOX, FROM_DEFAULT } from "@/lib/emails/addresses";

export const runtime = "nodejs";

type Body = {
  name?: string;
  email?: string;
  service?: string;
  service_label?: string;
  budget?: string;
  reason?: string;
  locale?: string;
  consent?: boolean;
};

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name || "").trim().slice(0, 200);
  const email = (body.email || "").trim().slice(0, 200);
  const service = (body.service || "other").trim().slice(0, 50);
  const service_label = (body.service_label || service).trim().slice(0, 120);
  const budget = (body.budget || "").trim().slice(0, 120);
  const reason = (body.reason || "").trim().slice(0, 5000);
  const locale = body.locale === "ar" ? "ar" : "en";

  if (!name || !emailRe.test(email) || !reason) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 422 });
  }
  // Nothing is stored or emailed without the privacy-policy consent tick.
  if (body.consent !== true) {
    return NextResponse.json({ error: "Consent is required" }, { status: 422 });
  }

  const record = { name, email, service, service_label, budget, reason };

  // 1) Persist to Supabase (if configured)
  const db = supabaseAdmin();
  if (db) {
    let { error } = await db
      .from(CONTACT_TABLE)
      .insert({ ...record, locale, consent_at: new Date().toISOString() });
    // A database set up before setup.sql has no locale/consent_at columns yet
    // (PostgREST PGRST204). Keep the lead rather than lose it.
    if (error?.code === "PGRST204") {
      console.warn("[contact] run supabase/setup.sql to add locale/consent_at columns.");
      ({ error } = await db.from(CONTACT_TABLE).insert(record));
    }
    if (error) {
      console.error("[contact] supabase insert failed:", error.message);
      return NextResponse.json({ error: "Could not save inquiry" }, { status: 500 });
    }
  } else {
    console.warn("[contact] Supabase not configured — skipping persistence.");
  }

  // 2) Email via Resend (if configured): notify me, and auto-confirm to them.
  const resendKey = process.env.RESEND_API_KEY;
  const to = INBOX;
  const from = FROM_DEFAULT;
  let confirmed = false;
  if (resendKey) {
    const resend = new Resend(resendKey);

    // 2a) Lead notification to me — branded, readable on a phone.
    try {
      const mail = inquiryNotificationEmail({ ...record, locale });
      await resend.emails.send({
        from,
        to,
        replyTo: email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
    } catch (e) {
      // Email failure shouldn't fail the request if the DB write succeeded.
      console.error("[contact] notification send failed:", e);
    }

    // 2b) Automatic confirmation to the person who inquired. Sends from the
    // verified amrstudio.dev domain, so it reaches any recipient; the catch is
    // kept so a mail failure never costs us the saved inquiry.
    try {
      const mail = inquiryConfirmationEmail({ ...record, locale });
      await resend.emails.send({
        from,
        to: email,
        replyTo: to,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
      confirmed = true;
    } catch (e) {
      console.error("[contact] auto-confirmation send failed:", e);
    }
  } else {
    console.warn("[contact] Resend not configured — skipping email.");
  }

  if (!db && !resendKey) {
    // Nothing was actually delivered anywhere — surface a clear error.
    return NextResponse.json(
      { error: "Contact backend not configured", configured: false },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    persisted: Boolean(db),
    confirmed,
    configured: isSupabaseConfigured(),
  });
}
