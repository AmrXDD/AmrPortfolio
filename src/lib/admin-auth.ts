import "server-only";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { supabaseAdmin, isSupabaseConfigured } from "./supabase";

/*
 * Database-backed admin auth (no env credentials). Admin users live in the
 * `admin_users` table with bcrypt-hashed passwords; login is verified through
 * the `verify_admin` SQL function, and a random opaque token is stored in
 * `admin_sessions` and set as the session cookie. See supabase/schema.sql.
 */

export const ADMIN_COOKIE = "amr_admin";
const SESSIONS_TABLE = "admin_sessions";

/** Admin needs Supabase to be configured (that's where the users/sessions live). */
export function isAdminConfigured(): boolean {
  return isSupabaseConfigured();
}

/** Verify email + password against admin_users via the verify_admin() function. */
export async function verifyCredentials(email: string, password: string): Promise<boolean> {
  const db = supabaseAdmin();
  if (!db) return false;
  const { data, error } = await db.rpc("verify_admin", {
    p_email: (email || "").trim().toLowerCase(),
    p_password: password || "",
  });
  if (error) {
    console.error("[admin] verify_admin failed:", error.message);
    return false;
  }
  return data === true;
}

/** Create a session row and return its opaque token (to set as the cookie). */
export async function createSession(email: string): Promise<string | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const token = (randomUUID() + randomUUID()).replace(/-/g, "");
  const { error } = await db
    .from(SESSIONS_TABLE)
    .insert({ token, email: (email || "").trim().toLowerCase() });
  if (error) {
    console.error("[admin] session insert failed:", error.message);
    return null;
  }
  return token;
}

export async function destroySession(token: string): Promise<void> {
  const db = supabaseAdmin();
  if (!db || !token) return;
  await db.from(SESSIONS_TABLE).delete().eq("token", token);
}

/** True when the request carries a valid, unexpired session cookie. */
export async function isAuthed(): Promise<boolean> {
  const db = supabaseAdmin();
  if (!db) return false;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const { data, error } = await db
    .from(SESSIONS_TABLE)
    .select("expires_at")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return false;
  return new Date(data.expires_at as string).getTime() > Date.now();
}
