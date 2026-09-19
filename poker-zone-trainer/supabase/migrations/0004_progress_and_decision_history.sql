-- decision_history: every answer a user submits. Written only via the
-- public.record_attempt() RPC (see 0006_record_attempt.sql), never a direct client
-- insert, so correctness is always judged server-side.
create table if not exists public.decision_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario_id text not null references public.scenario_bank (id),
  module text not null check (module in ('ranges', 'mq', 'postflop')),
  chosen_action text not null check (chosen_action in ('FOLD', 'CALL', 'RAISE', 'ALL_IN', 'CHECK', 'BET')),
  correct_action text not null check (correct_action in ('FOLD', 'CALL', 'RAISE', 'ALL_IN', 'CHECK', 'BET')),
  is_correct boolean not null,
  -- Snapshot of the scenario's confidence label at answer time, so later edits to
  -- scenario_bank never retroactively change a user's historical official accuracy.
  confidence text not null check (confidence in ('verified', 'borderline')),
  created_at timestamptz not null default now()
);

create index if not exists decision_history_user_module_idx
  on public.decision_history (user_id, module, created_at desc);

alter table public.decision_history enable row level security;

create policy "decision_history_select_own" on public.decision_history
  for select using (auth.uid() = user_id);
-- No insert/update/delete policy for authenticated users: rows are written only by
-- the SECURITY DEFINER record_attempt() function.

-- progress: server-computed level/accuracy per user per module (Rule 2: adaptive
-- difficulty is computed and stored exclusively in Supabase — the client never
-- computes level locally, it only ever reads this table).
create table if not exists public.progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  module text not null check (module in ('ranges', 'mq', 'postflop')),
  -- Paid modules always start at level 1 ("novice") regardless of the user's
  -- self-selected onboarding level (Rule 3); level then adapts from real answers.
  level integer not null default 1,
  accuracy_last_20 numeric,
  accuracy_overall numeric,
  attempts_overall integer not null default 0,
  correct_overall integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, module)
);

alter table public.progress enable row level security;

create policy "progress_select_own" on public.progress
  for select using (auth.uid() = user_id);
-- No client write policy: progress is written only by record_attempt().
