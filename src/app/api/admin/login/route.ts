import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminConfigured, sessionToken, verifyCredentials } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Admin not configured (set ADMIN_EMAIL & ADMIN_PASSWORD)" }, { status: 503 });
  }
  let email = "";
  let password = "";
  try {
    ({ email, password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!verifyCredentials(String(email || ""), String(password || ""))) {
    return NextResponse.json({ error: "Wrong email or password" }, { status: 401 });
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12h
  });
  return NextResponse.json({ ok: true });
}
