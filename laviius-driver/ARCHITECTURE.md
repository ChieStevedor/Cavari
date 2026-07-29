# Laviius Driver — Architecture

This document is the system-level reference for the driver app: information
architecture, user journey, API contract, state management, offline sync,
and the cross-cutting concerns (accessibility, performance, security). The
code under `src/` is the source of truth; this doc explains *why* it's
shaped the way it is.

## 1. Information Architecture

```
Root
├── / (auth gate → redirects to /login or /(tabs)/home)
├── /login                          biometric unlock / sign-in
└── (tabs)                          4 tabs, always visible once signed in
    ├── Home                        mission control — Action Center
    ├── Today's Jobs                full worklist, filterable
    ├── Messages                    thread list (dispatcher / carrier / internal)
    └── Profile                     driver record, certs, performance, documents

/job/[id]                           Job Details (route, cargo, notes, White Glove reqs)
/job/[id]/accept                    Accept Assignment
/job/[id]/navigate?leg=pickup|delivery
/job/[id]/arrival?leg=pickup|delivery
/job/[id]/loading-checklist
/job/[id]/cargo-verification
/job/[id]/photos?leg=pickup|delivery
/job/[id]/confirm-loaded
/job/[id]/unload-checklist
/job/[id]/white-glove               skipped entirely when !isWhiteGlove
/job/[id]/signature                 skipped entirely when !requiresSignature
/job/[id]/pod                       auto-generates POD, "Complete Shipment"
/job/[id]/report-issue              modal, reachable from any workflow screen

/messages/[threadId]                shipment/carrier conversation
```

Four tabs, no more (per spec). Everything inside an active shipment is a
**stack**, not a tab — that's deliberate: the guided workflow is linear and
the driver should never have lateral navigation options while mid-task.

## 2. End-to-end driver user journey

1. Sign in / biometric unlock → lands on **Home**.
2. Home shows the **Action Center**: one color-coded card naming the exact
   next required action for the current assignment (never a list, never a
   menu — see `src/components/job/ActionCenterCard.tsx`).
3. Tapping the card enters the **guided workflow**
   (`src/domain/workflow.ts` `STAGE_SEQUENCE`), one screen per stage:
   Accept → Navigate to Pickup → Confirm Arrival → Loading Checklist →
   Cargo Verification → Pickup Photos → Confirm Loaded → Start Route →
   Navigate to Delivery → Confirm Arrival → Unload Checklist →
   [White Glove Tasks] → [Customer Signature] → Delivery Photos → POD →
   Complete.
4. Every screen's primary CTA both **commits the step's data** (checklist
   answers, photos, signature, White Glove task completion) **and**
   **advances + routes to the next screen** in one tap
   (`src/hooks/useAdvanceWorkflow.ts`) — the driver is never dropped back
   at a menu to hunt for what's next.
5. Stages bracketed above are conditionally skipped per-shipment
   (`skipIf` in `STAGE_SEQUENCE`): White Glove tasks only appear when
   `shipment.isWhiteGlove`, signature only when `shipment.requiresSignature`.
6. An issue can be reported from any point in the flow
   (`/job/[id]/report-issue`) without losing workflow position — it does
   not advance or rewind the stage, it just raises an exception and
   notifies dispatch.
7. On completion the shipment status flips to `completed`; Home's Action
   Center then surfaces the **next** assignment, or an empty state if
   dispatch hasn't assigned one yet.

## 3. Workflow state machine

`src/domain/workflow.ts` is the single source of truth for stage order and
transitions. `STAGE_SEQUENCE` is an ordered array of `{ stage, actionLabel,
color, icon, route, skipIf }`. Screens never hardcode "what's next" — they
call `getNextStage(shipment)` (via `useAdvanceWorkflow`), which walks the
sequence and skips inapplicable stages. This is what guarantees the spec
requirement "the driver cannot accidentally skip critical steps": there is
no code path that sets `stage` to an arbitrary value from the UI layer,
only `advanceStage()` moving forward one step at a time.

Checklist definitions (`src/domain/checklists.ts`) are similarly
declarative: `buildPickupChecklist()` / `buildDeliveryChecklist()` produce
the exact item set from the spec, with `isWarningItem` flipping the
color semantics for "Visible damage?" (answering **true** is the alarming
outcome, not false).

## 4. Component hierarchy (high-level)

```
RootLayout (providers: QueryClient+persistence, SafeArea, GestureHandler)
├── (tabs)/_layout            Tabs shell, 4 screens, unread badge on Messages
│   ├── Home
│   │   ├── OfflineBanner
│   │   ├── ActionCenterCard  → StatusPill-colored, routes into workflow
│   │   ├── CountdownChip ×2  pickup / delivery
│   │   ├── QuickAction ×4    Call / Message / Job Details / Report Issue
│   │   └── JobSummaryCard    next assignment preview
│   ├── Jobs                  filter chips + FlatList<JobSummaryCard>
│   ├── Messages               FlatList<ThreadRow>
│   └── Profile                stats, certifications, documents
├── job/[id]/index (Job Details)
│   ├── StageStepper           slim linear progress
│   ├── ActionCenterCard
│   ├── AddressBlock ×2        pickup / delivery
│   ├── Cargo card, Vehicle card, White Glove card, Notes card, Photos grid
├── job/[id]/*                 one screen per workflow stage (see IA above)
│   └── every screen: ScreenHeader + content + PrimaryActionBar (1 CTA)
└── messages/[threadId]        MessageBubble list + QuickReplies + composer
```

