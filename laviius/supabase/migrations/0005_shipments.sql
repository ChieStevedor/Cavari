-- Shipment requests. pickup/delivery/cargo/vehicle are stored as jsonb
-- rather than fully normalized columns because their shape is still owned
-- by the Wizard Master Prompt and will evolve; lib/validation/shipment.ts
-- is the schema contract the app enforces on top of this loose column type.
-- Declared cargo value lives inside `cargo` (declaredValueCents) — this
-- table is exactly the kind of "touches declared value or PII" table that
-- requires an audit trail (see 0004_audit_log.sql).

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  created_by uuid not null references public.users (id) on delete restrict,
  reference_number text not null unique,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'confirmed', 'in_transit', 'delivered', 'cancelled')),
  priority text not null default 'standard'
    check (priority in ('standard', 'expedited', 'same_day')),
  pickup jsonb not null,
  delivery jsonb not null,
  cargo jsonb not null,
  vehicle jsonb not null,
  services text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shipments_company_id_idx on public.shipments (company_id);
create index shipments_created_by_idx on public.shipments (created_by);
create index shipments_status_idx on public.shipments (status);

create trigger shipments_set_updated_at
  before update on public.shipments
  for each row execute function public.set_updated_at();

create trigger shipments_audit_log
  after insert or update or delete on public.shipments
  for each row execute function public.write_audit_log();

alter table public.shipments enable row level security;

create policy "shipments_select_company"
  on public.shipments for select
  to authenticated
  using (company_id = public.current_company_id());

create policy "shipments_insert_company"
  on public.shipments for insert
  to authenticated
  with check (
    company_id = public.current_company_id()
    and created_by = auth.uid()
  );

create policy "shipments_update_company"
  on public.shipments for update
  to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- No delete policy: shipments are cancelled (status = 'cancelled'), never
-- hard-deleted, so history/audit stays intact. RLS default-denies deletes.
