-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).
-- Adds contract storage and invoicing on top of the existing schema.sql.
-- Safe to re-run.

-- ─────────────────────────────────────────────────────────────
-- Contracts — saved whenever the contract generator produces documents,
-- so the invoice generator has something to pull details from.
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
-- Invoices — each one optionally tied to the contract it bills against.
-- `seq` drives the human invoice number, so numbering is gap-free and
-- assigned by the database rather than guessed by the client.
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

-- Next invoice number, assigned atomically. Format: AS-INV-0001.
create or replace function public.next_invoice_no()
returns text
language sql
stable
as $$
  select 'AS-INV-' || lpad((coalesce(max(seq), 0) + 1)::text, 4, '0')
  from public.invoices;
$$;

-- RLS stays ON with no public policies: the anon key can read/write nothing.
-- The app reaches these tables only through the server-side service-role key.
