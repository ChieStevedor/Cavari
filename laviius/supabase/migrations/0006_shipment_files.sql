-- Metadata for shipment photos/documents. The actual bytes live in Supabase
-- Storage (bucket: "shipment-files"); this table is the RLS-checkable
-- pointer to them. storage_path must be a server-generated filename (see
-- lib/validation/file-upload.ts) — never the client-supplied original name.

create table public.shipment_files (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments (id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  uploaded_by uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index shipment_files_shipment_id_idx on public.shipment_files (shipment_id);

alter table public.shipment_files enable row level security;

create policy "shipment_files_select_company"
  on public.shipment_files for select
  to authenticated
  using (
    shipment_id in (
      select id from public.shipments where company_id = public.current_company_id()
    )
  );

create policy "shipment_files_insert_company"
  on public.shipment_files for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and shipment_id in (
      select id from public.shipments where company_id = public.current_company_id()
    )
  );

create policy "shipment_files_delete_company_admin"
  on public.shipment_files for delete
  to authenticated
  using (
    public.current_role() = 'admin'
    and shipment_id in (
      select id from public.shipments where company_id = public.current_company_id()
    )
  );

-- Matching Storage policies (bucket "shipment-files") must be created via
-- the Supabase dashboard/CLI storage policy editor, mirroring the same
-- company-scoping — table RLS here does not automatically apply to
-- Storage objects. Document the exact policy in docs/README.md once the
-- bucket is created.
