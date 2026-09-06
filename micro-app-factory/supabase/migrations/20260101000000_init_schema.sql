-- AI Micro-App Factory — initial schema
-- Single-tenant-per-row-owner model: every business table carries owner_id
-- and is protected by RLS scoped to auth.uid(), even though today there is
-- only one intended user. This is enforced at the database layer, not just
-- in the app, per DEPLOYMENT-adjacent security requirements (spec §34).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Lookup tables
-- ---------------------------------------------------------------------------

create table public.idea_sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

-- Configurable Opportunity Score weights (spec §8 "allow the scoring model
-- to be configurable later"). Phase 1 UI reads these but always ships the
-- six default 1x-weighted factors; editing weights is a Settings-page
-- concern for a later phase.
create table public.scoring_rules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  factor_key text not null check (factor_key in (
    'pain', 'frequency', 'willingness_to_pay', 'search_intent',
    'buildability', 'distribution_potential'
  )),
  label text not null,
  weight numeric(4,2) not null default 1.0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (owner_id, factor_key)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

-- ---------------------------------------------------------------------------
-- Ideas
-- ---------------------------------------------------------------------------

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  name text not null,
  description text,
  category_id uuid references public.categories (id) on delete set null,
  target_customer text,
  problem text,
  solution text,
  source_id uuid references public.idea_sources (id) on delete set null,
  source_url text,
  founder_notes text,

  -- Market fields (§7)
  existing_alternatives text,
  main_competitor text,
  competitor_url text,
  competitor_pricing text,
  competitor_reviews text,
  market_size_estimate text,
  search_intent_notes text,
  evidence_of_demand text,

  -- Product-planning fields (§7)
  mvp_complexity text,
  estimated_build_hours numeric(6,2),
  required_integrations text,
  technical_risks text,
  distribution_channel text,
  potential_moat text,
  monetization_model text,
  expected_price_cents bigint,

  -- Opportunity Score factors, 1-5 each (§8)
  score_pain smallint check (score_pain between 1 and 5),
  score_frequency smallint check (score_frequency between 1 and 5),
  score_willingness_to_pay smallint check (score_willingness_to_pay between 1 and 5),
  score_search_intent smallint check (score_search_intent between 1 and 5),
  score_buildability smallint check (score_buildability between 1 and 5),
  score_distribution smallint check (score_distribution between 1 and 5),
  opportunity_score smallint generated always as (
    coalesce(score_pain, 0) + coalesce(score_frequency, 0) +
    coalesce(score_willingness_to_pay, 0) + coalesce(score_search_intent, 0) +
    coalesce(score_buildability, 0) + coalesce(score_distribution, 0)
  ) stored,

  -- Evidence Confidence, independent of Opportunity Score (§9)
  evidence_confidence smallint check (evidence_confidence between 0 and 5),

  status text not null default 'IDEA' check (status in (
    'IDEA', 'RESEARCHING', 'SCORED', 'VALIDATING', 'APPROVED_TO_BUILD',
    'BUILDING', 'LAUNCHED', 'MEASURING', 'ITERATING', 'SCALE', 'WINNER',
    'KILLED', 'ARCHIVED'
  )),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ideas_set_updated_at
  before update on public.ideas
  for each row execute function public.set_updated_at();

create index ideas_owner_status_idx on public.ideas (owner_id, status);
create index ideas_owner_category_idx on public.ideas (owner_id, category_id);

create table public.idea_tags (
  idea_id uuid not null references public.ideas (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  primary key (idea_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- Research items (also serves as the "evidence" store per §7 — every
-- research item IS a piece of evidence with a type, url/notes and strength)
-- ---------------------------------------------------------------------------

create table public.research_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  idea_id uuid not null references public.ideas (id) on delete cascade,

  type text not null check (type in (
    'reddit', 'app_store', 'google_play', 'google_search', 'competitor_site',
    'product_hunt', 'forum', 'screenshot', 'document', 'note'
  )),
  url text,
  title text,
  notes text,
  evidence_strength smallint check (evidence_strength between 0 and 5),

  created_at timestamptz not null default now()
);

create index research_items_idea_idx on public.research_items (idea_id);

-- ---------------------------------------------------------------------------
-- Validation
-- ---------------------------------------------------------------------------

create table public.validation_experiments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  idea_id uuid not null references public.ideas (id) on delete cascade,

  name text not null,
  hypothesis text not null,

  target_customer_who text,
  target_customer_problem text,
  current_solution text,
  dissatisfaction_reason text,
  purchase_trigger text,
  reach_channel text,

  channel text,
  start_date date,
  end_date date,
  budget_cents bigint,
  time_budget_hours numeric(6,2),
  traffic_target integer,
  signup_target integer,
  revenue_target_cents bigint,

  status text not null default 'PLANNED' check (status in (
    'PLANNED', 'RUNNING', 'COMPLETED', 'FAILED', 'SUCCESSFUL'
  )),
  result text,
  learnings text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger validation_experiments_set_updated_at
  before update on public.validation_experiments
  for each row execute function public.set_updated_at();

create index validation_experiments_idea_idx on public.validation_experiments (idea_id);

create table public.validation_metrics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  experiment_id uuid not null references public.validation_experiments (id) on delete cascade,

  date date not null,
  visitors integer not null default 0,
  signups integer not null default 0,
  activated_users integer not null default 0,
  returning_users integer not null default 0,
  checkout_starts integer not null default 0,
  purchases integer not null default 0,
  revenue_cents bigint not null default 0,
  cost_cents bigint not null default 0,
  hours numeric(6,2) not null default 0,

  created_at timestamptz not null default now(),
  unique (experiment_id, date)
);

create index validation_metrics_experiment_idx on public.validation_metrics (experiment_id, date);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  idea_id uuid not null unique references public.ideas (id) on delete restrict,

  name text not null,
  url text,
  category_id uuid references public.categories (id) on delete set null,

  status text not null default 'BUILDING' check (status in (
    'BUILDING', 'LAUNCHED', 'MEASURING', 'ITERATING', 'SCALE', 'WINNER',
    'KILLED', 'ARCHIVED'
  )),
  maturity smallint not null default 0 check (maturity between 0 and 6),

  launch_date date,
  pricing_model text,
  price_cents bigint,

  -- MVP discipline board (§14)
  mvp_core_problem text,
  mvp_core_feature text,
  mvp_must_have text[] not null default '{}',
  mvp_should_have text[] not null default '{}',
  mvp_not_now text[] not null default '{}',
  mvp_future text[] not null default '{}',

  -- Development tracking (§13)
  dev_start_date date,
  dev_target_launch date,
  dev_actual_launch date,
  dev_estimated_hours numeric(6,2),
  dev_actual_hours numeric(6,2),
  dev_tools_used text,
  dev_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create index products_owner_status_idx on public.products (owner_id, status);
create index products_owner_maturity_idx on public.products (owner_id, maturity);

create table public.product_tags (
  product_id uuid not null references public.products (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  primary key (product_id, tag_id)
);

create table public.metrics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,

  date date not null,
  visitors integer not null default 0,
  users integer not null default 0,
  activated_users integer not null default 0,
  returning_users integer not null default 0,
  checkout_starts integer not null default 0,
  purchases integer not null default 0,
  revenue_cents bigint not null default 0,
  refunds_cents bigint not null default 0,

  created_at timestamptz not null default now(),
  unique (product_id, date)
);

create index metrics_product_date_idx on public.metrics (product_id, date);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,

  date date not null,
  category text not null check (category in (
    'hosting', 'apis', 'ai_usage', 'saas', 'advertising', 'domains', 'other'
  )),
  amount_cents bigint not null,
  description text,

  created_at timestamptz not null default now()
);

create index expenses_product_date_idx on public.expenses (product_id, date);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,

  date date not null,
  category text not null check (category in (
    'research', 'coding', 'design', 'marketing', 'support', 'admin'
  )),
  hours numeric(5,2) not null check (hours > 0),
  description text,

  created_at timestamptz not null default now()
);

