# Poker Zone Trainer (MVP)

Mobile poker training app scaffold — React Native (Expo) + Supabase + RevenueCat.
Working name / bundle ID (`poker-zone-trainer` / `com.pokerzonetrainer.app`) is a
placeholder pending final branding — see the build prompt's deferred questions.

Tournament format only. Three modules: positional ranges (free), M/Q-ratio push/fold
(paid), postflop by stack zone (paid). See [`BUILD_PROMPT.md`](./BUILD_PROMPT.md) for
the full product scope this was built from.

## What's implemented

- **Deterministic decision engine** (`src/engine/`) for all three modules — pure
  functions, no LLM, per the spec. Invariants enforced and unit-tested:
  range widens at later position / lower M-ratio, premium hands never fold on open,
  Red zone is never less aggressive than Green for the same hand.
- **Content pipeline scripts** (`scripts/`): `npm run generate:scenarios` produces
  150-200 scenarios per module from the base tables; `npm run validate:invariants`
  checks the invariants above and is wired into CI
  (`.github/workflows/poker-zone-trainer-ci.yml`).
- **Supabase schema** (`supabase/migrations/`): profiles, scenario_bank,
  ranges_tables, decision_history, progress, feedback_flags, module_trial_usage,
  subscriptions, plus RPCs (`record_attempt`, `start_module_session`,
  `delete_own_account`). Adaptive difficulty and official accuracy% are computed
  **only** inside `record_attempt` (Postgres) — the client never judges an answer or
  computes a level itself.
- **Full app flow**: age-gate → email/password auth → push permission → onboarding
  (focus + self-selected level) → module picker → timed session → recap → paywall →
  settings (self-service account deletion).
- **RevenueCat wiring** (`src/lib/revenuecat.ts`): purchase, restore, entitlement
  check. Paid-module gating is enforced server-side by `start_module_session`
  (5-session trial placeholder, then hard paywall), independent of the client SDK.
- **Mock backend** (`src/lib/mock/`): a full in-memory stand-in for Supabase +
  RevenueCat, used automatically when no real project is configured, so the entire
  app flow can be previewed with zero backend setup. See "Preview without a real
  backend" below.

## What's a placeholder, not real content or config

- **Base range tables** (`src/engine/baseTables.ts`) use a self-derived hand-strength
  heuristic (`src/engine/handRank.ts`), *not* vetted poker strategy. Per the content
  pipeline, Alex authors the real tables manually and they belong in Supabase
  (`ranges_tables`), never hardcoded in the app bundle. Replace before shipping real
  content.
- **Free trial count** (5 sessions/paid module) and **level-up threshold** (80% over
  last 20) are taken directly from the build prompt as given; the trial count is
  explicitly flagged there as a placeholder Alex will tune.
- **Supabase URL/anon key and RevenueCat API keys** are placeholder strings in
  `app.json` → `expo.extra`. Replace via EAS build secrets / environment config
  before running against a real backend — the app logs a warning at startup if it
  detects placeholders.
- **App icon / splash image**: no real branding assets exist yet (`assets/` is
  empty); `app.json` omits the icon field rather than pointing at a missing file.
  Add real assets before a store build.
- **RevenueCat offering**: `purchasePaidModulesPackage()` takes the first available
  package from the current offering — set up the actual product/offering named
  entitlement `paid_modules` in the RevenueCat dashboard.
- **Privacy Policy / Nutrition Label**: explicitly out of scope for this prompt per
  the build spec (Alex prepares separately).

## Setup

```bash
npm install
npm run typecheck
npm run validate:invariants
npm test
```

To run the app you need a real Supabase project (apply `supabase/migrations/` in
order) and RevenueCat project, with credentials wired into `app.json` → `expo.extra`
(or better, injected via EAS secrets rather than committed). Then:

```bash
npm run generate:scenarios   # writes supabase/seed/*.sql — load into Supabase
npm start
```

**Note on Expo Go:** this app uses `react-native-purchases` (RevenueCat) and native
notification permissions, which are not part of Expo Go's bundled module set. You'll
need an EAS development build or a bare/dev-client build to test on-device — Expo Go
alone will not work for the paid-module flow, unless you're using mock mode (below),
in which case Expo Go works fine since the native modules are never touched.

## Preview without a real backend

If `app.json` → `expo.extra.supabaseUrl` is still a placeholder (the default, out of
the box), the app automatically runs against an in-memory mock backend instead of
real Supabase/RevenueCat — see `src/lib/mockMode.ts` and `src/lib/mock/mockBackend.ts`.
This lets you click through the entire flow — signup, onboarding, all three modules,
the paywall, account deletion — with no setup at all:

```bash
npm install
npx expo start --web    # or scan the QR code with Expo Go
```

A yellow "MOCK MODE" banner is always shown while this is active, so it's never
mistaken for a real preview. Behavior to know about:

- **Data resets on every restart.** Nothing is persisted to disk; it's an in-memory
  store for the life of the JS process.
- **"Subscribe" on the paywall just flips a local flag** — no real purchase, no
  RevenueCat sandbox needed.
- **Scenario content is smaller** (40 scenarios/module vs. the real 150-200) for a
  snappier start, generated by the exact same engine/judge functions as the real
  content pipeline — just fewer of them.
- **`record_attempt`/`start_module_session`/`delete_own_account` are reimplemented in
  JS** to mirror `supabase/migrations/0006_rpcs.sql` closely enough for a faithful
  preview, but that SQL remains the real source of truth — keep them in sync by hand
  if either changes.

Force one mode or the other regardless of what credentials look like by setting
`expo.extra.mockMode` to `true` or `false` in `app.json`.

## What could not be verified in this environment

This was built in a headless remote session with no iOS/Android simulator, no real
Supabase or RevenueCat project, and no App Store/Play Console access. Verified here:
TypeScript compiles clean across the whole app, the engine's unit tests and invariant
validator pass, the scenario generator produces valid output, and `expo config`
accepts `app.json`. **Not verified**: the app actually running on a device/simulator,
real Supabase auth/RLS behavior end-to-end, the RevenueCat purchase flow, or push
notification permission prompts. Before submitting to app stores, run this on a real
device against a real backend and follow the App Store / Play Console submission
checklist yourself.

## Compliance checklist status

- [x] Self-service account deletion (`SettingsScreen` → `delete_own_account` RPC) —
      guideline 5.1.1v. The RPC's SQL comment flags that it needs the right Postgres
      role privileges in your actual Supabase project; confirm this live.
- [x] Simple 17+ checkbox age-gate, no full verification flow.
- [x] No mention of any named external poker methodology in-app; zone names
      (Green/Yellow/Orange/Red) and "M/Q-ratio" are generic, own terminology.
- [x] RevenueCat used for subscriptions (not direct Stripe).
- [ ] Privacy Policy + Privacy Nutrition Label — out of scope for this prompt, Alex
      prepares separately per the build spec.
