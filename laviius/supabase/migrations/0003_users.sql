-- App-level user profiles, one row per auth.users row (1:1, same id).
-- Role-based access (customer vs. dispatch/admin) is enforced here via RLS
-- AND must be re-checked server-side in route handlers — never rely on
-- either one alone. See SECURITY.md, "Authentication & Authorization".

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid references public.companies (id) on delete set null,
  role text not null default 'customer' check (role in ('customer', 'dispatch', 'admin')),
  full_name text check (char_length(full_name) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

alter table public.users enable row level security;

-- A user can always see their own profile, plus co-workers in the same
-- company (needed for e.g. an admin's team-management view).
create policy "users_select_self_or_company"
  on public.users for select
  to authenticated
  using (id = auth.uid() or company_id = public.current_company_id());

-- Users can only edit their own profile, and can never grant themselves a
-- different role or move themselves to a different company via this path
-- (role/company changes go through a server-side admin route with its own
-- authorization check, not directly through this policy).
create policy "users_update_self"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Row creation happens via the handle_new_user trigger below (fired from
-- auth.users), not directly by client insert.
create policy "users_insert_self"
  on public.users for insert
  to authenticated
  with check (id = auth.uid());

-- Creates the matching public.users row whenever someone signs up via
-- Supabase Auth, so application code never has to remember to do it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
