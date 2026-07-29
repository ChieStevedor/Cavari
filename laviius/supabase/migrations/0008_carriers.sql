-- Platform-wide carrier directory for the future carrier-assignment
-- workflow (not yet wired to shipments). This is Laviius's own reference
-- data, not scoped to any one company, so it is managed by Laviius staff
-- via the service-role client (see lib/supabase/admin.ts) rather than by
-- end users — there is deliberately no insert/update/delete policy for
-- `authenticated`.

create table public.carriers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  contact_email text,
  contact_phone text,
  service_area text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger carriers_set_updated_at
  before update on public.carriers
  for each row execute function public.set_updated_at();

alter table public.carriers enable row level security;

-- Any signed-in user can read the active carrier list (needed once
-- carrier-assignment is surfaced in the wizard/dashboard).
create policy "carriers_select_authenticated"
  on public.carriers for select
  to authenticated
  using (active = true);
