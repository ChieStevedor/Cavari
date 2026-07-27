# Laviius Shipment Request Wizard v2.0 — Design Reference

This document is the design rationale for the wizard implemented under
`src/app/book`, `src/components/wizard`, and `src/lib/shipment`. It exists
so future changes stay consistent with the intent behind the code rather
than only with the code itself.

## 1. UX rationale

The wizard is built on three cooperating systems, each with a single job:

- **Adaptive Workflow** (`lib/shipment/rules.ts`) decides *which fields
  exist* for this shipment. It's a small rule engine: each `AdaptiveRule` is
  a predicate over the current form values that reveals or conceals a set
  of `AdaptiveFieldKey`s. Concealment always wins over revelation, because
  vehicle capability ("this truck doesn't have a tailgate") outranks
  customer preference ("I picked Furniture, which usually wants Blanket
  Wrap"). Most fields default to *hidden* until a rule reveals them
  (pallet/furniture/appliance fields); a small set of base fields default to
  *visible* until a rule conceals them (pickup/delivery date & time, which
  disappear only under ASAP).
- **Progressive Disclosure** (`AdaptiveFieldGroup`, the "More Services"
  collapse in `ServiceSelector`) decides *when and how* a field that Adaptive
  Workflow has deemed relevant actually appears on screen — animated in with
  Framer Motion instead of causing a layout jump, and grouped so the
  cargo-specific recommendations are visually distinct from the rest.
- **Freight Intelligence** (`lib/shipment/intelligence.ts`) is a separate,
  additive layer: given the same form values, it proposes actions a logistics
  expert would suggest (vehicle sizing, movers, insurance). It never hides or
  requires anything — every suggestion is dismissible and purely advisory,
  rendered by `IntelligenceSuggestionBanner`.

These three systems read the same `ShipmentFormValues` object but never
share state directly — each is a pure function of the form values, recomputed
on every render. That keeps the interactions predictable: nothing but the
current field values determines what the customer sees next.

## 2. Information architecture

```
ShipmentWizard (orchestrator, owns RHF form + phase state)
├── Phase: loading            → WizardSkeleton
├── Phase: template-select    → TemplateSelector
├── Phase: wizard             → ShipmentStepper + step content + LiveSummaryPanel / MobileSummaryChip
│   ├── StepPickup             → ContactCard + AddressCard
│   ├── StepDelivery           → ContactCard + AddressCard
│   ├── StepShipmentDetails    → CargoCard (RadioCardGroup + AdaptiveFieldGroup×3 + UploadZone×2)
│   ├── StepRequiredService    → VehicleSelector + ServiceSelector + Priority RadioCardGroup
│   └── StepReview             → TimelineSummary + ReviewCard×4 + PriceEstimate + Submit
└── Phase: success             → SuccessScreen + SaveAsTemplateModal
```

Cutting across all of `wizard`: `AdaptiveFieldGroup` (mount/unmount
animation), `IntelligenceSuggestionBanner` (suggestions), `ReviewCard`
(edit-in-place sections).

## 3. User flow

**First-time customer (target: <60s):**
`/book` → no draft, no templates → Pickup → Delivery → Shipment Details →
Required Service → Review → Submit → Success → optional Save as Template.

**Returning customer with a template (target: 10–15s):**
`/book` → templates found → `TemplateSelector` → pick a template → form is
populated via `form.reset(template.values)` → jump straight to `Review` →
Submit.

**ASAP fast path:**
On `StepRequiredService`, choosing Priority = ASAP immediately clears and
hides `pickup.date`/`pickup.time`/`delivery.date`/`delivery.time` (Adaptive
Workflow rule `priority-asap`) and swaps in a one-line confirmation ("we'll
request the earliest available window automatically"). `PriceEstimate` and
`LiveSummaryPanel` immediately reflect the ASAP multiplier and pickup-window
copy — nothing about this path requires a distinct screen.

**Interrupted session:**
Every field change autosaves the current step + values to `localStorage`
(debounced 400ms). Reloading `/book` restores exactly where the customer
left off — this is also what "if internet disconnects, save locally"
means in practice: autosave never touches the network, so it's unaffected
by connectivity.

## 4. Wireframe-quality layout

Desktop (`≥1024px`):

```
┌───────────────────────────────────────────────────────────────────────┐
│ ‹  ① Pickup ─ ② Delivery ─ ③ Shipment ─ ④ Service ─ ⑤ Review           │  ← ShipmentStepper (sticky)
├───────────────────────────────────────────────────────────────────────┤
│  ┌─ Intelligence suggestions (dismissible) ─────────────────────────┐ │
│  └────────────────────────────────────────────────────────────────-┘ │
│  ┌─ Step content (max-w-2xl) ─────────────┐   ┌─ Live Summary ─────┐  │
│  │  SectionCard: Contact Information       │   │ Pickup → Delivery  │  │
│  │  SectionCard: Pickup Address            │   │ Vehicle  Services  │  │
│  │  (AdaptiveFieldGroup: date/time)        │   │ Cost     Pickup    │  │
│  │                                         │   │ Progress ▓▓▓▓░ 60% │  │
│  │           [Back]           [Continue →]│   └────────────────────┘  │
│  └─────────────────────────────────────────┘                          │
└───────────────────────────────────────────────────────────────────────┘
```

Mobile (`<1024px`): the right column collapses; `MobileSummaryChip` renders
as a fixed pill above the safe area ("Richmond → Burnaby · $369–$471 ⌃")
that expands into a bottom-sheet drawer with the same fields as the desktop
panel.

## 5–9. Components, types, validation, folder structure

See the code directly — it's the source of truth:

- **Components:** `src/components/wizard/*` (+ `steps/*`), reusable
  primitives in `src/components/ui/*`.
- **Types incl. adaptive rule schema:** `src/types/shipment.ts`
  (`AdaptiveRule`, `AdaptiveFieldKey`, `VisibilityState`).
- **Validation (Zod):** `src/lib/shipment/schema.ts` — one schema with
  `superRefine` for conditionally-required fields (pickup/delivery
  date-time unless ASAP; pallet/furniture fields when that cargo type is
  selected), plus `STEP_FIELD_NAMES` used to scope `form.trigger()` per step.
- **Folder structure:**
  ```
  src/
    app/book/page.tsx
    components/
      ui/            ← generic form primitives (TextField, Toggle, RadioCardGroup, ...)
      wizard/         ← wizard-specific components + steps/
    lib/shipment/     ← rules, intelligence, pricing, schema, storage, templates, constants
    types/shipment.ts
  ```

## 10. Responsive behaviour

`LiveSummaryPanel` is `hidden lg:block`; `MobileSummaryChip` is `lg:hidden`.
Both read the same `getShipmentSummary()`/`computeProgressPercent()`
selectors in `lib/shipment/summary.ts`, so desktop and mobile can never
show different numbers.

## 11. Accessibility

- All inputs are labelled via `FormField`/`TextField`'s `htmlFor`/`id` pairing.
- `RadioCardGroup` and `CheckboxChip` use real `role="radiogroup"`/`role="checkbox"`
  semantics with visible focus rings, not just colour.
- Errors are announced via `role="alert"`; the suggestion banner region is
  `aria-live="polite"`.
- Toggle switches use `role="switch"` + `aria-checked`.
- Everything is reachable and operable by keyboard (native `<input type="radio">`
  under the styled cards, native `<button>` for chips/toggles).

## 12. Animations

Framer Motion is used for: step transitions (slide + fade in
`ShipmentWizard`), field reveal/hide (`AdaptiveFieldGroup`, height + opacity),
suggestion enter/exit (`IntelligenceSuggestionBanner`), progress bar and
Live Summary Panel progress fill (spring), and the mobile summary drawer
(spring slide-up). `prefers-reduced-motion` is respected globally via
`globals.css`.

## 13–15. Empty, loading, and error states

- **Empty:** "None yet" / "Not selected" placeholders in `LiveSummaryPanel`;
  empty `UploadZone` shows the drop target with no file list.
- **Loading:** `WizardSkeleton` while the client checks `localStorage` for a
  draft/templates (this also avoids an SSR/CSR hydration mismatch, since the
  server can't see `localStorage`); `Loader2` spinner + "Submitting…" on the
  review CTA during the simulated booking request.
- **Error:** inline field errors from Zod; a dedicated capacity-mismatch
  warning from Freight Intelligence; `UploadZone` retries a failed upload
  automatically (up to 2 attempts) before surfacing it.

## 16. Freight Intelligence suggestion logic

Implemented in `lib/shipment/intelligence.ts`, all dismissible and
non-blocking:

| Trigger | Suggestion |
|---|---|
| Weight entered, no vehicle chosen | Recommend the smallest vehicle that fits (pallets get a stricter dock-height threshold than loose freight) |
| Weight exceeds the chosen vehicle's capacity | Capacity-mismatch warning with a one-click switch |
| White Glove selected, no movers selected | Recommend Two Movers |
| Furniture + stairs, no elevator, no movers/White Glove | Recommend Two Movers |
| Declared value ≥ $50,000 | Recommend additional cargo insurance |
| Appliance install with no packaging removal | Recommend Packaging Removal |

## 17. Save as Template

`ShipmentTemplate { id, name, createdAt, lastUsedAt, values }`, persisted to
`localStorage` (`lib/shipment/templates.ts`). Offered automatically ~500ms
after a successful submission (`SaveAsTemplateModal`, pre-filled name
`"{pickup city} → {delivery city}"`), and surfaced on the next visit to
`/book` via `TemplateSelector`, which jumps straight to `Review` with the
saved values loaded.
