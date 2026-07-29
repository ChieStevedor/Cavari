# Migration checklist: wizard-only → full infrastructure

Top-to-bottom steps to take this repo from "just the wizard/marketing
frontend" to the full structure described in `docs/README.md`. Check these
off in order — later steps depend on earlier ones.

- [ ] **Create the Supabase project.** Note the project ref, URL, anon key,
      and service role key (Project Settings → API).
- [ ] **Set local env vars.** `cp .env.example .env.local`, fill in the
      Supabase values above. Leave backup/rate-limit vars for later steps.
- [ ] **Apply the schema.** `npx supabase link --project-ref <ref>` then
      `npx supabase db push` to run everything in `supabase/migrations/`.
      Confirm in the Supabase dashboard's Table Editor that all 7 tables
      exist with RLS shown as enabled.
- [ ] **Generate typed DB types.**
      `npx supabase gen types typescript --project-id <ref> > src/types/database.ts`,
      replacing the hand-written stub.
- [ ] **Create the Storage bucket.** In the dashboard, create a
      `shipment-files` bucket (private, not public). Add Storage RLS
      policies mirroring `shipment_files` table access (see the comment at
      the bottom of `supabase/migrations/0006_shipment_files.sql`).
- [ ] **Set up Upstash Redis** for rate limiting. Add
      `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` to `.env.local`.
- [ ] **Set up the off-platform backup bucket.** Create an S3-compatible
      bucket outside this Supabase project. Add `BACKUP_BUCKET` and its
      credentials to `.env.local`, and test
      `./scripts/backup-db.sh` / `./scripts/sync-storage.sh` locally once.
- [ ] **Wire up the Vercel project.** Follow the checklist in
      `/DEPLOYMENT.md` at the repo root exactly — Root Directory =
      `laviius`, skip-unrelated-builds enabled, unique project name. Add
      every `.env.example` variable to Vercel's Environment Variables
      (development/preview/production), pulling real values from wherever
      the team's secrets vault lives (see `docs/SECURITY.md`).
- [ ] **Add repo secrets for CI.** In GitHub repo settings → Secrets and
      variables → Actions, add `SUPABASE_DB_URL`, `BACKUP_BUCKET`,
      `BACKUP_AWS_ACCESS_KEY_ID`, `BACKUP_AWS_SECRET_ACCESS_KEY`,
      `AWS_REGION`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
      — required by `.github/workflows/laviius-db-backup.yml`.
- [ ] **Confirm CI is green.** Open a PR touching `laviius/**` and confirm
      `.github/workflows/laviius-ci.yml` passes (typecheck, lint, test,
      audit, build).
- [ ] **Implement the wizard UI** in `src/components/wizard/`, following
      the Wizard Master Prompt, wired to `src/lib/validation/shipment.ts`,
      `src/lib/rules/adaptive-workflow.ts`, and
      `src/lib/intelligence/freight-intelligence.ts`.
- [ ] **Finish `POST /api/shipments`** (`src/app/api/shipments/route.ts`):
      insert into `shipments`, apply rate limiting
      (`src/lib/rate-limit.ts`), add CORS headers if it needs to be
      callable cross-origin (`src/lib/cors.ts`).
- [ ] **Build the dashboard** (`src/app/dashboard/page.tsx`): list
      shipments/templates for the signed-in user's company via
      `src/lib/supabase/server.ts` (never `admin.ts`).
- [ ] **Enable branch protection on `main`** (PR + review required) if not
      already on, per `docs/SECURITY.md` / the backup strategy's "Code"
      layer.
- [ ] **Schedule the first quarterly restore test.** Put a recurring
      reminder somewhere durable (calendar, not just this checklist) —
      see `docs/RUNBOOK-RESTORE.md`, "Testing this procedure".
- [ ] **Rotate secrets on a calendar, not just at setup.** 90 days for the
      Supabase service role key and third-party API keys, per
      `docs/SECURITY.md`.

Once every box above is checked, the app matches the target structure in
`docs/README.md` and the "prototype" framing no longer applies — treat
further changes with the same rigor as any production system handling real
customer data.
