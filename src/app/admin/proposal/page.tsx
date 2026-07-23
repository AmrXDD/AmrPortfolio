import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/admin-auth";
import { ProposalTool } from "./proposal-tool";

export const metadata: Metadata = {
  title: "Proposal Generator",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/* Proposal generator, gated behind the admin login like the contract tool. */
export default async function ProposalPage() {
  if (!(await isAuthed())) redirect("/admin");
  return <ProposalTool />;
}
