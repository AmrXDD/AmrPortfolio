import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin-auth";
import { supabaseAdmin, INVOICES_TABLE } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * Invoice records. Numbering is assigned by the database (next_invoice_no)
 * rather than guessed by the client, so numbers stay gap-free and unique even
 * if two tabs are open. Admin-only.
 */

const str = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);
const arr = (v: unknown, max = 40) =>
  Array.isArray(v) ? v.map((x) => String(x).slice(0, 400)).filter(Boolean).slice(0, max) : [];

async function nextNumber(db: NonNullable<ReturnType<typeof supabaseAdmin>>) {
  const { data, error } = await db.rpc("next_invoice_no");
  if (error || !data) {
    // Fall back to a count-based number if the function isn't installed yet.
    const { count } = await db.from(INVOICES_TABLE).select("*", { count: "exact", head: true });
    return `AS-INV-${String((count ?? 0) + 1).padStart(4, "0")}`;
  }
  return String(data);
}

/** GET — existing invoices plus the number the next one will take. */
export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const [{ data, error }, next] = await Promise.all([
    db.from(INVOICES_TABLE).select("*").order("created_at", { ascending: false }).limit(100),
    nextNumber(db),
  ]);

  if (error) {
    console.error("[invoices] list failed:", error.message);
    return NextResponse.json({ error: "Could not load invoices" }, { status: 500 });
  }
  return NextResponse.json({ invoices: data ?? [], nextNumber: next });
}

/** POST — record an invoice. The server assigns the number. */
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
  const amount = str(body.amount, 40);
  if (!clientName || !amount) {
    return NextResponse.json({ error: "Client name and amount are required" }, { status: 422 });
  }

  const base = {
    contract_id: str(body.contractId, 60) || null,
    client_name: clientName,
    company_name: str(body.companyName, 200) || null,
    client_email: str(body.clientEmail, 200) || null,
    kind: (["deposit", "final", "full", "custom"] as const).includes(body.kind as never)
      ? (body.kind as string)
      : "custom",
    amount,
    currency: str(body.currency, 8) || "USD",
    issue_date: str(body.issueDate, 20) || null,
    due_date: str(body.dueDate, 20) || null,
    status: body.status === "paid" ? "paid" : "unpaid",
    line_items: arr(body.lineItems),
    notes: str(body.notes, 2000) || null,
  };

  // Retry once on a unique-number collision (another tab saved first).
  for (let attempt = 0; attempt < 2; attempt++) {
    const invoice_no = await nextNumber(db);
    const { data, error } = await db
      .from(INVOICES_TABLE)
      .insert({ ...base, invoice_no })
      .select()
      .single();
    if (!error) return NextResponse.json({ ok: true, invoice: data });
    if (error.code !== "23505") {
      console.error("[invoices] insert failed:", error.message);
      return NextResponse.json({ error: "Could not save invoice" }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "Could not allocate an invoice number" }, { status: 409 });
}
