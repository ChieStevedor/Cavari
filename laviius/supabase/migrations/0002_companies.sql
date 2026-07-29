-- Companies (warehouses / 3PLs / distributors booking through Laviius).
-- A user belongs to at most one company via public.users.company_id.

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

alter table public.companies enable row level security;

-- Members can see their own company.
create policy "companies_select_own"
  on public.companies for select
  to authenticated
  using (id = public.current_company_id());

-- Only a company's own admin can update its record.
create policy "companies_update_own_admin"
  on public.companies for update
  to authenticated
  using (id = public.current_company_id() and public.current_role() = 'admin')
  with check (id = public.current_company_id() and public.current_role() = 'admin');

-- No insert/delete policy for `authenticated`: company creation/removal is a
-- deliberate, server-side, service-role operation (onboarding flow), not
-- something any signed-in user can trigger directly. RLS default-denies
-- both in the absence of a matching policy.
