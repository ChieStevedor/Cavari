// TODO(wizard): Entry point for the Shipment Request Wizard.
//
// This route intentionally has no UI logic yet. The wizard's step flow,
// field visibility rules, and copy are owned by the Wizard Master Prompt —
// do not design UX here. This file exists only to establish the route and
// wire it to the components/lib layers described in DEPLOYMENT.md /
// docs/README.md:
//
//   - components/wizard/*        (ShipmentStepper, AddressCard, CargoCard, ...)
//   - lib/validation/*           (Zod schemas, shared client+server)
//   - lib/rules/*                (Adaptive Workflow field-visibility logic)
//   - lib/intelligence/*         (Freight Intelligence suggestions)
//
// Server Actions / route handlers backing form submission belong in
// src/app/api, validated with the same Zod schemas used here.

export default function WizardPage() {
  return null;
}
