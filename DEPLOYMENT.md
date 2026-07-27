# Deployment notes for this repo

This repo hosts several independent apps in one place (`finance-tracker`,
`claims-system`, `laviius`, `website`, ...). Each one is deployed as its own
**separate Vercel project**, all pointed at this same GitHub repo. That setup
caused real problems once (see "Incident history" below) — this doc exists so
the same mistakes don't happen twice.

## Golden rule

**Never add a `vercel.json` at the repo root.** Build configuration for an
app in this repo belongs in one of two places only:
- The Vercel dashboard's per-project **Root Directory** setting, or
- A `vercel.json` file *inside that app's own subfolder* (only if the
  framework's auto-detected defaults aren't right).

A root-level `vercel.json` gets picked up by any project connected to this
repo, regardless of that project's own Root Directory — it will silently
hijack builds. A CI check in this repo now fails the build if one reappears
(see `.github/workflows/no-root-vercel-json.yml`).

## Checklist: setting up a new app's Vercel project

1. **Add New Project** in Vercel, select this repo (`ChieStevedor/Cavari`).
   Double-check the page you land on is actually the *new project creation*
   flow, not an existing project's settings — check the project name at the
   top before saving anything.
2. Set **Root Directory** to the app's folder name (e.g. `laviius`,
   `finance-tracker`) — never leave it blank/root.
3. In **Build and Deployment settings**, check Build Command / Install
   Command / Output Directory. If any show **Override: ON** with a value
   that doesn't belong to this app (commonly copied from another app during
   import), turn the override **off** and let the framework auto-detect.
4. Enable **"Skip deployments when there are no changes to the Root
   Directory or its dependencies"** — stops this project from rebuilding on
   every push to unrelated apps in the repo.
5. **Rename the project** to something unique and specific (not the repo
   name) — avoids "which project is this" confusion later.
6. Deploy, then open the live URL in a normal (non-incognito) browser tab to
   confirm it actually works before considering the setup done.

## If a deployment breaks something that was working

Vercel keeps every previous deployment. On the **Deployments** tab, open the
last known-good one and click **"Promote to Production"** — instant rollback,
no code changes needed. Prefer this over panic-editing settings.

## Incident history (2026-07)

A root `vercel.json` existed to let one project build `finance-tracker`
without setting Root Directory. When the `laviius` project was created, it
inherited that same hijack (via Vercel's "include files outside the root
directory" behavior) and failed to build. Fixing it required: setting
explicit Root Directory on both projects, clearing stale command overrides
left over from import, and finally deleting the root `vercel.json` entirely.
The `no-root-vercel-json` CI check exists so this can't silently recur.
