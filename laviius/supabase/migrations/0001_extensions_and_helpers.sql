-- Extensions and shared helper functions used by every later migration.

create extension if not exists "pgcrypto";

-- Generic updated_at trigger, attached per-table below.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- current_company_id() / current_role() are SECURITY DEFINER so that RLS
-- policies on public.users can reference "which company/role is the caller"
-- without recursively re-evaluating the users table's own RLS (which would
-- either infinite-loop or silently return no rows). search_path is pinned
-- to prevent search_path hijacking of a SECURITY DEFINER function.
--
-- Written as `language plpgsql` rather than `language sql` deliberately:
-- plpgsql defers validation of the table reference below to first call,
-- while a `sql`-language function is validated against the catalog at
-- CREATE FUNCTION time — which would fail here since public.users isn't
-- created until 0003_users.sql, and 0002_companies.sql's RLS policy
-- already needs this function to exist.

create or replace function public.current_company_id()
returns uuid
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  return (select company_id from public.users where id = auth.uid());
end;
$$;

create or replace function public.current_role()
returns text
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  return (select role from public.users where id = auth.uid());
end;
$$;
