# Dispatcher Console — Architecture

The Dispatcher Console is the operational heart of Laviius: everything a
dispatcher needs for a full shift lives at `/dispatcher`. This doc covers the
architecture behind the implementation in `src/app/dispatcher/**` and
`src/components/dispatcher/**`.

## 1. Information Architecture

```
/dispatcher                 Dashboard — Action Feed + KPIs + Shipment Queue
/dispatcher/queue           Dispatch Queue — same console, scrolled/focused on the queue
/dispatcher/shipments        Shipment archive (stub — see "Deferred scope")
/dispatcher/carriers         Carrier directory (stub)
/dispatcher/drivers          Driver directory (stub)
/dispatcher/customers        Customer directory (stub)
/dispatcher/live-map         Live Map, full page
/dispatcher/claims           Claims workspace (stub)
/dispatcher/reports          Reports (stub)
/dispatcher/settings         Settings (stub)
```

Dashboard and Dispatch Queue are two entry points into one console — the
brief is explicit that "everything revolves around this screen," so both
sidebar items render `<DispatcherConsole>` with a different `initialFocus`
rather than fragmenting shipment data across separate views.

**Deferred scope.** Carriers/Drivers/Customers/Shipments/Claims/Reports/Settings
are real nav destinations (not dead links) but render a `ComingSoon` empty
state rather than a full workspace — building seven more full-depth
workspaces was out of scope for this pass. Carrier recommendations,
carrier/driver/customer data, and claims-relevant documents are already live
*inside* the Shipment drawer, which is where a dispatcher actually needs them
during a shift.

## 2. User Flow

1. Customer submits a request through the Shipment Request Wizard (`/book`,
   separate workstream) → shipment lands in dispatch with `status:
   "waiting_assignment"`.
2. Dispatcher sees it surface in the **Action Feed** within seconds
   (`waiting_assignment` action item, red/orange by wait time).
3. Dispatcher clicks **Assign Carrier** → drawer opens on the **Carrier**
   tab with ranked recommendations and a plain-language reason for each.
4. Dispatcher clicks **Assign** → shipment moves to `assigned`, a timeline
   event is recorded, the feed item clears itself.
5. As the shipment progresses (carrier accepts, driver assigned, en route,
   delivered), the **Operations Timeline** accumulates an immutable audit
   trail; delays and exceptions re-surface in the Action Feed and Alert
   Center automatically — the dispatcher never has to go looking for them.
6. On delivery, a `ready_to_invoice` feed item appears; **Generate Invoice**
   closes the loop.

## 3–4. UI/UX & Responsive Layout

Visual language extends the existing marketing site's tokens (`--color-navy`,
`--color-electric`, `--color-emerald`, Inter) rather than introducing a new
palette — see `src/app/globals.css`. Status semantics (7 shipment statuses,
6 action-feed severities) use Tailwind's stock palette (blue/purple/orange/
indigo/emerald/red/slate) layered on top, so the brand colors stay reserved
for navigation and primary actions.

Layout is desktop-first and information-dense (fixed sidebar + top nav,
data-grid queue, drawer overlay) per the brief. Below `md` the sidebar
collapses; the queue and KPI grid reflow to 2–3 columns; the drawer becomes
full-width. Deeper phone optimization (e.g. a bottom nav) was not built —
this is explicitly "desktop-first, mobile responsive where appropriate," and
a dispatcher's primary device is a workstation.

## 5. React Component Tree

```
DispatcherLayout (server)                        src/app/dispatcher/layout.tsx
└─ DispatcherProvider (client, context+reducer)   lib/dispatcher/store.tsx
   └─ ConsoleShell (client)                       components/dispatcher/layout/ConsoleShell.tsx
      ├─ TopNav                                   .../layout/TopNav.tsx
      │  └─ AlertCenter                           .../alerts/AlertCenter.tsx
      ├─ Sidebar                                  .../layout/Sidebar.tsx
      ├─ {page children}
      │  └─ DispatcherConsole                     components/dispatcher/DispatcherConsole.tsx
      │     ├─ KpiRow → KpiCard                   .../kpi/*
      │     ├─ ActionFeed → ActionFeedCard         .../feed/*
      │     └─ ShipmentQueue                       .../queue/ShipmentQueue.tsx
      │        ├─ QueueToolbar                     .../queue/QueueToolbar.tsx
      │        └─ ShipmentRow (virtualized)        .../queue/ShipmentRow.tsx
      ├─ ShipmentDrawer                            .../drawer/ShipmentDrawer.tsx
      │  └─ SummaryTab / TimelineTab / CarrierTab /
      │     CommunicationTab / DocumentsTab        .../drawer/tabs/*
      ├─ GlobalSearch (cmd/`/`-triggered)           .../search/GlobalSearch.tsx
      └─ ToastStack                                 .../shared/ToastStack.tsx
```

