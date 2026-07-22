import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, destroySession } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) await destroySession(token);
  jar.delete(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
