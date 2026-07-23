import type { Metadata } from "next";
import { isAuthed, isAdminConfigured } from "@/lib/admin-auth";
import { supabaseAdmin, isSupabaseConfigured, CONTACT_TABLE, type ContactSubmission } from "@/lib/supabase";
import { Logo } from "@/components/ui/logo";
import { LoginForm, LogoutButton } from "./login-form";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isAdminConfigured()) {
    return (
      <Frame>
        <Centered>
          <div className="w-full max-w-md rounded-2xl border border-line bg-white/[0.02] p-8">
            <h1 className="text-lg font-semibold text-bone">Admin not configured</h1>
            <p className="mt-3 text-sm leading-relaxed text-bone/60">
              Add your Supabase keys (<code className="text-accent">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="text-accent">SUPABASE_SERVICE_ROLE_KEY</code>) to{" "}
              <code className="text-accent">.env.local</code>, run{" "}
              <code className="text-accent">supabase/schema.sql</code>, then restart the dev server.
              Admin users live in the database, not env vars.
            </p>
          </div>
        </Centered>
      </Frame>
    );
  }

  if (!(await isAuthed())) {
    return (
      <Frame>
        <Centered>
          <LoginForm />
        </Centered>
      </Frame>
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

  const byService = rows.reduce<Record<string, number>>((acc, r) => {
    const k = r.service_label || r.service || "other";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Frame showLogout>
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-bone">Inquiries</h1>
          <p className="mt-1 text-sm text-bone/45">Contact-form submissions, newest first.</p>
        </div>

        {/* stat row */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total" value={String(rows.length)} />
          {Object.entries(byService)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([k, v]) => (
              <Stat key={k} label={k} value={String(v)} />
            ))}
        </div>

        {!isSupabaseConfigured() ? (
          <Notice>Supabase isn&apos;t configured yet — add your keys to <code className="text-accent">.env.local</code> and restart.</Notice>
        ) : dbError ? (
          <Notice tone="error">Database error: {dbError}. Did you run <code>supabase/schema.sql</code>?</Notice>
        ) : rows.length === 0 ? (
          <Notice>No inquiries yet. They&apos;ll appear here the moment someone submits the contact form.</Notice>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-white/[0.03] text-[11px] uppercase tracking-[0.12em] text-bone/45">
                    <th className="px-5 py-3.5 font-medium">Date</th>
                    <th className="px-5 py-3.5 font-medium">Name</th>
                    <th className="px-5 py-3.5 font-medium">Email</th>
                    <th className="px-5 py-3.5 font-medium">Service</th>
                    <th className="px-5 py-3.5 font-medium">Budget</th>
                    <th className="px-5 py-3.5 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-line/70 align-top transition-colors last:border-0 hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-5 py-4 text-bone/45">
                        {new Date(r.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                      <td className="px-5 py-4 font-medium text-bone">{r.name}</td>
                      <td className="px-5 py-4">
                        <a href={`mailto:${r.email}`} className="text-bone/80 underline-offset-4 hover:text-accent hover:underline">
                          {r.email}
                        </a>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11px] text-bone/80">
                          {r.service_label || r.service}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 tabular-nums text-bone/80">{r.budget || "N/A"}</td>
                      <td className="max-w-md px-5 py-4 text-bone/60">{r.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Frame>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.02] px-4 py-3.5">
      <p className="truncate text-[11px] uppercase tracking-[0.12em] text-bone/40">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-bone">{value}</p>
    </div>
  );
}

function Notice({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "error" }) {
  return (
    <div className={`rounded-2xl border p-6 text-sm ${tone === "error" ? "border-accent/40 bg-accent/[0.06] text-bone" : "border-line bg-white/[0.02] text-bone/60"}`}>
      {children}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[calc(100vh-61px)] items-center justify-center px-6">{children}</div>;
}

function Frame({ children, showLogout = false }: { children: React.ReactNode; showLogout?: boolean }) {
  return (
    <main
      className="min-h-screen bg-[#0a0a0b] text-bone"
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-[#0a0a0b]/85 px-6 py-3.5 backdrop-blur md:px-10">
        <div className="flex items-center gap-2.5">
          <Logo size={22} />
          <span className="text-mono text-[11px] uppercase tracking-[0.24em] text-bone">Amr/Studio</span>
          <span className="text-bone/25">/</span>
          <span className="text-mono text-[11px] uppercase tracking-[0.24em] text-bone/45">Admin</span>
        </div>
        {showLogout ? (
          <div className="flex items-center gap-4">
            <a
              href="/admin/proposal"
              className="text-mono text-[11px] uppercase tracking-[0.2em] text-bone/60 transition-colors hover:text-accent"
            >
              Proposals
            </a>
            <a
              href="/admin/contract"
              className="text-mono text-[11px] uppercase tracking-[0.2em] text-bone/60 transition-colors hover:text-accent"
            >
              Contracts
            </a>
            <a
              href="/admin/outreach"
              className="text-mono text-[11px] uppercase tracking-[0.2em] text-bone/60 transition-colors hover:text-accent"
            >
              Outreach
            </a>
            <LogoutButton />
          </div>
        ) : null}
      </header>
      <div className="px-6 py-10 md:px-10">{children}</div>
    </main>
  );
}
