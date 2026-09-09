-- Profiles: one row per authenticated user, created on signup.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  age_confirmed boolean not null default false,
  focus text not null default 'mtt' check (focus in ('mtt', 'sng')),
  self_selected_level text not null default 'novice' check (self_selected_level in ('novice', 'advanced')),
  push_opt_in boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
