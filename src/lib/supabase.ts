import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/*
 * Server-only Supabase helpers. The service-role key bypasses RLS, so this file
 * must never be imported into a Client Component. All config comes from env
 * (see .env.local.example). Everything degrades gracefully when unconfigured.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const CONTACT_TABLE = "contact_submissions";
export const CONTRACTS_TABLE = "contracts";
export const INVOICES_TABLE = "invoices";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE);
}

let cached: SupabaseClient | null = null;

/** Service-role client (server only). Returns null if env is missing. */
export function supabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!cached) {
    cached = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

/** A saved contract — the source the invoice generator autofills from. */
export type ContractRow = {
  id: string;
  created_at: string;
  ref: string;
  client_name: string;
  company_name: string | null;
  client_email: string | null;
  project_type: string | null;
  website_type: string | null;
  price: string | null;
  currency: string;
  upfront_percent: string;
  payment_timeline: string[];
  scope: string[];
  date_of_issue: string | null;
  notes: string | null;
};

export type InvoiceRow = {
  id: string;
  created_at: string;
  invoice_no: string;
  contract_id: string | null;
  client_name: string;
  company_name: string | null;
  client_email: string | null;
  kind: "deposit" | "final" | "full" | "custom";
  amount: string;
  currency: string;
  issue_date: string | null;
  due_date: string | null;
  status: "unpaid" | "paid";
  line_items: string[];
  notes: string | null;
};

export type ContactSubmission = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  service: string;
  service_label: string | null;
  budget: string | null;
  reason: string | null;
};
