-- ═════════════════════════════════════════════════════════════════════════
-- Amr Studio · full database setup for a NEW Supabase project
-- ═════════════════════════════════════════════════════════════════════════
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Then run supabase/admin-users.sql (step 2) to create your admin logins.
--
-- This one file replaces the old schema.sql + invoices.sql. Every table,
-- column, function and default from those files is here unchanged; on top
-- of that it adds:
--   • explicit privileges: only the server (service_role / sb_secret key)
--     can touch the data. anon / authenticated get nothing, even if RLS
--     were ever switched off by mistake.
--   • functions can no longer be called with the public (anon) key.
--     Before, anyone holding the publishable key could call verify_admin()
--     and brute-force passwords through the REST API.
--   • login throttling: 10 failed attempts per email in 15 minutes locks
--     that email out for the rest of the window.
--   • contact form: consent timestamp + visitor language columns.
--   • invoices: kind/status are validated by the database too.
--   • housekeeping functions for expired sessions and old inquiries.
--
-- Safe to re-run: everything is "if not exists" / "or replace".
-- ═════════════════════════════════════════════════════════════════════════

-- On Supabase, pgcrypto lives in the `extensions` schema.
create extension if not exists "pgcrypto" with schema extensions;

-- ─────────────────────────────────────────────────────────────
-- 1. Contact form submissions (written by the contact form, read by /admin)
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
-- New: when the visitor ticked the privacy consent box, and which language
-- the site was in (so the reply can be written in the same language).
alter table public.contact_submissions add column if not exists consent_at timestamptz;
alter table public.contact_submissions add column if not exists locale     text;

alter table public.contact_submissions enable row level security;
create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

-- ─────────────────────────────────────────────────────────────
-- 2. Admin auth, stored in the database (NOT env vars)
-- ─────────────────────────────────────────────────────────────

-- Admin users. Passwords are bcrypt-hashed, never stored in plain text.
create table if not exists public.admin_users (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  password   text not null,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

-- Login compares against lower(email), so keep stored emails lowercase.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'admin_users_email_lowercase') then
    alter table public.admin_users
      add constraint admin_users_email_lowercase check (email = lower(email));
  end if;
end $$;

-- Opaque session tokens set as the login cookie.
create table if not exists public.admin_sessions (
  token      text primary key,
  email      text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);
alter table public.admin_sessions enable row level security;
create index if not exists admin_sessions_expires_at_idx on public.admin_sessions (expires_at);

-- New: every login attempt, used to throttle password guessing.
create table if not exists public.admin_login_attempts (
  id         bigint generated always as identity primary key,
  email      text not null,
  success    boolean not null,
  created_at timestamptz not null default now()
);
alter table public.admin_login_attempts enable row level security;
create index if not exists admin_login_attempts_email_time_idx
  on public.admin_login_attempts (email, created_at desc);

-- Password verification used by the login route (runs with definer rights).
-- Same signature and return value as before (true / false), so the app code
-- is unchanged; it now also logs the attempt and refuses after 10 failures
-- for that email inside 15 minutes.
create or replace function public.verify_admin(p_email text, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_ok    boolean;
begin
  if (
    select count(*) from public.admin_login_attempts
    where email = v_email
      and success = false
      and created_at > now() - interval '15 minutes'
  ) >= 10 then
    return false;
  end if;

  select exists (
    select 1 from public.admin_users
    where email = v_email
      and password = extensions.crypt(coalesce(p_password, ''), password)
  ) into v_ok;

  insert into public.admin_login_attempts (email, success) values (v_email, v_ok);
  return v_ok;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3. Contracts — saved whenever the contract generator produces documents,
--    so the invoice generator has something to pull details from.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.contracts (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  ref              text not null,
  client_name      text not null,
  company_name     text,
  client_email     text,
  project_type     text,
  website_type     text,
  price            text,
  currency         text not null default 'USD',
  upfront_percent  text not null default '50',
  payment_timeline text[] not null default '{}',
  scope            text[] not null default '{}',
  date_of_issue    date,
  notes            text
);
alter table public.contracts enable row level security;
create index if not exists contracts_created_at_idx on public.contracts (created_at desc);

-- ─────────────────────────────────────────────────────────────
-- 4. Invoices — each one optionally tied to the contract it bills against.
--    `seq` drives the human invoice number; the unique invoice_no plus the
--    API's retry-on-conflict keep numbers unique across open tabs.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.invoices (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  seq          bigint generated always as identity,
  invoice_no   text unique not null,
  contract_id  uuid references public.contracts (id) on delete set null,
  client_name  text not null,
  company_name text,
  client_email text,
  -- deposit | final | full | custom
  kind         text not null default 'deposit',
  amount       text not null,
  currency     text not null default 'USD',
  issue_date   date,
  due_date     date,
  -- unpaid | paid
  status       text not null default 'unpaid',
  line_items   text[] not null default '{}',
  notes        text
);
alter table public.invoices enable row level security;
create index if not exists invoices_created_at_idx on public.invoices (created_at desc);
create index if not exists invoices_contract_idx on public.invoices (contract_id);