`LiveMap` (`components/dispatcher/map/LiveMap.tsx`) is mounted standalone at
`/dispatcher/live-map` rather than embedded in the console, since a full-size
map and a dense queue compete for the same vertical space; the drawer and
search remain reachable from every page because they live in `ConsoleShell`.

## 6. Tailwind / Styling Conventions

- Reuses the existing `cn()` helper (`src/lib/cn.ts`) — no new className
  utility introduced.
- Status/priority/billing color maps centralized in
  `lib/dispatcher/status.ts` so a color never gets redefined ad hoc in a
  component.
- Shared primitives (`StatusBadge`, `PriorityBadge`, `Avatar`, `EmptyState`,
  `Skeleton`) live under `components/dispatcher/shared/` and are the only
  place badge/skeleton markup is written.

## 7. TypeScript Interfaces

All domain types live in `src/types/dispatcher.ts`: `Shipment`, `Carrier`,
`Driver`, `Customer`, `CarrierRecommendation`, `TimelineEvent`, `Message`,
`ShipmentDocument`, `ActionFeedItem`, `OperationalAlert`, `KpiMetric`, and
the enums backing them (`ShipmentStatus`, `ShipmentPriority`, `CargoType`,
`VehicleType`, `ServiceType`).

**Wizard integration.** These types intentionally reuse the Shipment Request
Wizard's vocabulary (`@/types/shipment` in the wizard workstream) —
`pickup`/`delivery`/`cargo`/`requestedServices`, the same `CargoType` /
`VehicleType` / `ServiceType` unions, and the wizard's `LV-XXXXXX`
`referenceNumber` format. A submitted `ShipmentFormValues` maps onto a
`Shipment` by adding the operational fields dispatch owns: `status`,
`assignedCarrier`/`assignedDriver`, `timeline`, `billingStatus`, etc. No
adapter exists yet because the wizard branch isn't merged; once it is, the
mapping is a straight field-for-field function, not a redesign.

## 8. Folder Structure

```
src/
  app/dispatcher/            routes (layout, loading, error + one page per nav item)
  components/dispatcher/
    layout/                  TopNav, Sidebar, ConsoleShell
    feed/                    Action Feed
    kpi/                     KPI cards
    queue/                   Shipment Queue (columns, sort, toolbar, row, virtualization)
    drawer/                  Shipment Details drawer + its 5 tabs
    map/                     Live Map
    search/                  Global Search (cmd palette)
    alerts/                  Alert Center
    shared/                  StatusBadge, PriorityBadge, Avatar, EmptyState, Skeleton, ToastStack, ComingSoon
  lib/dispatcher/
    store.tsx                Context + reducer + simulated real-time ticker
    mockData.ts              Snapshot generator + carrier ranking algorithm
    useKeyboardShortcuts.ts   Global shortcut hook
    status.ts / labels.ts / time.ts   Formatting & lookup tables
    queuePreferences.ts       localStorage-backed view/column persistence
  types/dispatcher.ts        Domain types
```

## 9. Suggested Database Schema

The mock generator (`lib/dispatcher/mockData.ts`) doubles as the schema
sketch — every field it produces is a column a real backend would need.
Suggested relational shape:

