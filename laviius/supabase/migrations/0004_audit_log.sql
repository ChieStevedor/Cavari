-- Audit trail for any table touching declared value or PII. Rows are
-- written exclusively by the trigger function below (SECURITY DEFINER) —
-- there is intentionally no INSERT policy for `authenticated`, so an
-- application bug or compromised client session cannot forge or suppress
-- audit entries.

create table public.audit_log (
  id bigint generated always as identity primary key,
  company_id uuid references public.companies (id) on delete set null,
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  actor_id uuid references public.users (id) on delete set null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_company_id_idx on public.audit_log (company_id);
create index audit_log_record_id_idx on public.audit_log (record_id);

alter table public.audit_log enable row level security;

-- Only a company's own admin can read its audit history. No update/delete
-- policy for anyone — audit rows are append-only.
create policy "audit_log_select_company_admin"
  on public.audit_log for select
  to authenticated
  using (company_id = public.current_company_id() and public.current_role() = 'admin');

-- Generic trigger function: any table that calls this via a trigger gets an
-- audit_log row on insert/update/delete. Assumes the source table has a
-- `company_id` column.
create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
begin
  v_company_id := coalesce(
    case when tg_op = 'DELETE' then old.company_id else new.company_id end,
    null
  );

  insert into public.audit_log (company_id, table_name, record_id, action, actor_id, old_data, new_data)
  values (
    v_company_id,
    tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end,
    lower(tg_op),
    auth.uid(),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;