create index time_entries_product_date_idx on public.time_entries (product_id, date);

create table public.launch_checklist_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,

  label text not null,
  is_default boolean not null default false,
  completed boolean not null default false,
  completed_at timestamptz,
  sort_order integer not null default 0,

  created_at timestamptz not null default now()
);

create index launch_checklist_items_product_idx on public.launch_checklist_items (product_id);

-- ---------------------------------------------------------------------------
-- Post-launch growth experiments (distinct from pre-build validation_experiments)
-- ---------------------------------------------------------------------------

create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,

  hypothesis text not null,
  channel text,
  budget_cents bigint,
  hours numeric(6,2),
  start_date date,
  end_date date,
  expected_result text,
  actual_result text,

  status text not null default 'PLANNED' check (status in (
    'PLANNED', 'RUNNING', 'COMPLETED', 'FAILED', 'SUCCESSFUL'
  )),
  outcome text,
  learnings text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger experiments_set_updated_at
  before update on public.experiments
  for each row execute function public.set_updated_at();

create index experiments_product_idx on public.experiments (product_id);

-- ---------------------------------------------------------------------------
-- Decisions (§18, §30)
-- ---------------------------------------------------------------------------

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  idea_id uuid references public.ideas (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,

  decision_type text not null check (decision_type in (
    'approve_validation', 'approve_build', 'continue_validating', 'launch',
    'iterate', 'kill', 'scale', 'change_pricing', 'increase_marketing_budget'
  )),
  recommendation text not null,
  reason text not null,
  evidence jsonb not null default '{}'::jsonb,

  status text not null default 'PENDING' check (status in (
    'PENDING', 'CONFIRMED', 'DISMISSED'
  )),

  created_at timestamptz not null default now(),
  resolved_at timestamptz,

  constraint decisions_has_subject check (idea_id is not null or product_id is not null)
);

create index decisions_owner_status_idx on public.decisions (owner_id, status);

-- ---------------------------------------------------------------------------
-- Notifications / alerts (§31)
-- ---------------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  type text not null check (type in (
    'validation_deadline', 'mvp_deadline', 'ready_for_review',
    'revenue_milestone', 'spend_threshold', 'experiment_failed',
    'scale_review', 'kill_review'
  )),
  title text not null,
  body text,
  related_idea_id uuid references public.ideas (id) on delete cascade,
  related_product_id uuid references public.products (id) on delete cascade,
  is_read boolean not null default false,

  created_at timestamptz not null default now()
);

create index notifications_owner_unread_idx on public.notifications (owner_id, is_read);

-- ---------------------------------------------------------------------------
-- Weekly review (§22)
-- ---------------------------------------------------------------------------

create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  week_start date not null,
  week_end date not null,

  ideas_generated integer not null default 0,
  ideas_researched integer not null default 0,
  ideas_validated integer not null default 0,
  mvps_built integer not null default 0,
  products_launched integer not null default 0,
  products_killed integer not null default 0,

  revenue_cents bigint not null default 0,
  new_customers integer not null default 0,

  what_worked text,
  what_failed text,
  what_we_learned text,
  next_week_changes text,
  notes text,

  created_at timestamptz not null default now(),
  unique (owner_id, week_start)
);