```
customers(id, name, company_name, tier, phone, email, shipments_completed)
carriers(id, name, on_time_pct, damage_rate_pct, acceptance_rate_pct,
         avg_response_minutes, white_glove_certified, insurance_status,
         insurance_expires_at)
vehicles(id, carrier_id fk, type, capacity_tons)
drivers(id, carrier_id fk, name, phone, status, current_lat, current_lng, rating)

shipments(id, number, reference_number, status, priority, created_at,
          customer_id fk, requested_vehicle, billing_status,
          assigned_carrier_id fk null, assigned_driver_id fk null,
          dispatcher_id fk null, eta_minutes,
          pickup_delay_minutes, delivery_delay_minutes)
shipment_stops(id, shipment_id fk, kind[pickup|delivery], company_name,
               contact_name, phone, line1, city, region, postal_code,
               lat, lng, scheduled_for, appointment_required, notes)
shipment_cargo(shipment_id fk, cargo_type, quantity, weight_lbs,
               length, width, height, unit, declared_value_usd)
shipment_services(shipment_id fk, service_type)   -- many-to-many
shipment_documents(id, shipment_id fk, name, kind, url, uploaded_at)
timeline_events(id, shipment_id fk, timestamp, label, actor_name,
                 actor_role, source, notes)
messages(id, shipment_id fk, channel, author_name, author_role, body,
         timestamp)
action_feed_items(id, shipment_id fk, type, severity, title, detail,
                   occurred_at, dismissed_at null)
alerts(id, shipment_id fk null, type, severity, message, created_at, read_at null)
```

`action_feed_items` and `alerts` are largely *derived* state (see §18) —
persisting them is mainly for dismiss/read tracking and audit history, not
because they're primary source of truth.

## 10. Suggested API Endpoints

```
GET    /api/dispatch/snapshot            shipments + carriers + customers + feed + alerts + kpis
GET    /api/shipments?status=&priority=&q=&cursor=     paginated queue (cursor for true infinite scroll)
GET    /api/shipments/:id
PATCH  /api/shipments/:id                 notes, pin, billing status
POST   /api/shipments/:id/assign-carrier  { carrierId }
POST   /api/shipments/:id/messages        { channel, body }
POST   /api/shipments/:id/invoice
GET    /api/shipments/:id/carrier-recommendations   ranked list + reasons
POST   /api/action-feed/:id/dismiss
GET    /api/alerts
POST   /api/alerts/:id/read
POST   /api/alerts/read-all
GET    /api/kpis?range=today
WS/SSE /api/dispatch/stream                real-time shipment/feed/alert deltas (see §18)
```

## 11. State Management

A single `DispatcherProvider` (`lib/dispatcher/store.tsx`) holds all console
state in a `useReducer`, exposed via `useDispatcher()`. Chosen over a
dependency like Zustand/Redux because the state graph is one flat snapshot
with a handful of mutations (assign, dismiss, invoice, pin, note, message) —
a reducer makes every transition explicit and diffable in review, with no
extra dependency.

Local, per-view UI state (search text, active saved view, column visibility,
sort, selection, roving focus index) stays in the owning component
(`ShipmentQueue`) rather than the global store — it's not needed anywhere
else and keeping it local avoids unrelated re-renders of the rest of the
console on every keystroke.

**User preferences** (column visibility, last-used saved view) persist to
`localStorage` via `queuePreferences.ts`, read lazily on mount so there is
never a server/client mismatch.

## 12. Accessibility Review (WCAG AA)

- Full keyboard operability: `/` search, `N` new shipment, `A` assign
  carrier, `M` map, `T` timeline, `Esc` close (`useKeyboardShortcuts.ts`),
  plus roving `ArrowUp`/`ArrowDown` + `Enter`/`Space` inside the queue grid.
- Drawer and Global Search are `role="dialog"` + `aria-modal`; drawer tabs
  use `role="tablist"`/`role="tab"`/`aria-selected`; the queue is
  `role="grid"`/`role="row"`.
- Every icon-only control has `aria-label` (pin, dismiss alert, close
  drawer, layer toggles on the map).
- Status is never color-only: every status/priority/severity indicator
  pairs a dot with a text label.
- Focus states use `focus-visible` rings inherited from the existing
  `Button` component's convention; new interactive elements follow the same
  pattern (`ring-1 ring-electric/40` etc.).
- Click targets sized ≥32px (most 36–40px) per the existing design system.
- `prefers-reduced-motion` is already handled globally in `globals.css`; all
  new Framer Motion transitions respect it by inheritance.

**Known gap:** the schematic Live Map's marker cluster popovers are
mouse/keyboard-clickable but not yet arrow-key-navigable as a group — flagged
here rather than silently shipped, since a full map SDK integration will
change this surface anyway.

