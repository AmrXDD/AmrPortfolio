import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, verifyCredentials, createSession } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Admin not configured (add your Supabase keys)" }, { status: 503 });
  }
  let email = "";
  let password = "";
  try {
    ({ email, password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!(await verifyCredentials(String(email || ""), String(password || "")))) {
    return NextResponse.json({ error: "Wrong email or password" }, { status: 401 });
  }
  const token = await createSession(String(email || ""));
  if (!token) {
    return NextResponse.json({ error: "Could not create session" }, { status: 500 });
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return NextResponse.json({ ok: true });
}
