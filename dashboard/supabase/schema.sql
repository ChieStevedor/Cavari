-- ============================================================
-- Cavari Specifier Score — Supabase Schema
-- Run this in the Supabase SQL editor to initialise the database.
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type firm_size_enum as enum ('solo', 'small', 'mid', 'large');
create type project_type_enum as enum ('residential', 'commercial', 'hospitality', 'mixed');
create type geography_enum as enum ('nyc_la', 'major_secondary', 'other_major', 'secondary');
create type years_in_practice_enum as enum ('less_2', 'two_5', 'five_10', 'ten_plus');

create type outreach_response_enum as enum ('none', 'replied', 'positive');
create type data_source_engagement_enum as enum ('manual', 'klaviyo');

create type order_value_trend_enum as enum ('declining', 'flat', 'growing');
create type data_source_spec_enum as enum ('manual', 'supabase_sync');

create type segment_enum as enum ('luminaire', 'rising', 'dormant', 'cold');

create type relationship_event_enum as enum (
  'met_in_person',
  'positive_response',
  'referral',
  'press_mention',
  'dissatisfaction_unresolved',
  'dissatisfaction_resolved'
);

create type action_status_enum as enum ('pending', 'actioned', 'dismissed');

create type trade_tier_enum as enum ('atelier', 'studio', 'associate', 'prospect');

-- ============================================================
-- TABLES
-- ============================================================

-- Admin users (internal only — created directly in Supabase Auth)
-- We rely on Supabase Auth for admin_users; this table stores display metadata.
create table admin_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- Trade members
create table members (
  id                  uuid primary key default uuid_generate_v4(),
  email               text not null unique,
  full_name           text not null,
  studio_name         text,
  trade_tier          trade_tier_enum not null default 'prospect',
  klaviyo_profile_id  text,
  created_at          timestamptz not null default now()
);

-- Firmographic data (one row per member, updated in place)
create table firmographic_data (
  id                  uuid primary key default uuid_generate_v4(),
  member_id           uuid not null references members(id) on delete cascade unique,
  firm_size           firm_size_enum,
  project_type        project_type_enum,
  geography           geography_enum,
  years_in_practice   years_in_practice_enum,
  updated_at          timestamptz not null default now()
);

-- Engagement data (one row per member, updated in place)
create table engagement_data (
  id                    uuid primary key default uuid_generate_v4(),
  member_id             uuid not null references members(id) on delete cascade unique,
  email_open_rate       float not null default 0,
  link_clicks_90d       int not null default 0,
  trade_page_revisits   int not null default 0,
  outreach_response     outreach_response_enum not null default 'none',
  data_source           data_source_engagement_enum not null default 'manual',
  updated_at            timestamptz not null default now()
);

-- Specification / order data (one row per member, updated in place)
create table specification_data (
  id                    uuid primary key default uuid_generate_v4(),
  member_id             uuid not null references members(id) on delete cascade unique,
  projects_registered   int not null default 0,
  orders_placed         int not null default 0,
  total_order_value     decimal(12,2) not null default 0,
  brand_coverage_ratio  float not null default 0,
  days_to_first_order   int,
  order_value_trend     order_value_trend_enum not null default 'flat',
  data_source           data_source_spec_enum not null default 'manual',
  updated_at            timestamptz not null default now()
);

-- Relationship warmth events (append-only log)
create table relationship_events (
  id          uuid primary key default uuid_generate_v4(),
  member_id   uuid not null references members(id) on delete cascade,
  event_type  relationship_event_enum not null,
  notes       text,
  logged_by   uuid references admin_users(id),
  logged_at   timestamptz not null default now()
);

-- Scores (append-only — never overwrite, always insert a new row)
create table scores (
  id                    uuid primary key default uuid_generate_v4(),
  member_id             uuid not null references members(id) on delete cascade,
  score_firmographic    int not null default 0,
  score_engagement      int not null default 0,
  score_specification   int not null default 0,
  score_relationship    int not null default 0,
  total_score           int not null default 0,
  segment               segment_enum not null default 'cold',
  calculated_at         timestamptz not null default now()
);

-- Create index for fast "latest score per member" queries
create index idx_scores_member_calculated on scores(member_id, calculated_at desc);

-- Triggered actions queue
create table triggered_actions (
  id            uuid primary key default uuid_generate_v4(),
  member_id     uuid not null references members(id) on delete cascade,
  trigger_type  text not null,
  message       text not null,
  status        action_status_enum not null default 'pending',
  created_at    timestamptz not null default now(),
  actioned_at   timestamptz
);

-- Recalculation log
create table recalculation_log (
  id                    uuid primary key default uuid_generate_v4(),
  triggered_by          uuid references admin_users(id),
  members_updated       int not null default 0,
  actions_generated     int not null default 0,
  calculated_at         timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- All tables are restricted to authenticated admin users only.
-- Public access is completely disabled.
-- ============================================================

alter table admin_users         enable row level security;
alter table members             enable row level security;
alter table firmographic_data   enable row level security;
alter table engagement_data     enable row level security;
alter table specification_data  enable row level security;
alter table relationship_events enable row level security;
alter table scores              enable row level security;
alter table triggered_actions   enable row level security;
alter table recalculation_log   enable row level security;

-- Helper function: is the current session user a registered admin?
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from admin_users where id = auth.uid()
  );
$$;

-- Apply admin-only policies to every table
do $$
declare
  t text;
begin
  foreach t in array array[
    'admin_users', 'members', 'firmographic_data', 'engagement_data',
    'specification_data', 'relationship_events', 'scores',
    'triggered_actions', 'recalculation_log'
  ]
  loop
    execute format(
      'create policy "Admin full access" on %I for all using (is_admin()) with check (is_admin())',
      t
    );
  end loop;
end;
$$;

-- ============================================================
-- VIEWS
-- ============================================================

-- Latest score per member (most recent calculation only)
create or replace view member_latest_scores as
select distinct on (member_id)
  s.*,
  m.full_name,
  m.studio_name,
  m.trade_tier,
  m.email
from scores s
join members m on m.id = s.member_id
order by member_id, calculated_at desc;

-- Score change vs previous week
create or replace view member_score_change as
with ranked as (
  select
    member_id,
    total_score,
    calculated_at,
    lag(total_score) over (partition by member_id order by calculated_at) as prev_score
  from scores
)
select
  member_id,
  total_score,
  prev_score,
  (total_score - coalesce(prev_score, total_score)) as score_change,
  calculated_at
from ranked
where prev_score is not null
  or calculated_at = (
    select max(calculated_at) from scores s2 where s2.member_id = ranked.member_id
  );

-- ============================================================
-- SEED: First admin user
-- After running this schema, create the first admin in Supabase Auth
-- then insert a row here referencing that auth.users id:
--
--   insert into admin_users (id, email, name)
--   values ('<auth-user-uuid>', 'alex@cavari.design', 'Alex');
--
-- ============================================================
