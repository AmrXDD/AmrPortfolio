-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).
-- Creates the table the contact form writes to and the /admin dashboard reads.

create extension if not exists "pgcrypto";

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

-- Row Level Security ON. No public policies are added, so the anon key cannot
-- read or write this table. The app writes/reads with the SERVICE ROLE key
-- (server-side only), which bypasses RLS. This keeps submissions private.
alter table public.contact_submissions enable row level security;

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);
