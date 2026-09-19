-- ranges_tables: base range tables Alex authors manually (content pipeline step 1).
-- Mirrors src/types/domain.ts BaseRangeTableEntry. Internal authoring data only —
-- never exposed to end-user clients directly; the app consumes generated
-- scenario_bank rows instead.
create table if not exists public.ranges_tables (
  id bigint generated always as identity primary key,
  module text not null check (module in ('ranges', 'mq', 'postflop')),
  context text not null,
  zone text check (zone in ('GREEN', 'YELLOW', 'ORANGE', 'RED')),
  open_fraction numeric not null check (open_fraction >= 0 and open_fraction <= 1),
  action text not null check (action in ('FOLD', 'CALL', 'RAISE', 'ALL_IN', 'CHECK', 'BET')),
  updated_at timestamptz not null default now(),
  unique (module, context, zone)
);

alter table public.ranges_tables enable row level security;
-- No policies for anon/authenticated: only the service role (Alex's admin tooling
-- and the generator script's Supabase-connected variant) may read/write this table.
