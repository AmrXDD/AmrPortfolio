-- Run this in the Supabase SQL editor (Dashboard, SQL, New query).
-- Sets up the contact form storage AND the database-backed admin auth.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- Contact form submissions (written by the contact form, read by /admin)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.contact_submissions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  email         text not null,
  service       text not null default 'other',
  service_label text,
  budget        text,
  reason        text
);
alter table public.contact_submissions enable row level security;
create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Admin auth, stored in the database (NOT env vars)
-- ─────────────────────────────────────────────────────────────

-- Admin users. Passwords are bcrypt-hashed, never stored in plain text.
create table if not exists public.admin_users (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  password   text not null,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

-- Opaque session tokens set as the login cookie.
create table if not exists public.admin_sessions (
  token      text primary key,
  email      text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);
alter table public.admin_sessions enable row level security;

-- Password verification used by the login route (runs with definer rights).
-- pgcrypto lives in the `extensions` schema on Supabase, so qualify crypt().
create or replace function public.verify_admin(p_email text, p_password text)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.admin_users
    where email = lower(p_email)
      and password = extensions.crypt(p_password, password)
  );
$$;

-- RLS is ON with no public policies, so the anon key can read/write nothing.
-- The app uses the SERVICE ROLE key (server only), which bypasses RLS.

-- ─────────────────────────────────────────────────────────────
-- Create the admin user (email + bcrypt-hashed password)
-- ─────────────────────────────────────────────────────────────
insert into public.admin_users (email, password)
values
  ('ahmedgbril4050@gmail.com', extensions.crypt('jngldiff', extensions.gen_salt('bf'))),
  ('lowmoch@gmail.com', extensions.crypt('Amr_2008711', extensions.gen_salt('bf')))
on conflict (email) do update set password = excluded.password;
