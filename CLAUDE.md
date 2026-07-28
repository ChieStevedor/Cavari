# Cavari monorepo

This repo hosts several independent apps (`finance-tracker`, `claims-system`,
`laviius`, `website`, ...), each deployed as its own separate Vercel project
pointed at this same repo.

Before touching anything related to Vercel, deployment config, or adding a
new app's project settings, read:

@DEPLOYMENT.md

## Testing your changes — required, not optional

**Never report a coding task done based on typecheck/build/lint passing
alone.** Those catch syntax and type errors, not broken UI, broken
interactions, or a feature that silently does nothing. Before saying a
frontend or full-stack task is complete, actually run the app and exercise
the feature — start the dev/build, load it in a real browser (Playwright is
preinstalled, see below), and check the specific flow you were asked to
build, including its empty/loading/error states if you built any. If the
surface genuinely can't be run here (e.g. it needs secrets you don't have),
say that explicitly instead of claiming it was tested.

### Golden rule: `cd` into the specific app first

Each app in this repo is an **independent project with its own
`package.json` and `node_modules`** — they are not npm workspaces. Always
`cd` into the app directory (or prefix every command with it) before running
`npm install`, `npm run dev`, `npm run build`, etc.

Running `npm install` from the repo root (`/home/user/Cavari`) does not fail
loudly — it silently creates a stray root-level `package.json` /
`package-lock.json` / `node_modules` containing whatever you meant to
install into the app. The app's own build then still passes locally (Node
resolves modules by walking up parent directories, so it finds them there
anyway), which hides the mistake until someone else's install, a fresh
checkout, or a Vercel build breaks in a way that's confusing to debug. It
also trips the "multiple lockfiles" warning in `next build`/Turbopack. This
happened during the Dispatcher Console build (2026-07) — the root artifacts
were caught and deleted before commit, but check `git status` for exactly
this (`?? package.json`, `?? node_modules` at repo root) before every
commit, and delete them if you ever see them.

### Per-app run commands

Use a **distinct, non-default port per app** (see "Stale Service Worker"
gotcha below for why) — don't rely on each framework's default port.

| App | Directory | Install | Dev | Build | Notes |
|---|---|---|---|---|---|
| Laviius | `laviius/` | `npm install` | `npm run dev -- -p 3010` | `npm run build && npm run start -- -p 3010` | Next.js 16 App Router — defaults to port 3000, override it. See `laviius/AGENTS.md` before assuming any API works like older Next.js. |
| Finance Tracker | `finance-tracker/` | `npm install` | `npm run dev -- --port 3020` | `npm run build` | React + TS + Vite PWA. Vite defaults to 5173, not 3000, but still pin it explicitly for consistency. |
| Claims System | `claims-system/` | `npm install` | `PORT=3030 npm run dev` | — | Node/Express service using Anthropic/Google APIs — needs a configured `.env` (see `scripts/auth.js`); confirm required secrets exist before assuming it's runnable here. Also defaults to port 3000 (`src/config.js`), override with `PORT`. |
| Website | `website/` (+ root `index.html`, `trade.html`) | — | Open the `.html` file directly, or `npx serve . -p 3040` | — | Static HTML, no build step. |

If a script above no longer matches, trust the app's own `package.json`
over this table and update this table.

### Gotcha: stale Service Worker makes `localhost:3000` show the wrong app

If the user reports that opening `localhost` shows an unrelated app (this
has happened at least twice — "opens the workout app" — during Laviius
testing), it is almost never a build problem. It means a **Service Worker**
from a different, unrelated local project is still registered for
`http://localhost:3000/` in their browser. Service workers are cached per
*origin* (protocol + host + port) independent of whatever dev server is
actually running there, so an old PWA's cached shell can keep being served
forever regardless of what you just built.

Do not debug the app when you see this report — hand the user these two
fixes instead:
1. **Fastest**: run the dev server on the app's assigned non-default port
   (see table above) and have them open that exact port. A different port
   is a different origin, so it can't be poisoned by the old worker.
2. **Permanent**: DevTools → Application → Service Workers → Unregister,
   then Application → Storage → Clear site data, then hard reload.

This is why every app above is assigned an explicit port instead of the
framework default — port 3000 in particular should be treated as
contaminated on this user's machine until proven otherwise.

### Verifying UI in a browser

A Chromium binary is preinstalled at `/opt/pw-browsers` (see the top-level
environment notes for the exact path), but the `playwright` npm package is
**not** a dependency of any app here. To drive a real browser:

- Quick screenshot, no install needed:
  `npx --no-install playwright screenshot --wait-for-timeout=1000 <url> <file>`
- Scripted interaction (clicking, typing, checking console errors): install
  playwright locally with `npm install --no-save playwright` **from inside
  the app directory**, write a throwaway script, run it with `node`, then
  delete the script and confirm `npm install --no-save` didn't get persisted
  (`git diff package.json`) before committing. If the installed
  `playwright` version's bundled browser build doesn't match what's
  preinstalled, launch with an explicit
  `executablePath` pointing at the preinstalled Chromium binary rather than
  letting Playwright try to download a new one (downloads are disabled in
  this environment).
- Always check `page.on("console")` / `page.on("pageerror")` output during
  scripted checks, not just that a screenshot rendered — a component can
  look right and still be throwing.

Clean up every temporary test script and screenshot you created for
verification before finishing; they don't belong in the commit.
