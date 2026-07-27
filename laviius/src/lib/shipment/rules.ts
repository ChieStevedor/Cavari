import type {
  AdaptiveFieldKey,
  AdaptiveRule,
  ShipmentFormValues,
  VisibilityState,
} from "@/types/shipment";
import { SERVICE_OPTIONS, VEHICLE_CLASS_ORDER } from "./constants";

const PALLET_KEYS: AdaptiveFieldKey[] = [
  "cargo.pallet.palletCount",
  "cargo.pallet.palletDimensions",
  "cargo.pallet.stackable",
  "cargo.pallet.forkliftAvailable",
];

const FURNITURE_KEYS: AdaptiveFieldKey[] = [
  "cargo.furniture.roomOfChoice",
  "cargo.furniture.stairs",
  "cargo.furniture.elevator",
];

const FURNITURE_SERVICE_KEYS: AdaptiveFieldKey[] = [
  "service.whiteGlove",
  "service.blanketWrap",
  "service.assembly",
  "service.twoMovers",
  "service.threeMovers",
];

const APPLIANCE_KEYS: AdaptiveFieldKey[] = [
  "cargo.appliance.disconnectOld",
  "cargo.appliance.installNew",
  "cargo.appliance.packagingRemoval",
];

/**
 * Adaptive Workflow rule set. Every rule is a pure predicate over the form
 * values; AdaptiveFieldGroup (and the service/scheduling components) call
 * `resolveVisibility` on every render and diff the result to decide what to
 * mount, unmount, or grey out. `conceals` always wins over another rule's
 * `reveals` for the same key, since capability (does this truck have a
 * tailgate?) outranks preference (the customer picked Furniture).
 */
export const ADAPTIVE_RULES: AdaptiveRule[] = [
  {
    id: "cargo-pallets",
    description: "Pallets reveal pallet-handling fields and hide furniture/appliance fields.",
    when: (v) => v.cargo.cargoType === "pallets",
    reveals: PALLET_KEYS,
    conceals: [...FURNITURE_KEYS, ...APPLIANCE_KEYS],
  },
  {
    id: "cargo-furniture",
    description: "Furniture reveals moving-specific fields and recommends moving services.",
    when: (v) => v.cargo.cargoType === "furniture",
    reveals: [...FURNITURE_KEYS, ...FURNITURE_SERVICE_KEYS],
    conceals: [...PALLET_KEYS, ...APPLIANCE_KEYS],
  },
  {
    id: "cargo-appliances",
    description: "Appliances reveal install/disconnect fields and hide pallet/furniture fields.",
    when: (v) => v.cargo.cargoType === "appliances",
    reveals: APPLIANCE_KEYS,
    conceals: [...PALLET_KEYS, ...FURNITURE_KEYS],
  },
  {
    id: "vehicle-cargo-van",
    description: "A Cargo Van can't offer services that require a 5-ton+ chassis.",
    when: (v) => v.service.vehicle === "cargo_van",
    reveals: [],
    conceals: SERVICE_OPTIONS.filter((s) => s.minVehicle).map(
      (s) => `service.${s.value}` as AdaptiveFieldKey,
    ),
  },
  {
    id: "priority-asap",
    description: "ASAP requests the earliest possible pickup instead of a scheduled window.",
    when: (v) => v.service.priority === "asap",
    reveals: [],
    conceals: ["pickup.scheduling", "delivery.scheduling"],
  },
];

/**
 * Fields that are shown by default and only ever get concealed (never need
 * an explicit reveal). Everything else defaults to hidden until a rule
 * reveals it — e.g. pallet-specific fields don't exist until Cargo Type is
 * Pallets.
 */
const DEFAULT_VISIBLE_FIELDS = new Set<AdaptiveFieldKey>(["pickup.scheduling", "delivery.scheduling"]);

export function resolveVisibility(values: ShipmentFormValues): VisibilityState {
  const visible = new Set<AdaptiveFieldKey>();
  const hidden = new Set<AdaptiveFieldKey>();

  for (const rule of ADAPTIVE_RULES) {
    if (!rule.when(values)) continue;
    for (const key of rule.reveals) visible.add(key);
    for (const key of rule.conceals) hidden.add(key);
  }

  // Concealment always overrides revelation for the same key.
  for (const key of hidden) visible.delete(key);

  return { visible, hidden };
}

export function isFieldVisible(values: ShipmentFormValues, key: AdaptiveFieldKey): boolean {
  const { visible, hidden } = resolveVisibility(values);
  if (hidden.has(key)) return false;
  if (visible.has(key)) return true;
  return DEFAULT_VISIBLE_FIELDS.has(key);
}

/** Whether a given vehicle class satisfies a service's minimum vehicle requirement. */
export function vehicleMeetsServiceRequirement(
  vehicle: import("@/types/shipment").VehicleType | null,
  minVehicle: import("@/types/shipment").VehicleType | undefined,
): boolean {
  if (!minVehicle) return true;
  if (!vehicle) return true;
  return VEHICLE_CLASS_ORDER.indexOf(vehicle) >= VEHICLE_CLASS_ORDER.indexOf(minVehicle);
}
