import type { Metadata } from "next";
import { isAuthed, isAdminConfigured } from "@/lib/admin-auth";
import { supabaseAdmin, isSupabaseConfigured, CONTACT_TABLE, type ContactSubmission } from "@/lib/supabase";
import { LoginForm, LogoutButton } from "./login-form";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isAdminConfigured()) {
    return (
      <Shell>
        <div className="max-w-lg rounded-2xl border border-line bg-ash/40 p-8">
          <h1 className="text-display text-2xl text-bone">Admin not configured</h1>
          <p className="mt-3 text-sm leading-relaxed text-bone/70">
            Set <code className="text-accent">ADMIN_PASSWORD</code> (and your Supabase keys) in{" "}
            <code className="text-accent">.env.local</code>, then restart the dev server. See{" "}
            <code className="text-accent">.env.local.example</code> and{" "}
            <code className="text-accent">supabase/schema.sql</code>.
          </p>
        </div>
      </Shell>
    );
  }

  if (!(await isAuthed())) {
    return (
      <Shell>
        <LoginForm />
      </Shell>
    );
  }

  let rows: ContactSubmission[] = [];
  let dbError = "";
  const db = supabaseAdmin();
  if (db) {
    const { data, error } = await db
      .from(CONTACT_TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) dbError = error.message;
    else rows = (data as ContactSubmission[]) ?? [];
  }

  return (
    <Shell>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-display text-3xl text-bone">Inquiries</h1>
          <p className="mt-1 text-sm text-bone/50">
            {rows.length} total{isSupabaseConfigured() ? "" : " · Supabase not configured"}
          </p>
        </div>
        <LogoutButton />
      </div>

      {!isSupabaseConfigured() ? (
        <p className="rounded-xl border border-line bg-ash/40 p-6 text-sm text-bone/70">
          Supabase isn&apos;t configured, so there are no stored inquiries to show. Add the keys from{" "}
          <code className="text-accent">.env.local.example</code>.
        </p>
      ) : dbError ? (
        <p className="rounded-xl border border-accent/40 bg-accent/10 p-6 text-sm text-bone">
          Database error: {dbError}. Did you run <code>supabase/schema.sql</code>?
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-line bg-ash/40 p-6 text-sm text-bone/60">No inquiries yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-ash/60 text-mono text-[10px] uppercase tracking-[0.18em] text-bone/50">
              <tr>
                <th className="px-4 py-3 font-normal">Date</th>
                <th className="px-4 py-3 font-normal">Name</th>
                <th className="px-4 py-3 font-normal">Email</th>
                <th className="px-4 py-3 font-normal">Service</th>
                <th className="px-4 py-3 font-normal">Budget</th>
                <th className="px-4 py-3 font-normal">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="align-top text-bone/85">
                  <td className="whitespace-nowrap px-4 py-3 text-bone/50">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${r.email}`} className="link-underline text-bone">{r.email}</a>
                  </td>
                  <td className="px-4 py-3">{r.service_label || r.service}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">{r.budget || "—"}</td>
                  <td className="max-w-md px-4 py-3 text-bone/70">{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-ink px-5 py-16 md:px-10">
      <div className="mx-auto flex min-h-[70vh] max-w-[1200px] flex-col items-start justify-center">
        {children}
      </div>
    </main>
  );
}
