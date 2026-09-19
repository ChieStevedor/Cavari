-- scenario_bank: generated training scenarios (content pipeline step 2-3), loaded
-- from supabase/seed/scenarios.sql produced by `npm run generate:scenarios`.
create table if not exists public.scenario_bank (
  id text primary key,
  module text not null check (module in ('ranges', 'mq', 'postflop')),
  hand text not null,
  context text not null,
  zone text check (zone in ('GREEN', 'YELLOW', 'ORANGE', 'RED')),
  correct_action text not null check (correct_action in ('FOLD', 'CALL', 'RAISE', 'ALL_IN', 'CHECK', 'BET')),
  -- Rule 1: borderline scenarios are shown identically in the UI but excluded from
  -- official accuracy% and get neutral wording ("per this method" vs "the correct answer").
  confidence text not null check (confidence in ('verified', 'borderline')),
  timer_seconds integer not null check (timer_seconds > 0),
  created_at timestamptz not null default now()
);

create index if not exists scenario_bank_module_idx on public.scenario_bank (module);

alter table public.scenario_bank enable row level security;

-- Any authenticated user may read scenarios (needed to render a session and to pick
-- correct-vs-neutral wording from `confidence`). No client write access.
create policy "scenario_bank_select_authenticated" on public.scenario_bank
  for select using (auth.role() = 'authenticated');
