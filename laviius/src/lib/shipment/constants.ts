import type {
  AddressValue,
  CargoType,
  Priority,
  ServiceType,
  ShipmentFormValues,
  VehicleType,
  WizardStep,
} from "@/types/shipment";

export const WIZARD_STEPS: WizardStep[] = [
  { id: "pickup", label: "Pickup", shortLabel: "Pickup" },
  { id: "delivery", label: "Delivery", shortLabel: "Delivery" },
  { id: "shipment", label: "Shipment Details", shortLabel: "Cargo" },
  { id: "service", label: "Required Service", shortLabel: "Service" },
  { id: "review", label: "Review", shortLabel: "Review" },
];

export const CARGO_TYPE_OPTIONS: { value: CargoType; label: string }[] = [
  { value: "pallets", label: "Pallets" },
  { value: "furniture", label: "Furniture" },
  { value: "appliances", label: "Appliances" },
  { value: "crates", label: "Crates" },
  { value: "electronics", label: "Electronics" },
  { value: "construction_materials", label: "Construction Materials" },
  { value: "machinery", label: "Machinery" },
  { value: "other", label: "Other" },
];

export const VEHICLE_OPTIONS: {
  value: VehicleType;
  label: string;
  capacityLbs: number;
  helper: string;
}[] = [
  { value: "cargo_van", label: "Cargo Van", capacityLbs: 1500, helper: "Up to 1,500 lbs" },
  { value: "sprinter", label: "Sprinter", capacityLbs: 3000, helper: "Up to 3,000 lbs" },
  { value: "cube_van", label: "Cube Van", capacityLbs: 5000, helper: "Up to 5,000 lbs" },
  { value: "five_ton", label: "5-Ton", capacityLbs: 10000, helper: "Up to 10,000 lbs" },
  { value: "tractor", label: "Tractor", capacityLbs: 44000, helper: "Up to 44,000 lbs" },
];

export const VEHICLE_CLASS_ORDER: VehicleType[] = [
  "cargo_van",
  "sprinter",
  "cube_van",
  "five_ton",
  "tractor",
];

export interface ServiceDefinition {
  value: ServiceType;
  label: string;
  /** Minimum vehicle class required for this service to be offered. */
  minVehicle?: VehicleType;
}

export const SERVICE_OPTIONS: ServiceDefinition[] = [
  { value: "liftgate", label: "Liftgate" },
  { value: "white_glove", label: "White Glove" },
  { value: "inside_delivery", label: "Inside Delivery" },
  { value: "assembly", label: "Assembly" },
  { value: "debris_removal", label: "Debris Removal" },
  { value: "two_movers", label: "Two Movers" },
  { value: "three_movers", label: "Three Movers" },
  { value: "blanket_wrap", label: "Blanket Wrap" },
  { value: "tailgate", label: "Tailgate", minVehicle: "five_ton" },
];

export const PRIORITY_OPTIONS: {
  value: Priority;
  label: string;
  helper: string;
}[] = [
  { value: "standard", label: "Standard", helper: "Next available window" },
  { value: "same_day", label: "Same Day", helper: "Delivered within today" },
  { value: "asap", label: "ASAP", helper: "Earliest possible pickup" },
];

export const SERVICE_ADDON_USD: Record<ServiceType, number> = {
  liftgate: 25,
  white_glove: 90,
  inside_delivery: 40,
  assembly: 60,
  debris_removal: 45,
  two_movers: 70,
  three_movers: 130,
  blanket_wrap: 20,
  tailgate: 35,
};

export const VEHICLE_BASE_RATE_USD: Record<VehicleType, number> = {
  cargo_van: 120,
  sprinter: 160,
  cube_van: 220,
  five_ton: 320,
  tractor: 650,
};

export const PRIORITY_MULTIPLIER: Record<Priority, number> = {
  standard: 1,
  same_day: 1.25,
  asap: 1.5,
};

export const DECLARED_VALUE_INSURANCE_THRESHOLD_USD = 50_000;

export function emptyAddress(): AddressValue {
  return {
    formatted: "",
    line1: "",
    city: "",
    region: "",
    postalCode: "",
    country: "",
  };
}

export function emptyShipmentFormValues(): ShipmentFormValues {
  return {
    pickup: {
      companyName: "",
      contactName: "",
      phone: "",
      email: "",
      address: emptyAddress(),
      date: "",
      time: "",
      loadingDockAvailable: false,
      appointmentRequired: false,
      notes: "",
    },
    delivery: {
      companyName: "",
      contactName: "",
      phone: "",
      address: emptyAddress(),
      date: "",
      time: "",
      appointmentRequired: false,
      notes: "",
    },
    cargo: {
      cargoType: null,
      quantity: "",
      weight: "",
      dimensions: { length: "", width: "", height: "", unit: "in" },
      declaredValue: "",
      photos: [],
      documents: [],
      pallet: { palletCount: "", palletDimensions: "", stackable: false, forkliftAvailable: false },
      furniture: { roomOfChoice: "", stairs: false, elevator: false },
      appliance: { disconnectOld: false, installNew: false, packagingRemoval: false },
    },
    service: {
      vehicle: null,
      services: [],
      priority: "standard",
    },
    dismissedSuggestions: [],
  };
}
