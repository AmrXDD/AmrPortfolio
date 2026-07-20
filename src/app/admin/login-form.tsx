"use client";

import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
    } catch {
      setError("Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border border-line bg-ash/40 p-8">
      <h1 className="text-display text-2xl text-bone">Admin</h1>
      <p className="mt-2 text-sm text-bone/60">Sign in to view inquiries.</p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoFocus
        autoComplete="username"
        placeholder="Email"
        className="mt-6 w-full rounded-xl border border-line bg-ink/40 px-4 py-3 text-sm text-bone outline-none focus:border-bone/40"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        placeholder="Password"
        className="mt-3 w-full rounded-xl border border-line bg-ink/40 px-4 py-3 text-sm text-bone outline-none focus:border-bone/40"
      />
      {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
      <button type="submit" disabled={busy} className="btn-solid mt-6 w-full justify-center disabled:opacity-60">
        {busy ? "…" : "Enter"}
      </button>
    </form>
  );
}

export function LogoutButton() {
  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }
  return (
    <button onClick={onLogout} className="btn-ghost !py-2 !px-4 !text-xs">
      Log out
    </button>
  );
}
