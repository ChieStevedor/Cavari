# AI Micro-App Factory

Private operating system for discovering, researching, scoring, validating,
building, launching, measuring, killing, and scaling micro-app experiments.
See the full product spec this implements for the philosophy behind it.

This is **Phase 1** (foundation): Auth, database, Ideas, Validation, Products,
Time tracking, Decisions, Command Center, basic Portfolio and Analytics.
Experiments (post-launch growth), Weekly Review, and Settings (editable
scoring weights) are intentionally deferred to a later phase — see
`src/app/(dashboard)/experiments/page.tsx` and `settings/page.tsx`.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (hand-built
components, see `components.json`) · Supabase (Postgres + Auth + RLS)

## Setup

1. Create a Supabase project.
2. Copy `.env.local.example` to `.env.local` and fill in your project's URL
   and anon key.
3. Apply the schema: see `supabase/README.md` for the migration + seed steps.
4. `npm install`
5. `npm run dev`, sign up on `/login` to create your account, then run the
   seed script (it needs that account to exist first).

## Architecture

Business logic is centralized under `src/lib/domain/` as pure functions
(scoring, validation-ladder math, P&L, decision engine, health/efficiency
scores) — UI components and Server Actions call into these rather than
computing anything inline, so the same logic can later be reused by an AI
assistant layer (§28 of the spec) without duplication.

- `src/lib/domain/` — pure business logic, no I/O, unit-testable
- `src/lib/data/` — Supabase read queries (Server Components)
- `src/actions/` — Server Actions (mutations)
- `src/lib/supabase/` — client/server/middleware Supabase client factories
- `supabase/migrations/` — versioned SQL schema, RLS policies
- `supabase/seed.sql` — realistic fictional demo data

## A Next.js 16 gotcha hit during setup

Next 16 renamed the `middleware.ts` convention to `proxy.ts` (function name
`proxy` instead of `middleware`). With a `src/` layout, it must live at
`src/proxy.ts` — not the project root — or it silently never runs (no error,
no warning; auth just fails open). If routes ever stop redirecting
unauthenticated users to `/login`, check that file is still in the right
place first.
