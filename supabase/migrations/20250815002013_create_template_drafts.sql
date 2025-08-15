create extension if not exists "pgcrypto";

create table if not exists public.template_drafts (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  pass_kind text not null check (pass_kind in ('loyalty','rewards')),
  based_on_template uuid null references public.templates(id),
  layout jsonb not null default '{}'::jsonb,
  assets jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists template_drafts_program_kind_idx
  on public.template_drafts (program_id, pass_kind);