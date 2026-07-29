# Laviius — Landing Page

Marketing landing page for Laviius, a booking platform connecting warehouses,
3PLs, and distributors with trusted local commercial freight carriers.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Framer Motion for scroll reveals and micro-interactions
- Lucide for icons

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- `src/app` — root layout, global styles, metadata
- `src/components/layout` — Navbar, Footer
- `src/components/sections` — page sections (Hero, Problem, Features, etc.)
- `src/components/illustrations` — dashboard/phone mockups used in the hero
  and platform preview
- `src/components/ui` — shared primitives (Button, Container, Reveal, etc.)

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm test` — run the Vitest unit test suite

## Backend & infrastructure

The marketing pages above are one part of a larger app that also includes
the Shipment Request Wizard, a customer dashboard, and a Supabase-backed
API. See:

- [`docs/README.md`](docs/README.md) — full setup, folder structure, and
  how it maps to the Wizard Master Prompt
- [`docs/SECURITY.md`](docs/SECURITY.md) — security posture & data policy
- [`docs/RUNBOOK-RESTORE.md`](docs/RUNBOOK-RESTORE.md) — disaster recovery
