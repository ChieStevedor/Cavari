-- Explicit table-level grants for the `authenticated` and `service_role`
-- roles.
--
-- Hosted Supabase projects (and the Supabase CLI's local dev Postgres
-- image) already set up equivalent grants as part of project bootstrap, so
-- this migration is a no-op there (GRANT is idempotent). It's included
-- anyway so this schema is portable to a bare Postgres instance without
-- Supabase's platform-level bootstrap — see the portability note in the
-- Laviius infrastructure master prompt: RLS policies alone are not
-- sufficient without the underlying GRANT; RLS only *restricts* rows a
-- role can already see/touch per its table-level privileges, it doesn't
-- grant access on its own.
--
-- `anon` intentionally gets no table grants: every policy in this schema
-- is scoped `to authenticated`, so there is no anonymous-read use case yet.

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to authenticated, service_role;

-- Ensure any table added by a future migration gets the same grants
-- automatically, without needing to repeat this file.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;
