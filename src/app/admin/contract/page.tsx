import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/admin-auth";
import { ContractTool } from "./contract-tool";

export const metadata: Metadata = {
  title: "Contract Generator",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/*
 * Contract generator, gated behind the admin login. Anyone unauthenticated is
 * bounced to /admin, which shows the sign-in form.
 */
export default async function ContractPage() {
  if (!(await isAuthed())) redirect("/admin");
  return <ContractTool />;
}
