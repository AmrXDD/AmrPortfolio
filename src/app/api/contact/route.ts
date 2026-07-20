import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin, isSupabaseConfigured, CONTACT_TABLE } from "@/lib/supabase";

export const runtime = "nodejs";

type Body = {
  name?: string;
  email?: string;
  service?: string;
  service_label?: string;
  budget?: string;
  reason?: string;
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
  const budget = (body.budget || "").trim().slice(0, 60);
  const reason = (body.reason || "").trim().slice(0, 5000);

  if (!name || !emailRe.test(email) || !reason) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 422 });
  }

  const record = { name, email, service, service_label, budget, reason };

  // 1) Persist to Supabase (if configured)
  const db = supabaseAdmin();
  if (db) {
    const { error } = await db.from(CONTACT_TABLE).insert(record);
    if (error) {
      console.error("[contact] supabase insert failed:", error.message);
      return NextResponse.json({ error: "Could not save inquiry" }, { status: 500 });
    }
  } else {
    console.warn("[contact] Supabase not configured — skipping persistence.");
  }

  // 2) Notify by email via Resend (if configured)
  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL || "Amr Studio <onboarding@resend.dev>";
  if (resendKey && to) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from,
        to,
        replyTo: email,
        subject: `New inquiry — ${service_label} (${budget || "no budget"})`,
        text:
          `Name: ${name}\nEmail: ${email}\nService: ${service_label}\nBudget: ${budget || "N/A"}\n\n` +
          `Reason / details:\n${reason}`,
      });
    } catch (e) {
      // Email failure shouldn't fail the request if the DB write succeeded.
      console.error("[contact] resend send failed:", e);
    }
  } else {
    console.warn("[contact] Resend not configured — skipping email.");
  }

  if (!db && !(resendKey && to)) {
    // Nothing was actually delivered anywhere — surface a clear error.
    return NextResponse.json(
      { error: "Contact backend not configured", configured: false },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, persisted: Boolean(db), configured: isSupabaseConfigured() });
}
