-- Saved "Save as Template" bookings. company_id is nullable: a null value
-- means the template is private to created_by; a set value means it's
-- shared with the whole company.

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete cascade,
  created_by uuid not null references public.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 150),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index templates_company_id_idx on public.templates (company_id);
create index templates_created_by_idx on public.templates (created_by);

create trigger templates_set_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

alter table public.templates enable row level security;

create policy "templates_select_own_or_company"
  on public.templates for select
  to authenticated
  using (
    created_by = auth.uid()
    or (company_id is not null and company_id = public.current_company_id())
  );

create policy "templates_insert_own"
  on public.templates for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (company_id is null or company_id = public.current_company_id())
  );

create policy "templates_update_own_or_company_admin"
  on public.templates for update
  to authenticated
  using (
    created_by = auth.uid()
    or (company_id is not null and company_id = public.current_company_id() and public.current_role() = 'admin')
  )
  with check (
    created_by = auth.uid()
    or (company_id is not null and company_id = public.current_company_id() and public.current_role() = 'admin')
  );

create policy "templates_delete_own_or_company_admin"
  on public.templates for delete
  to authenticated
  using (
    created_by = auth.uid()
    or (company_id is not null and company_id = public.current_company_id() and public.current_role() = 'admin')
  );
