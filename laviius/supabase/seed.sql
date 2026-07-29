-- Local dev seed data only. Run automatically by `supabase db reset`.
-- Never run against a production project — this is not a data-recovery
-- mechanism, see docs/RUNBOOK-RESTORE.md for that.

insert into public.companies (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Acme Warehousing (dev)');

insert into public.carriers (id, name, contact_email, service_area, active) values
  ('00000000-0000-0000-0000-000000000101', 'Dev Local Cartage Co.', 'dispatch@example.com', 'Metro Vancouver', true);

-- Note: seeding public.users rows requires corresponding auth.users rows,
-- which must be created through Supabase Auth (e.g. `supabase auth` admin
-- API or the Studio UI) rather than direct SQL insert, since auth.users has
-- its own required columns (encrypted_password, etc.) not modeled here.
-- After creating a dev auth user, attach it to the seeded company with:
--
--   update public.users set company_id = '00000000-0000-0000-0000-000000000001', role = 'admin'
--   where id = '<the dev user''s auth.users id>';