-- The API already restricts these values; the database now enforces it too.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_kind_check') then
    alter table public.invoices
      add constraint invoices_kind_check check (kind in ('deposit', 'final', 'full', 'custom'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'invoices_status_check') then
    alter table public.invoices
      add constraint invoices_status_check check (status in ('unpaid', 'paid'));
  end if;
end $$;

-- Next invoice number. Format: AS-INV-0001.
create or replace function public.next_invoice_no()
returns text
language sql
stable
set search_path = public
as $$
  select 'AS-INV-' || lpad((coalesce(max(seq), 0) + 1)::text, 4, '0')
  from public.invoices;
$$;

-- ─────────────────────────────────────────────────────────────
-- 5. Housekeeping (new)
-- ─────────────────────────────────────────────────────────────

-- Deletes expired sessions and login attempts older than 30 days.
create or replace function public.purge_admin_auth()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.admin_sessions where expires_at < now();
  delete from public.admin_login_attempts where created_at < now() - interval '30 days';
$$;

-- Deletes inquiries older than 24 months — the retention period stated in
-- the privacy policy (/privacy). Change both together if you change one.
create or replace function public.purge_old_inquiries()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.contact_submissions where created_at < now() - interval '24 months';
$$;

-- Optional: run both automatically. Enable the pg_cron extension first
-- (Dashboard → Database → Extensions → pg_cron), then uncomment:
-- select cron.schedule('purge-admin-auth',    '17 3 * * *', 'select public.purge_admin_auth()');
-- select cron.schedule('purge-old-inquiries', '23 3 1 * *', 'select public.purge_old_inquiries()');

-- ─────────────────────────────────────────────────────────────
-- 6. Privileges (new) — server-only access
-- ─────────────────────────────────────────────────────────────
-- RLS is ON with no policies, so the anon/authenticated keys can read or
-- write nothing. These grants make that explicit at the privilege level too,
-- and give the server role exactly what the app needs.

revoke all on table
  public.contact_submissions,
  public.admin_users,
  public.admin_sessions,
  public.admin_login_attempts,
  public.contracts,
  public.invoices
from anon, authenticated;

grant select, insert, update, delete on table
  public.contact_submissions,
  public.admin_users,
  public.admin_sessions,
  public.admin_login_attempts,
  public.contracts,
  public.invoices
to service_role;

grant usage, select on all sequences in schema public to service_role;

-- Postgres lets PUBLIC execute every new function by default; take that away
-- and hand it only to the server role.
revoke execute on function public.verify_admin(text, text)  from public, anon, authenticated;
revoke execute on function public.next_invoice_no()          from public, anon, authenticated;
revoke execute on function public.purge_admin_auth()         from public, anon, authenticated;
revoke execute on function public.purge_old_inquiries()      from public, anon, authenticated;

grant execute on function public.verify_admin(text, text)  to service_role;
grant execute on function public.next_invoice_no()          to service_role;
grant execute on function public.purge_admin_auth()         to service_role;
grant execute on function public.purge_old_inquiries()      to service_role;

-- Done. Next: supabase/admin-users.sql
