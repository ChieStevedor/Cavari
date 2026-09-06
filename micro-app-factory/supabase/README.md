# Database

Migrations live in `migrations/`, applied in filename order. Point the
Supabase CLI or `psql` at your project's connection string and run them
directly — this repo doesn't assume the Supabase CLI is installed.

```
psql "$DATABASE_URL" -f supabase/migrations/20260101000000_init_schema.sql
psql "$DATABASE_URL" -f supabase/migrations/20260101000001_rls_policies.sql
```

`seed.sql` inserts realistic fictional demo data (spec §39-40). It is **not**
wired into an automatic `db reset` because it needs a real `auth.users` row
to own the data:

1. Sign up once in the running app (creates your Supabase Auth user).
2. Then run: `psql "$DATABASE_URL" -f supabase/seed.sql`

It picks the earliest-created `auth.users` row as the owner of all seeded
rows, so run it before creating any second account.

Both migrations and the seed were dry-run against a local Postgres 16
instance (with a minimal stand-in `auth` schema) to confirm they apply
cleanly; they haven't been run against a live Supabase project yet.
