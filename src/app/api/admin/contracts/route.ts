import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { supabaseAdmin, CONTRACTS_TABLE } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * Contract storage. The contract generator POSTs here every time it produces
 * documents, which is what gives the invoice generator something to pull from.
 * Admin-only, service-role backed.
 */

const str = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);
const arr = (v: unknown, max = 40) =>
  Array.isArray(v) ? v.map((x) => String(x).slice(0, 400)).filter(Boolean).slice(0, max) : [];

/** GET — most recent contracts, newest first, for the invoice picker. */
export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const { data, error } = await db
    .from(CONTRACTS_TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[contracts] list failed:", error.message);
    return NextResponse.json({ error: "Could not load contracts" }, { status: 500 });
  }
  return NextResponse.json({ contracts: data ?? [] });
}

/** POST — save a contract produced by the generator. */
export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const clientName = str(body.clientName, 200);
  if (!clientName) {
    return NextResponse.json({ error: "Client name is required" }, { status: 422 });
  }

  const row = {
    ref: str(body.ref, 60),
    client_name: clientName,
    company_name: str(body.companyName, 200) || null,
    client_email: str(body.clientEmail, 200) || null,
    project_type: str(body.projectType, 120) || null,
    website_type: str(body.websiteType, 160) || null,
    price: str(body.price, 40) || null,
    currency: str(body.currency, 8) || "USD",
    upfront_percent: str(body.upfrontPercent, 8) || "50",
    payment_timeline: arr(body.paymentTimeline),
    scope: arr(body.scope),
    date_of_issue: str(body.dateOfIssue, 20) || null,
    notes: str(body.notes, 2000) || null,
  };

  const { data, error } = await db.from(CONTRACTS_TABLE).insert(row).select().single();
  if (error) {
    console.error("[contracts] insert failed:", error.message);
    return NextResponse.json({ error: "Could not save contract" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, contract: data });
}
