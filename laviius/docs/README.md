# Laviius — Setup & Architecture

Laviius is a booking platform connecting warehouses, 3PLs, and distributors
with trusted local commercial freight carriers. This document covers local
setup, the full folder structure, and how it maps to the Shipment Request
Wizard's design (the "Wizard Master Prompt").

For the marketing-site-only quick start, see the root `README.md`. For
security posture and data handling, see `SECURITY.md`. For disaster
recovery, see `RUNBOOK-RESTORE.md`.

## Stack

- **Frontend**: Next.js (App Router) + TypeScript, deployed on Vercel.
- **Backend/DB**: Supabase — Postgres, Auth, Storage, Row Level Security.
- **CI/CD**: GitHub Actions (`.github/workflows/laviius-ci.yml`) +
  Vercel preview deployments.

This repo is a monorepo hosting several independently-deployed apps (see
`/CLAUDE.md` and `/DEPLOYMENT.md` at the repo root). Laviius is one app
inside it, deployed as its own Vercel project with **Root Directory** set
to `laviius`. Never add a `vercel.json` at the repo root — see
`/DEPLOYMENT.md` for why.

## Local setup

### Prerequisites

- Node.js 20+
- A Supabase project (free tier is enough for local/dev work; see
  "Database" below for how to get schema into it)
- The [Supabase CLI](https://supabase.com/docs/guides/cli) if you want to
  run Postgres locally instead of against a hosted dev project

### Install and run

```bash
cd laviius
npm install
cp .env.example .env.local   # then fill in real values, see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Every variable the app needs is documented in `.env.example` with a
one-line explanation of what it's for and where to find the real value.
Copy it to `.env.local` (gitignored) for local dev. Never commit `.env.local`
or put real secrets in `.env.example` — see `SECURITY.md`.

### Database

Schema lives in `supabase/migrations/*.sql`, applied in filename order.
Two ways to get it into a project:

**Hosted Supabase project (simplest for solo dev):**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

**Local Postgres via the Supabase CLI (closer to production parity, useful
before a risky migration):**

```bash
npx supabase start          # spins up local Postgres + Studio in Docker
npx supabase db reset        # applies migrations, then supabase/seed.sql
```

After migrations run, generate typed table definitions so `src/types/database.ts`
stops being a hand-written stub:

```bash
npx supabase gen types typescript --project-id <project-ref> > src/types/database.ts
```

### Auth

Supabase Auth handles sign-up/sign-in. A Postgres trigger
(`handle_new_user`, in `0003_users.sql`) automatically creates the matching
`public.users` row whenever someone signs up — application code should
never need to insert into `public.users` directly for signup.

### Auth session refresh

`src/proxy.ts` refreshes the Supabase session cookie on every request. This
file is named `proxy.ts`, not `middleware.ts` — Next.js 16 renamed the
Middleware convention to Proxy (see `AGENTS.md` at this app's root: this
Next.js version has breaking changes from what most training data assumes,
and `node_modules/next/dist/docs/` is the source of truth, not memory).

## Folder structure

```
/laviius
  /src
    /app                      → Next.js App Router routes
      /(marketing)             → public marketing pages (route group; no
                                  effect on the URL — "/" still resolves here)
      /wizard                  → the Shipment Request Wizard
      /dashboard                → customer dashboard
      /api                      → route handlers (server-only logic)
    /components
      /wizard                   → ShipmentStepper, AddressCard, CargoCard, etc.
      /ui                        → shared primitives (buttons, inputs, cards)
      /layout, /sections, /illustrations → existing marketing-site components
    /lib
      /supabase                  → client.ts (browser), server.ts (RLS-scoped,
                                    request-bound), admin.ts (service-role,
                                    background jobs only — never per-request)
      /validation                 → Zod schemas (shared client+server)
      /rules                       → Adaptive Workflow conditional-field logic
      /intelligence                → Freight Intelligence suggestion logic
      cors.ts, rate-limit.ts        → API hardening helpers (see SECURITY.md)
    /types                          → shared TypeScript types
    proxy.ts                         → Supabase session-refresh (see above)
  /supabase
    /migrations                       → SQL migration files (source of truth
                                         for schema; numbered, applied in order)
    seed.sql                           → local dev seed data only
  /scripts
    backup-db.sh                        → scheduled/manual pg_dump export
    sync-storage.sh                      → scheduled/manual Storage bucket sync
  /docs
    README.md (this file), SECURITY.md, RUNBOOK-RESTORE.md
  .env.example
  /.github/workflows (repo root)          → CI + scheduled backup workflows
```

## How this maps to the Wizard Master Prompt

The Wizard Master Prompt owns the Shipment Request Wizard's step flow, UX
copy, and conditional-field behavior. This repo's job is to give that wizard
a place to live without embedding its logic in the wrong layer:

| Wizard Master Prompt concept                     | Lives in                          |
| ------------------------------------------------- | ---------------------------------- |
| Step components (ShipmentStepper, AddressCard...) | `src/components/wizard/`           |
| Field validation rules                            | `src/lib/validation/shipment.ts`   |
| Conditional field visibility (Adaptive Workflow)   | `src/lib/rules/adaptive-workflow.ts` |
| Suggestion logic (Freight Intelligence)            | `src/lib/intelligence/freight-intelligence.ts` |
| Submitted shipment data                            | `shipments` table (see migrations) |
| Uploaded photos/documents                          | `shipment_files` table + Supabase Storage |
| "Save as Template" bookings                        | `templates` table                  |

Rule of thumb: if you're writing conditional `if` logic about which field to
show, it belongs in `lib/rules`, not inside a component. If you're writing a
`z.object({...})`, it belongs in `lib/validation`, not duplicated between
client and server.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm test` — run the Vitest unit test suite
- `./scripts/backup-db.sh` — manual database backup (see RUNBOOK-RESTORE.md)
- `./scripts/sync-storage.sh` — manual Storage bucket backup

## CI

`.github/workflows/laviius-ci.yml` runs on every PR touching `laviius/**`:
install → type-check → lint → test → `npm audit` (production deps, fails on
high/critical) → build. `.github/workflows/laviius-db-backup.yml` runs the
backup scripts daily on a schedule.
