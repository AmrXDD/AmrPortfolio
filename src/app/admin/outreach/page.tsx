import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/admin-auth";
import { OutreachTool } from "./outreach-tool";

export const metadata: Metadata = {
  title: "Outreach",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/* Marketing/outreach console, gated behind the admin login. */
export default async function OutreachPage() {
  if (!(await isAuthed())) redirect("/admin");
  return <OutreachTool />;
}
