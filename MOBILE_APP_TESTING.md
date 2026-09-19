# Mobile app testing & build infrastructure

This repo will host multiple independent React Native/Expo apps over time
(`poker-zone-trainer/` is the first). This doc is the reusable, "set up once"
version of what every one of them needs to get from code to something
installed and running — the same way `DEPLOYMENT.md` is the reusable doc for
Vercel.

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

| You want to... | Needs a paid account? |
|---|---|
| Build for **Android** and sideload the APK on an emulator or physical device | **No** — no Google Play account needed to sideload; free EAS tier covers the build |
| Build for **iOS Simulator** and run it on a Mac | **No** — simulator builds aren't code-signed; free EAS tier covers the build |
| Build for a physical **iOS** device (ad-hoc) or submit to TestFlight/App Store | **Yes** — Apple Developer Program, $99/yr |
| Submit to the **Google Play Store** (not just sideloading) | **Yes** — Google Play Console, $25 one-time |
| Have *me* (Claude, in a session with no Mac/emulator) build, run, and screenshot the app | **Yes** — EAS Simulator/cloud device is a paid EAS service |

So: **Android testing (emulator or device) and iOS Simulator testing are both
free today**, on a free Expo account alone, on any OS. Only pay for Apple
Developer Program / Google Play Console when you're ready for real-device iOS
distribution or an actual store listing.

## One-time account setup

1. **Expo/EAS account** — free, https://expo.dev/signup. One account covers
   every app in this repo; each app gets its own EAS *project* (created via
   `eas init`), not a separate account.
2. **Apple Developer Program** — $99/yr, https://developer.apple.com/programs/enroll/.
   Only needed for iOS device installs, TestFlight, or App Store submission.
   Individual or Organization; Organization needs a D-U-N-S number and can take
   1-2 weeks, so start that early if it's the route you're going.
3. **Google Play Console** — $25 one-time, https://play.google.com/console/signup/.
   Only needed to actually submit to the Play Store — never for sideloading an
   APK onto an emulator or device.
4. **GitHub Actions secret** (only if/when you want CI to trigger builds): an
   Expo access token as the `EXPO_TOKEN` repo secret, so `eas build` can run
   non-interactively. Not needed for local testing.

## Testing from your phone alone, laptop not present

Live-reload testing (what `npx expo start` + a dev-client build gives you) needs
the laptop physically present — Metro serves JS from its local files over USB or
LAN. It has nothing to do with GitHub or EAS accounts; there's no way around it
without the laptop running and reachable.

What *does* work with no laptop involved at all: a manually-triggered CI job
(`.github/workflows/poker-zone-trainer-eas-build.yml`) that starts a cloud EAS
build. Claude can trigger this itself after pushing a fix, and you install the
result via a link on the Expo dashboard (expo.dev, works fine in a phone
browser) — no dev-client live reload, but a real up-to-date build to tap through.

One-time setup (do this once, from any device, including a phone):
1. https://expo.dev → your account → **Access tokens** → create one, copy it
2. This repo on GitHub → **Settings** → **Secrets and variables** → **Actions**
   → **New repository secret** → name it `EXPO_TOKEN`, paste the value

After that, every future build (triggered by Claude, or manually via the
**Actions** tab → this workflow → **Run workflow**) needs nothing further from
you except opening the resulting link on your phone.

## Per-app `eas.json`

Each app folder gets its own `eas.json` (see `poker-zone-trainer/eas.json` for
the concrete example). The profile names are a convention worth reusing as-is:

- **`simulator`** — standalone iOS build, no dev client, Simulator target.
  Fastest way to answer "does this actually run" on a Mac — no Metro server
  needed once built.
- **`development-simulator`** — iOS dev-client build, Simulator target, live
  reload via a running `expo start` — the default profile `eas build:dev`
  looks for.
- **`development`** — dev-client build, internal distribution, `android.buildType: apk`
  so the Android side is a directly-installable APK. On iOS this targets a
  **physical device** (needs Apple Developer Program for ad-hoc signing); on
  Android it needs nothing beyond the free EAS account.
- **`preview`** — internal-distribution build for wider testing, same
  `android.buildType: apk` treatment. iOS side needs Apple Developer Program;
  Android side doesn't.
- **`production`** — store build (App Store / Play Store AAB). Needs Apple
  Developer Program and/or Google Play Console, plus store app records.

## Testing on Android (any OS — Windows, Linux, or Mac), no paid account needed

```bash
cd poker-zone-trainer   # or whichever app you're testing
npx eas-cli@latest login              # creates/logs into your free Expo account
npx eas-cli@latest init               # links this app to an EAS project (writes extra.eas.projectId)

npx eas-cli@latest build --profile development --platform android   # produces an installable APK
```

Once the build finishes (~10-20 min on the free queue), it prints a download
link. To run it:
- **In the Android Studio emulator**: open Android Studio → Device Manager →
  start an emulator, then either drag the downloaded `.apk` onto the emulator
  window, or `adb install path/to/build.apk`.
- **On a physical Android device**: enable "install unknown apps" for your
  browser, open the download link on the device, and install directly — no
  Play Console account, no cable needed.

Requires Android Studio (free) installed for the emulator itself — that's a
local SDK/emulator tool, unrelated to any EAS or Google account.

## Testing on iOS Simulator (Mac only), no Apple Developer Program needed

Run these locally — this session is headless and can't do the interactive
Expo/Apple login:

```bash
cd poker-zone-trainer
npx eas-cli@latest login
npx eas-cli@latest init

# Fastest smoke test — standalone build, no live reload, no Metro needed:
npx eas-cli@latest build --profile simulator --platform ios
npx eas-cli@latest build:run --platform ios --latest

# Or, for active development with live reload:
npx eas-cli@latest build:dev --platform ios     # builds development-simulator if needed, installs, and launches
npx expo start --dev-client                      # in another terminal, serves JS to that build
```

`eas build:run` and `eas build:dev` prompt you to pick a local Simulator device
if more than one is available.

## Once you have the Apple Developer Program (physical iOS device / TestFlight)

```bash
npx eas-cli@latest device:create          # register your physical test device (for ad-hoc/preview builds)
npx eas-cli@latest build --profile preview --platform ios      # installable via a link on registered devices
npx eas-cli@latest build --profile production --platform ios --auto-submit   # → TestFlight
```

`eas credentials` walks through linking your Apple ID and lets EAS manage
certificates/provisioning profiles for you the first time you build for a real
device.

## What I (Claude) can and can't do here

This session runs headless — no browser, no Apple ID/Google login flow, no
local Simulator or emulator. I can write `eas.json`/CI config, and once
`EXPO_TOKEN` exists as a repo secret I can trigger `eas build` non-interactively
via CI and read back build status/logs. I cannot complete the interactive `eas
login`/`eas init` account linking, enroll you in Apple Developer Program or
Google Play Console, or (without a paid EAS Simulator/device plan on your
account) run/screenshot the app myself.

## Apps using this infrastructure

- `poker-zone-trainer/` — `eas.json` added 2026-09-10, Android profiles added
  2026-09-11. Not yet built — no EAS/Apple/Google accounts configured as of
  this writing (see its own README.md for app-specific setup notes).
