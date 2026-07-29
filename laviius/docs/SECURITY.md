# Security

Laviius handles real customer data — contact info, shipment details,
uploaded photos/documents, and declared cargo values. This document
describes the current security posture, how data is handled, and how to
report a vulnerability. Treat this document as a living contract: update it
whenever a control described here changes.

## Reporting a vulnerability

If you find a security issue in Laviius, email **security@laviius.com**
(or the current maintainer's email if that address isn't live yet — check
the repo's contact info) with:

- A description of the issue and its impact
- Steps to reproduce
- Any relevant logs or screenshots (redact customer PII before sending)

Do not open a public GitHub issue for security reports. We aim to
acknowledge reports within 3 business days.

## Authentication & authorization

- **Supabase Auth** handles all customer/company sign-up and sign-in.
- Every table has **Row Level Security (RLS) enabled from creation**, with
  explicit policies scoped to `company_id`/`user_id` ownership — never a
  blanket "allow all" policy. See `supabase/migrations/*.sql` for the
  current policy set.
- Role-based access (`customer` vs. `dispatch` vs. `admin`, stored on
  `public.users.role`) is enforced in **both** RLS policies and
  server-side route handlers. A hidden UI element is never treated as a
  security boundary — assume any authenticated user can call any API route
  directly with arbitrary input.
- `src/lib/supabase/admin.ts` (service-role client, bypasses RLS entirely)
  is restricted to trusted background jobs only. It must never be
  instantiated inside a route handler that serves an end-user request.

## Input & data validation

- Every API route revalidates input server-side using the same Zod
  schemas defined in `src/lib/validation/` that the client form uses.
  Client-side validation is a UX convenience only — the server-side parse
  is the actual security boundary. Never add a route handler that trusts
  `request.json()` without running it through a schema first.
- **File uploads** (`src/lib/validation/file-upload.ts`):
  - Restricted server-side by MIME type allow-list and max size — never
    trust a client-reported `Content-Type` or file extension alone.
  - Storage filenames are always server-generated (`generateStorageFilename`)
    — the original client filename is never used as, or trusted to become,
    a storage path.

## API hardening

- **Rate limiting**: public-facing API routes (booking/quote endpoints in
  particular) use a sliding-window limiter backed by Upstash Redis
  (`src/lib/rate-limit.ts`) to prevent abuse.
- **CORS**: restricted to the origins listed in `ALLOWED_ORIGINS`
  (`src/lib/cors.ts`). Cross-origin requests from unlisted origins fail
  closed (no CORS headers are added) rather than defaulting to allow-all.
- **Logging**: security-relevant events (failed auth, rate-limit trips, RLS
  denials) should be logged for monitoring. Never log full declared-value
  amounts or contact PII (name/phone/address) in application logs — log
  identifiers (shipment ID, user ID) instead, and look those up separately
  if you need the details.
- **Security headers** (`next.config.ts`): CSP, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  and HSTS are set on every response. The CSP currently allows
  `'unsafe-inline'` for scripts/styles — tightening this to a nonce-based
  policy (see the Next.js CSP guide referenced in that file) is a known
  follow-up, not a blocker, since it requires opting every page into
  dynamic rendering.
- **HTTPS** is enforced by Vercel by default for all environments.

## Dependency & platform hygiene

- **Dependabot** (`.github/dependabot.yml`) opens PRs for outdated npm
  packages (weekly) and GitHub Actions versions.
- **`npm audit`** runs in CI (`.github/workflows/laviius-ci.yml`) on every
  PR and **fails the build on high/critical vulnerabilities in production
  dependencies** (`npm audit --omit=dev --audit-level=high`).

### Known accepted findings

As of this writing, `npm audit` (including devDependencies) reports high
severity findings in the `eslint` → `@eslint/config-array` →
`minimatch` → `brace-expansion` chain (a ReDoS/DoS advisory). This is:

- Confined to **devDependencies** (the lint toolchain) — it never ships to
  production and cannot be triggered by a request to the deployed app.
- **Not fixable without a breaking change**: the only patched
  `brace-expansion` release changes its module export shape in a way that
  breaks the `minimatch@3.x` version `eslint`/`eslint-config-next` currently
  depend on. Forcing the upgrade (`npm audit fix --force`) was tested and
  breaks `npm run lint` outright, and pulls in an unrelated
  `eslint-config-next` downgrade in the process.
- Tracked via Dependabot, which will open a PR once `eslint-config-next`
  publishes a release compatible with the patched dependency chain. Re-run
  `npm audit` (no `--omit=dev`) after merging any Dependabot PR that touches
  `eslint`/`eslint-config-next` to check whether this can be closed out.

This is the one deliberate exception to "no unaddressed high/critical
findings" in this repo — everything else follows the strict gate.

## Backups

See `RUNBOOK-RESTORE.md` for the full three-layer backup strategy (code,
database, file storage) and restore procedure.

## Secrets management

- No secret is ever committed to git. `.env.example` documents every
  required variable name with a placeholder value only — never a real one.
- Real secrets live in **Vercel Environment Variables** (scoped per
  environment: development/preview/production) and **Supabase project
  settings**. Never in Slack, email, or a shared doc.
- Maintain one securely-stored master copy of all secrets outside of
  Vercel/Supabase (e.g. a password manager vault such as 1Password or
  Bitwarden) so the project is recoverable if platform access is ever
  lost. See `RUNBOOK-RESTORE.md`, "Secrets vault", for what belongs there —
  that document intentionally never contains actual secret values.
- **Rotation**: rotate the Supabase service role key and any third-party
  API keys (Google Places, Upstash, backup storage credentials) immediately
  if they are ever exposed (committed, pasted somewhere public, logged),
  and on a routine 90-day schedule otherwise. Track the last rotation date
  for each secret in the vault entry, not in this repo.

## Data retention & deletion (PIPEDA)

Laviius operates in British Columbia, Canada, and treats customer contact
information and shipment data under **PIPEDA** (Personal Information
Protection and Electronic Documents Act) principles:

- **Collect only what's needed**: shipment data collected at booking is
  limited to what's required to arrange and complete a pickup/delivery
  (contact name/phone, addresses, cargo description/weight/value, service
  requirements). No data is collected "in case it's useful later."
- **Purpose disclosure**: the wizard and account sign-up flow must state
  why each piece of information is being collected (e.g. "contact phone is
  shared with the assigned carrier for pickup coordination").
- **Retention**: shipment records (including audit_log entries) are kept
  for **7 years** from completion, matching typical commercial
  freight/liability record-keeping expectations in BC — confirm against
  current provincial requirements before this is load-bearing for a real
  customer contract. Uploaded photos/documents are retained for the same
  period as their parent shipment.
- **Deletion**: a customer or company admin can request deletion of their
  account and associated personal information. Shipment records tied to
  completed transactions are retained per the policy above even after an
  account deletion request (financial/audit obligations override a
  deletion request for that specific data), but should be de-linked from
  actively-used personal identifiers where feasible. Document the specific
  deletion procedure here once the account-deletion flow is implemented —
  this is a placeholder policy statement, not yet a working feature.
- Requests regarding personal information (access, correction, deletion)
  should be directed to the same contact as vulnerability reports above.

## Reporting a security event internally

If you discover a real incident (not just an audit finding) — a leaked
secret, unauthorized data access, a bypassed RLS policy — rotate the
affected credential immediately (see "Secrets management" above), then
document what happened, what was exposed, and what was done about it. This
repo does not yet have a formal incident log; until one exists, keep that
write-up in the secrets vault alongside the rotated credential's entry.
