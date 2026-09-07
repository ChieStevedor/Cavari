// Default launch checklist items (§15). A product cannot be marked LAUNCHED
// without at least seeing this list in its current (possibly incomplete)
// state — the UI should never hide unchecked items.
//
// The actual checklist rows are created by the create_product_for_idea
// Postgres function (migration 20260101000003), not by reading this array
// at runtime — that move was required for atomic idea->product creation
// (P2.10), and SQL can't import a TS module. This array is the documented
// reference the migration's own list must be kept in sync with, and stays
// available for future UI (e.g. a Settings-page checklist template editor).

export const DEFAULT_LAUNCH_CHECKLIST_ITEMS = [
  "MVP works",
  "Mobile responsive",
  "Error handling",
  "Analytics installed",
  "Payment system configured",
  "Landing page",
  "Pricing",
  "Privacy policy",
  "Terms",
  "SEO metadata",
  "OG image",
  "Favicon",
  "Domain",
  "Production deployment",
  "Test payment",
  "Test onboarding",
  "First distribution channel",
  "First marketing experiment",
];
