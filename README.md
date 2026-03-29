# Cavari Specifier Score — Intelligence Dashboard

Private internal web application for the Cavari founding team.
Scores every trade member 0–100 across four signal categories, surfaces intervention recommendations, and delivers a weekly digest to Alex.

**This application is internal-only. It must never be publicly accessible or linked.**

---

## Setup

### 1. Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Open the SQL Editor and run the full contents of `dashboard/supabase/schema.sql`.
3. In Supabase Auth → Settings, disable sign-up (Disable new user signups = ON). This ensures only manually-created admin accounts can log in.
4. Create the first admin user:
   - Go to Supabase Auth → Users → Invite user.
   - After the user is created, copy their UUID.
   - In the SQL Editor, run:
     ```sql
     insert into admin_users (id, email, name)
     values ('<paste-uuid>', 'alex@cavari.design', 'Alex');
     ```
5. Copy your Supabase Project URL and anon key from Settings → API.

### 2. Local development

```bash
cd dashboard
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
# Opens on http://localhost:3001
```

### 3. Vercel deployment

1. Push the repo to GitHub.
2. Import the project in Vercel — set the **Root Directory** to `dashboard`.
3. Add environment variables in Vercel → Settings → Environment Variables:

| Variable                       | Required | Notes                                    |
|-------------------------------|----------|------------------------------------------|
| `VITE_SUPABASE_URL`           | ✅       | Supabase project URL                     |
| `VITE_SUPABASE_ANON_KEY`      | ✅       | Supabase anon key                        |
| `SUPABASE_URL`                | ✅       | Same as above (for cron route)           |
| `SUPABASE_SERVICE_ROLE_KEY`   | ✅       | Supabase service role key                |
| `RESEND_API_KEY`              | ✅       | Resend API key                           |
| `DIGEST_RECIPIENT`            | ✅       | Alex's email (e.g. `alex@cavari.design`) |
| `CRON_SECRET`                 | ✅       | Random string to secure cron endpoint    |
| `KLAVIYO_API_KEY`             | Phase 2  | Activate Klaviyo sync                    |
| `VITE_KLAVIYO_API_KEY`        | Phase 2  | Enables Sync button in UI (any value)    |
| `PROJECT_TRACKER_SUPABASE_URL`| Phase 3  | Tracker DB URL                           |
| `PROJECT_TRACKER_SERVICE_KEY` | Phase 3  | Tracker service role key                 |
| `VITE_PROJECT_TRACKER_ENABLED`| Phase 3  | Set to `true` to enable Sync button      |
| `TOTAL_PORTFOLIO_BRANDS`      | Optional | Defaults to 12                           |

4. Deploy. The weekly digest cron (`0 8 * * 1` — Monday 08:00 UTC) is configured in `vercel.json`.

---

## Adjusting score weights

All scoring constants are defined at the top of `src/lib/scoring.js`:

```js
export const WEIGHTS = {
  firmographic:  25,   // Category 1
  engagement:    25,   // Category 2
  specification: 35,   // Category 3
  relationship:  15,   // Category 4
}

export const TOTAL_PORTFOLIO_BRANDS = 12
```

Edit these constants and redeploy. The four values must sum to 100.
Multipliers within each category are also defined as named constants in the same file.

After changing weights, run a full recalculation from the **Score Recalculation** page.

---

## Segment thresholds

Defined in `deriveSegment()` in `src/lib/scoring.js`:

| Score   | Segment   |
|---------|-----------|
| 75–100  | Luminaire |
| 50–74   | Rising    |
| 25–49   | Dormant   |
| 0–24    | Cold      |

---

## Phase 2 — Klaviyo activation

1. Obtain a Klaviyo private API key.
2. Add `KLAVIYO_API_KEY` and `VITE_KLAVIYO_API_KEY` to Vercel environment variables.
3. Redeploy — the "Sync from Klaviyo" button on each member's Engagement section becomes active.
4. The sync pulls `email_open_rate` and `link_clicks_90d` from the Klaviyo profile and recalculates the member's score.

The API call is in `api/klaviyo-sync.js`. Adjust the field mapping if your Klaviyo profile properties use different names.

---

## Phase 3 — Project Tracker activation

1. Set `PROJECT_TRACKER_SUPABASE_URL` and `PROJECT_TRACKER_SERVICE_KEY` in Vercel.
2. Set `VITE_PROJECT_TRACKER_ENABLED=true` in Vercel.
3. Set `TOTAL_PORTFOLIO_BRANDS` to the current number of brands in the Cavari portfolio.
4. Redeploy — the "Sync from Project Tracker" button on each member's Specification section becomes active.

The sync logic is in `api/tracker-sync.js`. The current implementation assumes a `projects` table in the tracker DB with columns: `designer_email`, `brand_id`, `order_placed` (bool), `order_value`, `order_date`. Adjust the query to match the actual schema.

---

## Trigger logic

Triggers are evaluated after every recalculation in `src/lib/triggers.js`. To add a new trigger:

1. Add a key to `TRIGGER_TYPES`.
2. Add a condition block in `evaluateTriggers()`.
3. Push a new action object with `{ member_id, trigger_type, message }`.

Deduplication is automatic — no duplicate pending trigger for the same member + type will be inserted.

---

## Project structure

```
dashboard/
├── api/                    Vercel serverless routes (server-side secrets here)
│   ├── send-digest.js
│   ├── send-weekly-digest.js  ← cron target
│   ├── klaviyo-sync.js
│   └── tracker-sync.js
├── src/
│   ├── lib/
│   │   ├── scoring.js      ← scoring algorithm + weight constants
│   │   ├── triggers.js     ← post-recalc trigger evaluation
│   │   ├── recalculate.js  ← orchestrates scoring pipeline
│   │   ├── digest.js       ← builds + renders digest email
│   │   ├── resend.js       ← send email via API route
│   │   ├── klaviyo.js      ← Klaviyo sync (Phase 2)
│   │   ├── projectTracker.js ← Tracker sync (Phase 3)
│   │   └── supabase.js     ← all DB queries
│   ├── contexts/AuthContext.jsx
│   ├── components/         shared UI components
│   └── pages/              one file per screen
├── supabase/schema.sql     run this once to initialise the DB
├── vercel.json
└── .env.example
```
