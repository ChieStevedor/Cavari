# components/wizard

Reserved for the Shipment Request Wizard's UI components (`ShipmentStepper`,
`AddressCard`, `CargoCard`, etc.), as defined by the Wizard Master Prompt.

This directory is intentionally empty as of the infrastructure pass that
created it — building the wizard's UX is a separate task governed by that
prompt, not this one. When implementing:

- Components here should be presentation/interaction only. Field
  visibility rules belong in `src/lib/rules`, validation in
  `src/lib/validation`, and suggestion logic in `src/lib/intelligence`.
- Form state should validate against the schemas in
  `src/lib/validation/shipment.ts` so client and server never drift.
