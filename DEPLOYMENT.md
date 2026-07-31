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

## Local development workflow: use a worktree per app/branch

This repo holds multiple unrelated apps, each usually worked on in its own
feature branch. **Never share one working directory across two apps that
have in-progress work** — switching branches with `git checkout` forces
`git stash`/`pop` gymnastics and risks conflicts between unrelated apps'
uncommitted changes.

Instead, use a separate `git worktree` per app/branch you're actively
developing:

```
git worktree add ~/<app-name>-work <branch-name>
```

This checks out that branch into its own folder, sharing the same `.git`
history (no duplicated clone), so you can have `laviius` on one branch and
`finance-tracker` on another checked out **at the same time**, with zero
stashing. Deploy/build/test from inside that worktree folder. Remove it
with `git worktree remove <path>` once the branch is merged.

## Static/standalone apps: icons must be real installable icons, not just a favicon

For any small static app in this repo (a single-page tracker, tool, etc.),
a plain `<link rel="icon">` favicon is not enough for a good "Add to Home
Screen" experience on mobile — without more, Chrome/Android treats it as a
bookmark shortcut and overlays a small browser badge on the icon. To get a
clean, real home-screen icon:

1. Generate proper PNG icons (at least 192x192 and 512x512, plus a 180x180
   `apple-touch-icon.png` for iOS) — not just an SVG/favicon.
2. Add a `manifest.json` (name, short_name, start_url, display: standalone,
   background_color, theme_color, and the icons array) and link it with
   `<link rel="manifest" href="manifest.json">`.
3. Register a minimal service worker (even a no-op `fetch` listener is
   enough) — Chrome's installability check requires one paired with the
   manifest before it will drop the shortcut badge and offer a real
   "Install app" flow instead of "Add to Home screen".

After deploying an icon fix, remind the user that Android caches the
manifest/icon at install time — an existing home-screen shortcut needs to
be removed and re-added to pick up the change.

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