Shared primitives live in `src/components/ui/`: `Button`, `Card`,
`StatusPill`, `ChecklistRow`, `PhotoGrid`, `SignaturePad`, `CountdownChip`,
`PrimaryActionBar`, `ScreenHeader`, `EmptyState`, `Skeleton`,
`OfflineBanner`. Every workflow screen is built from these — no screen
invents its own button or card styling.

## 5. State management

Two layers, deliberately separate:

- **Zustand stores** (`src/stores/`) are the **offline-first source of
  truth** the UI reads from, each persisted to `AsyncStorage`:
  - `shipmentStore` — shipments + every workflow mutation (advanceStage,
    checklist answers, photos, White Glove tasks, exceptions, signature,
    POD generation). Every mutation is synchronous and optimistic; nothing
    waits on the network.
  - `messagesStore` — threads + messages, optimistic send.
  - `authStore` — driver session, biometric enrollment.
  - `connectivityStore` — live `NetInfo` state.
  - `syncQueueStore` — the offline mutation queue (§6).
- **TanStack Query** (`src/api/queries.ts`) is the **server hydration
  layer**: it fetches shipments/driver profile/threads on mount and
  reconnect, and seeds the Zustand stores the first time there's no local
  data. It never becomes the thing screens read from directly — that
  indirection is what lets every workflow screen work identically whether
  the device is online or has been offline for a full shift.

## 6. Offline synchronization architecture

Every mutation that must reach the server is written to the local store
immediately (instant UI, works with zero signal), then enqueued in
`syncQueueStore`:

```
Driver action → Zustand store (instant, local, persisted)
             → syncQueueStore.enqueue({ type, shipmentId, payload })
             → if online: flush() now
             → else: stays queued, persisted to AsyncStorage
```

`flush()` drains the queue in order via `pushShipmentEvent` (`api/client.ts`),
stopping at the first failure to preserve ordering and retry-eligibility
rather than retrying every item on every tick. Two triggers re-run it:

1. **Reconnect** — `initSyncOnReconnect()` subscribes to `connectivityStore`
   and flushes the instant `NetInfo` reports a transition to online.
2. **Background fetch** — `lib/offlineSync.ts` registers a
   `expo-background-fetch` + `expo-task-manager` task so the queue drains
   even if the app is backgrounded when signal returns (e.g. walking out
   of an underground warehouse with the phone in a pocket).

Photos follow the same pattern at the asset level: `addPhoto()` attaches
the local file to the shipment immediately (`uploadStatus: "pending"`);
`useCapturePhoto` (`api/mutations.ts`) then background-uploads and flips
the status to `uploaded`/`failed` without blocking the workflow screen's
primary action.

## 7. Push notification architecture

