import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/admin-auth";
import { InvoiceTool } from "./invoice-tool";

export const metadata: Metadata = {
  title: "Invoice Generator",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/* Invoice generator, gated behind the admin login like the other tools. */
export default async function InvoicePage() {
  if (!(await isAuthed())) redirect("/admin");
  return <InvoiceTool />;
}