## 13. Performance Optimizations

- **Virtualized queue**: `@tanstack/react-virtual` renders only visible
  rows regardless of dataset size (`ShipmentQueue.tsx`).
- **Stable callbacks for the keyboard hook**: `useKeyboardShortcuts` stores
  handlers in a ref and binds the `keydown` listener exactly once, instead
  of re-subscribing on every render.
- **Context value memoization** in `DispatcherProvider` avoids handing every
  consumer a new object identity on unrelated state changes.
- Mock data generation (and all `Date.now()`/`Math.random()` use) is
  deferred to a post-mount effect, never the render path — this is also
  what keeps the loading skeleton hydration-safe (see §17).
- CSV export and search are pure client-side computations over the
  in-memory snapshot; at real scale these move server-side behind the
  `/api/shipments` cursor endpoint (§10).

## 14. Animation Specifications

Framer Motion, consistent with the marketing site's existing usage:

| Surface | Effect |
|---|---|
| Shipment drawer | slide-in from right, spring (`damping: 32, stiffness: 320`) |
| Global Search / backdrop | fade + scale-in, `duration: 0.16–0.18` |
| Action Feed cards | `layout` + fade/slide on add, height-collapse on dismiss |
| Toasts | slide-up + fade, auto-dismiss after 4s |
| Drawer tab indicator | shared `layoutId` underline that slides between tabs |

All durations stay in the 150–320ms range — fast enough to never feel like
it's in the dispatcher's way, per the "calm, fast" design philosophy.

## 15–17. Error / Empty / Loading States

- **Loading**: `DispatcherConsole` and `/dispatcher/live-map` render
  skeleton placeholders (`shared/Skeleton.tsx`) matching the final layout's
  shape until the mock snapshot resolves — no layout shift on load.
- **Empty**: every list (`ActionFeed`, `ShipmentQueue`, `AlertCenter`,
  `TimelineTab`, `CommunicationTab`, `DocumentsTab`, `LiveMap`) has a
  dedicated `EmptyState` with an icon, plain-language explanation, and a
  next action — never a bare blank table.
- **Error**: `src/app/dispatcher/error.tsx` is a route-level error boundary
  in human language ("This didn't affect any shipments...") with a **Try
  again** action; no stack traces or technical detail are ever shown to the
  dispatcher.

## 18. Real-time Update Architecture

Today: `DispatcherProvider` runs a 20s `setInterval` (`TICK` action) that
nudges in-transit ETAs down, simulating a live feed without a backend.

For production, `action_feed_items` and `alerts` should be computed
server-side the same way `mockData.ts`'s `buildActionFeed`/`buildAlerts`
compute them client-side today — as a derived projection over shipment
state changes — and pushed to the client over the `/api/dispatch/stream`
SSE/WebSocket channel from §10. The client-side reducer already models this
correctly: every server push is just another action dispatched into the same
`reducer` (`SNAPSHOT_LOADED`-shaped deltas), so swapping the mock ticker for
a real stream doesn't change component code, only what feeds the store.

## 19. Component Documentation

Each component file is intentionally short and single-purpose; the
component tree in §5 doubles as the map of what owns what. Non-obvious
decisions are called out as inline comments at the point they matter (e.g.
why mock data generation is deferred to an effect, why the keyboard hook
uses a ref) rather than in separate docstrings that would drift from the
code.

## 20. AI Placeholders (reserved, not implemented)

Per spec, no AI is implemented. The architecture already isolates the two
seams a future AI module would plug into without touching UI code:

- `rankCarriersForShipment()` in `lib/dispatcher/mockData.ts` is a pure
  `(shipment, carriers) → CarrierRecommendation[]` function. Swapping its
  scoring heuristic for a model call is a drop-in replacement — `CarrierTab`
  doesn't know or care how the ranking was produced.
- `buildActionFeed()` / `buildAlerts()` are pure projections over shipment
  state. A "Predict Delay" or "Detect Bottlenecks" model would add entries
  to this same projection, not a new UI surface.

Global Search (`GlobalSearch.tsx`) is a plain substring filter today; a
natural-language search backend would replace its `results` computation
without changing the dialog, keyboard handling, or result rendering.
