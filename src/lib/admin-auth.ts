import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/*
 * Minimal email + password gate for /admin. Not a full auth system — just
 * enough to keep the submissions dashboard private. Set ADMIN_EMAIL and
 * ADMIN_PASSWORD in env.
 */

export const ADMIN_COOKIE = "amr_admin";
const EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const SECRET = process.env.ADMIN_PASSWORD || "";

export function isAdminConfigured(): boolean {
  return EMAIL.length > 0 && SECRET.length > 0;
}

const safeEq = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

/** Deterministic session token derived from the credentials (never stores raw values). */
export function sessionToken(): string {
  return createHmac("sha256", `${EMAIL}:${SECRET}`).update("amr-admin-session-v1").digest("hex");
}

export function verifyCredentials(email: string, password: string): boolean {
  if (!isAdminConfigured()) return false;
  return safeEq((email || "").trim().toLowerCase(), EMAIL) && safeEq(password || "", SECRET);
}

export async function isAuthed(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return safeEq(token, sessionToken());
}
