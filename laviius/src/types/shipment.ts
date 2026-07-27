// Core domain types for the Shipment Request Wizard.

export type CargoType =
  | "pallets"
  | "furniture"
  | "appliances"
  | "crates"
  | "electronics"
  | "construction_materials"
  | "machinery"
  | "other";

export type VehicleType =
  | "cargo_van"
  | "sprinter"
  | "cube_van"
  | "five_ton"
  | "tractor";

export type ServiceType =
  | "liftgate"
  | "white_glove"
  | "inside_delivery"
  | "assembly"
  | "debris_removal"
  | "two_movers"
  | "three_movers"
  | "blanket_wrap"
  | "tailgate";

export type Priority = "standard" | "same_day" | "asap";

export type DimensionUnit = "in" | "cm";

export interface Dimensions {
  length: string;
  width: string;
  height: string;
  unit: DimensionUnit;
}

export interface AddressValue {
  formatted: string;
  line1: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  placeId?: string;
  lat?: number;
  lng?: number;
}

export const emptyAddress: AddressValue = {
  formatted: "",
  line1: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
};

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "done" | "error";
  /** Object URL used for local preview only; never persisted. */
  previewUrl?: string;
}

export interface PickupDetails {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  address: AddressValue;
  date: string;
  time: string;
  loadingDockAvailable: boolean;
  appointmentRequired: boolean;
  notes: string;
}

export interface DeliveryDetails {
  companyName: string;
  contactName: string;
  phone: string;
  address: AddressValue;
  date: string;
  time: string;
  appointmentRequired: boolean;
  notes: string;
}

export interface PalletDetails {
  palletCount: string;
  palletDimensions: string;
  stackable: boolean;
  forkliftAvailable: boolean;
}

export interface FurnitureDetails {
  roomOfChoice: string;
  stairs: boolean;
  elevator: boolean;
}

export interface ApplianceDetails {
  disconnectOld: boolean;
  installNew: boolean;
  packagingRemoval: boolean;
}

export interface CargoDetails {
  cargoType: CargoType | null;
  quantity: string;
  weight: string;
  dimensions: Dimensions;
  declaredValue: string;
  photos: UploadedFile[];
  documents: UploadedFile[];
  pallet: PalletDetails;
  furniture: FurnitureDetails;
  appliance: ApplianceDetails;
}

export interface ServiceDetails {
  vehicle: VehicleType | null;
  services: ServiceType[];
  priority: Priority;
}

export interface ShipmentFormValues {
  pickup: PickupDetails;
  delivery: DeliveryDetails;
  cargo: CargoDetails;
  service: ServiceDetails;
  /** Suggestions the customer has explicitly dismissed, by suggestion id. */
  dismissedSuggestions: string[];
}

export type WizardStepId =
  | "pickup"
  | "delivery"
  | "shipment"
  | "service"
  | "review";

export interface WizardStep {
  id: WizardStepId;
  label: string;
  shortLabel: string;
}

// ---------------------------------------------------------------------------
// Adaptive Workflow rule schema
//
// A rule is a pure predicate over the current form values. When it matches,
// its `reveals` field keys become visible and its `conceals` field keys are
// forcibly hidden (and excluded from validation), regardless of what any
// other rule says. AdaptiveFieldGroup evaluates the full rule set on every
// render and animates the diff between the previous and next visible set.
// ---------------------------------------------------------------------------

/** Every field key that can be conditionally shown/hidden anywhere in the wizard. */
export type AdaptiveFieldKey =
  | "cargo.pallet.palletCount"
  | "cargo.pallet.palletDimensions"
  | "cargo.pallet.stackable"
  | "cargo.pallet.forkliftAvailable"
  | "cargo.furniture.roomOfChoice"
  | "cargo.furniture.stairs"
  | "cargo.furniture.elevator"
  | "cargo.appliance.disconnectOld"
  | "cargo.appliance.installNew"
  | "cargo.appliance.packagingRemoval"
  | "service.whiteGlove"
  | "service.blanketWrap"
  | "service.assembly"
  | "service.twoMovers"
  | "service.threeMovers"
  | "service.fiveTonOnly"
  | "service.tractorOnly"
  | "pickup.scheduling"
  | "delivery.scheduling";

export interface AdaptiveRule {
  id: string;
  description: string;
  when: (values: ShipmentFormValues) => boolean;
  reveals: AdaptiveFieldKey[];
  conceals: AdaptiveFieldKey[];
}

export interface VisibilityState {
  visible: Set<AdaptiveFieldKey>;
  hidden: Set<AdaptiveFieldKey>;
}

// ---------------------------------------------------------------------------
// Freight Intelligence
// ---------------------------------------------------------------------------

export type SuggestionTone = "info" | "success" | "warning";

export interface FreightSuggestion {
  id: string;
  tone: SuggestionTone;
  title: string;
  body: string;
  /** Optional one-click action, e.g. "Switch to 5-Ton". */
  action?: {
    label: string;
    apply: (values: ShipmentFormValues) => Partial<ShipmentFormValues>;
  };
}

// ---------------------------------------------------------------------------
// Save as Template
// ---------------------------------------------------------------------------

export interface ShipmentTemplate {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  values: ShipmentFormValues;
}
