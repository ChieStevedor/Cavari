-- feedback_flags: 👍/👎 signal (Rule 4). A 👎 is a signal for Alex's manual review
-- queue, never an automatic content change.
create table if not exists public.feedback_flags (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario_id text not null references public.scenario_bank (id),
  vote text not null check (vote in ('up', 'down')),
  created_at timestamptz not null default now(),
  unique (user_id, scenario_id)
);

alter table public.feedback_flags enable row level security;

create policy "feedback_flags_insert_own" on public.feedback_flags
  for insert with check (auth.uid() = user_id);

create policy "feedback_flags_upsert_own" on public.feedback_flags
  for update using (auth.uid() = user_id);
-- No select policy for authenticated users: the review queue is for Alex's admin
-- tooling (service role) only, per Rule 4.

-- Admin-facing view: scenarios with 3+ down-votes need manual review. Not
-- selectable by end users (no RLS grant needed since access is via service role,
-- which bypasses RLS).
create or replace view public.scenario_review_queue as
select scenario_id, count(*) as down_votes
from public.feedback_flags
where vote = 'down'
group by scenario_id
having count(*) >= 3;

-- module_trial_usage: tracks the free-trial session count for paid modules
-- (placeholder: 5 sessions per module before a hard paywall — see app flow spec).
create table if not exists public.module_trial_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  module text not null check (module in ('mq', 'postflop')),
  sessions_used integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, module)
);

alter table public.module_trial_usage enable row level security;

create policy "module_trial_usage_select_own" on public.module_trial_usage
  for select using (auth.uid() = user_id);
-- No client write policy: incremented only by start_module_session() (see
-- 0006_record_attempt.sql).

-- subscriptions: entitlement state mirrored from RevenueCat via a webhook-receiving
-- Supabase Edge Function (RevenueCat -> webhook -> this table). The client SDK also
-- knows entitlement status directly from RevenueCat, but server-side gating
-- (start_module_session RPC) needs its own source of truth independent of a
-- possibly-stale client.
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  entitlement_active boolean not null default false,
  product_id text,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);
-- Written only by the RevenueCat webhook Edge Function via the service role.
