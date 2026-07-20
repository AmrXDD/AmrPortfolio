import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/*
 * Server-only Supabase helpers. The service-role key bypasses RLS, so this file
 * must never be imported into a Client Component. All config comes from env
 * (see .env.local.example). Everything degrades gracefully when unconfigured.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const CONTACT_TABLE = "contact_submissions";

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