Categories are deliberately minimal (spec: "minimize unnecessary
notifications") — `src/lib/notifications.ts`:

| Category | Trigger |
|---|---|
| `assignment_received` | Dispatcher/Carrier Dispatcher assigns a shipment |
| `schedule_changed` | Appointment window or vehicle changes |
| `dispatcher_message` | New message in a shipment or carrier thread |
| `customer_update` | Customer-initiated change (address, contact) |
| `urgent_instruction` | Dispatcher-flagged urgent note |

Routine workflow state changes (checklist progress, photo upload
completion) are never pushed — the Action Center is the source of truth
for "what's next," notifications are reserved for things that need
attention *right now* even if the app is backgrounded.

## 8. API endpoints

`src/api/client.ts` is the only module that talks HTTP; every function
matches this contract so swapping `USE_MOCK = false` requires no screen or
store changes.

```
GET   /shipments                       today + upcoming shipments for the signed-in driver
GET   /driver/profile                  driver record, certs, performance, documents
GET   /message-threads                 threads across all shipments + carrier/internal

POST  /shipments/:id/events            replays one offline-queued mutation
      body: { type: SyncEventType, payload, occurredAt }
      SyncEventType = stage_advanced | checklist_updated | photo_captured
                     | white_glove_task_updated | exception_reported
                     | signature_captured | pod_generated | message_sent

POST  /photos                          multipart upload, returns { remoteUrl }
POST  /push-tokens                     register Expo push token (called after
                                        registerForPushNotificationsAsync())
```

The event-log shape (`POST /shipments/:id/events`) rather than one REST
endpoint per action is intentional: it's what makes the offline queue
generic — `syncQueueStore` doesn't need per-mutation-type networking code,
every queued item replays through the same call.

## 9. Accessibility review (WCAG AA)

- **Touch targets**: `constants/theme.ts` `touchTarget` — 52pt default,
  60pt for primary CTAs, never below the 44pt floor. `PrimaryActionBar`,
  `Button`, and `ChecklistRow` all build on these.
- **Contrast**: dark theme built around `#F5F7FF` text on `#0B0F19`/`#12172A`
  surfaces (>13:1); semantic colors (`go`/`attention`/`info`/`premium`/
  `danger`) each carry a `-muted` background variant tuned so foreground
  text/icon meets 4.5:1 minimum.
- **Screen readers**: every interactive element sets `accessibilityRole`
  and a descriptive `accessibilityLabel` (see `ChecklistRow`,
  `ActionCenterCard`, `Button`) rather than relying on visual layout alone;
  `OfflineBanner` uses `accessibilityLiveRegion="polite"` so connectivity
  changes are announced without stealing focus.
- **Dynamic text**: type scale uses point sizes with generous line-height
  (`constants/theme.ts` `typography`) rather than fixed pixel-tight
  containers, so OS-level text scaling doesn't clip content.
- **Haptics**: `lib/haptics.ts` gives non-visual confirmation for
  selection/action/success/warning — important for a driver glancing away
  from the screen.

## 10. Performance

- **Cold start**: `expo-splash-screen` held via `preventAutoHideAsync()`
  until providers are mounted, not until data loads — first paint is
  instant, data streams in behind skeletons.
- **Instant-from-cache**: `PersistQueryClientProvider` +
  `networkMode: "offlineFirst"` means a returning driver sees their last
  known shipment list immediately, before any network round trip.
- **Battery-efficient GPS**: `lib/location.ts` uses `Balanced` accuracy for
  one-shot reads and only switches to `High` accuracy with a 50m distance
  filter while a route is actively being driven (`watchPositionDuringRoute`)
  — never polls continuously with no active shipment.
- **Photo payload**: `lib/photoCapture.ts` resizes to a 1600px max
  dimension and compresses to quality 0.72 before it ever touches local
  storage or the upload queue — keeps sync fast on poor dock/warehouse
  signal.
- **Skeletons over spinners**: `components/ui/Skeleton.tsx` — Action Center
  and job cards render their final layout immediately with animated
  placeholders, avoiding layout shift when data arrives.

## 11. Security considerations

- **Biometric unlock**: `expo-local-authentication` gates session resume
  (`login.tsx`) — a returning driver never re-types credentials mid-shift.
- **Session data**: `authStore` persists the driver profile for instant
  offline usability; the session token is separated out in the persisted
  slice specifically so it can be swapped to `expo-secure-store` (encrypted
  keychain/keystore) without touching the profile-caching behavior.
- **Transport**: `api/client.ts` is the single chokepoint for all HTTP —
  going live means pointing it at HTTPS with auth headers; no screen
  constructs its own network call.
- **Device registration**: push token registration
  (`registerForPushNotificationsAsync`) is the hook point for associating
  a device with a driver session server-side.

## 12. Animation specification

`constants/theme.ts` `motion`: `fast` (150ms) for micro-feedback
(checkbox toggles, pill selection), `base` (220ms) for screen-level
transitions, `slow` (320ms) for the Action Center card entrance, all on an
`easeOut` curve (`[0.16, 1, 0.3, 1]`) — matches the "confident, not bouncy"
brief. Skeletons pulse on a 700ms sine-like opacity loop
(`components/ui/Skeleton.tsx`).

## 13. Empty / loading / error states

- **Empty**: `components/ui/EmptyState.tsx` — icon + title + one-sentence
  explanation of what happens next (never a dead end). Used for "no
  assignment" on Home, "no jobs today" filtered views, and "no
  conversations yet" on Messages.
- **Loading**: skeleton components (`ActionCenterSkeleton`,
  `JobCardSkeleton`) mirror the real layout so nothing jumps once data
  arrives; `RefreshControl` on Home/Jobs for manual pull-to-refresh.
- **Error**: network failures never surface raw errors to the driver —
  `queryClient`'s `offlineFirst` network mode means a failed background
  refetch silently keeps the last good cached state; the only
  driver-visible network signal is the `OfflineBanner` ("Offline — N
  updates will sync automatically" / "Syncing…"), which is informational,
  not blocking.

## 14. Future AI placeholders

Per spec, no AI is implemented. The seams that would host it without a
rewrite: `syncQueueStore`'s event log (a natural point to attach a
`ProcessedByAI` flag), `lib/notifications.ts`'s category enum (would grow a
`voice_assistant_prompt` category), and `domain/workflow.ts`'s
`getNextStage` (the natural insertion point for a future route-optimization
or ETA-prediction override). None of these are wired up — they're simply
places where the existing architecture doesn't need to change shape to
accommodate them later.
