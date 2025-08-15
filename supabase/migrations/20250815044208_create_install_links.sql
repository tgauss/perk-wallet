create table if not exists public.install_links (
  program_id uuid not null references public.programs(id) on delete cascade,
  perk_uuid text not null,
  url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (program_id, perk_uuid)
);

create index if not exists install_links_program_idx on public.install_links(program_id);