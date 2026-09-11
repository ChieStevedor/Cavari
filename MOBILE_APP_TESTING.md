# iOS app testing & build infrastructure

This repo will host multiple independent React Native/Expo iOS apps over time
(`poker-zone-trainer/` is the first). This doc is the reusable, "set up once"
version of what every one of them needs to get from code to something installed
on a device or in Xcode Simulator — the same way `DEPLOYMENT.md` is the reusable
doc for Vercel.

## What's already set up (once, for the whole repo)

`.claude/settings.json` registers Expo's **official** Claude Code plugin
(`expo@expo-plugins`, 24 skills covering EAS Build/Submit, TestFlight, Expo
Router, upgrades, etc.). It's committed here, so any future Claude Code session
that opens this repo has it automatically — no per-app reinstall. When doing
Expo/EAS work in a new app folder, load `expo:expo-overview` first; it routes to
the right skill (`expo:eas-app-stores` for builds/TestFlight, `expo:eas-simulator`
for a cloud simulator, etc.) instead of improvising.

## Accounts — what's actually free vs. paid

This is the part people usually get wrong, so it's worth stating precisely:

| You want to... | Needs Apple Developer Program ($99/yr)? | Needs an EAS paid plan? |
|---|---|---|
| Build for iOS **Simulator** and run it on your own Mac | **No** — simulator builds aren't code-signed | No — free EAS tier covers this |
| Build for a physical device (ad-hoc) or submit to TestFlight/App Store | **Yes** | No (free tier is just slower/queued) |
| Have *me* (Claude, in a session with no Mac) build, run, and screenshot the app | No | **Yes** — EAS Simulator is a paid cloud service (`expo:eas-simulator` skill) |

So: **get an Expo account and start testing in Simulator on your Mac today, for
free.** Only enroll in the Apple Developer Program when you're ready for a real
device, TestFlight, or the App Store.

## One-time account setup

1. **Expo/EAS account** — free, https://expo.dev/signup. One account covers
   every app in this repo; each app gets its own EAS *project* (created via
   `eas init`), not a separate account.
2. **Apple Developer Program** — $99/yr, https://developer.apple.com/programs/enroll/.
   Only needed once you move past Simulator testing. Individual or Organization;
   Organization needs a D-U-N-S number and can take 1-2 weeks, so start that
   early if it's the route you're going.
3. **GitHub Actions secret** (only if/when you want CI to trigger builds): an
   Expo access token as the `EXPO_TOKEN` repo secret, so `eas build` can run
   non-interactively. Not needed for local testing.

## Per-app `eas.json`

Each app folder gets its own `eas.json` (see `poker-zone-trainer/eas.json` for
the concrete example). The profile names are a convention worth reusing as-is:

- **`simulator`** — standalone build, no dev client, Simulator target. Fastest
  way to answer "does this actually run" — no Metro server needed once built.
- **`development-simulator`** — dev-client build, Simulator target, live reload
  via a running `expo start` — the default profile `eas build:dev` looks for.
- **`development`** — dev-client build for a **physical device** (needs Apple
  Developer Program for ad-hoc signing).
- **`preview`** — internal-distribution device build for wider internal testing
  (needs Apple Developer Program).
- **`production`** — App Store build (needs Apple Developer Program + an App
  Store Connect app record).

## Testing on your Mac, step by step (no Apple Developer Program needed yet)

Run these locally — this session is headless and can't do the interactive
Expo/Apple login:

```bash
cd poker-zone-trainer   # or whichever app you're testing
npx eas-cli@latest login              # creates/logs into your free Expo account
npx eas-cli@latest init               # links this app to an EAS project (writes extra.eas.projectId)

# Fastest smoke test — standalone build, no live reload, no Metro needed:
npx eas-cli@latest build --profile simulator --platform ios
npx eas-cli@latest build:run --platform ios --latest

# Or, for active development with live reload:
npx eas-cli@latest build:dev --platform ios     # builds development-simulator if needed, installs, and launches
npx expo start --dev-client                      # in another terminal, serves JS to that build
```

`eas build:run` and `eas build:dev` prompt you to pick a local Simulator device
if more than one is available. Builds take roughly 10-20 minutes on the free
tier queue.

## Once you have the Apple Developer Program

```bash
npx eas-cli@latest device:create          # register your physical test device (for ad-hoc/preview builds)
npx eas-cli@latest build --profile preview --platform ios      # installable via a link on registered devices
npx eas-cli@latest build --profile production --platform ios --auto-submit   # → TestFlight
```

`eas credentials` walks through linking your Apple ID and lets EAS manage
certificates/provisioning profiles for you the first time you build for a real
device.

## What I (Claude) can and can't do here

This session runs headless — no browser, no Apple ID login flow, no local
Simulator. I can write `eas.json`/CI config, and once `EXPO_TOKEN` exists as a
repo secret I can trigger `eas build` non-interactively via CI and read back
build status/logs. I cannot complete the interactive `eas login`/`eas init`
account linking, enroll you in the Apple Developer Program, or (without a paid
EAS Simulator plan on your account) run/screenshot the app myself.

## Apps using this infrastructure

- `poker-zone-trainer/` — `eas.json` added 2026-09-10. Not yet built — no
  EAS/Apple accounts configured as of this writing (see its own README.md for
  app-specific setup notes).
