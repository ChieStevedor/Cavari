// Shared domain types for a shipment request. Kept separate from the Zod
// schemas in lib/validation so pure type-only imports (e.g. in components)
// don't pull in the validation library. `z.infer<>` in lib/validation should
// structurally match these — if they drift, prefer deriving these from the
// schemas instead of hand-maintaining both.

export type ShipmentStatus =
  | "draft"
  | "submitted"
  | "confirmed"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type ShipmentPriority = "standard" | "expedited" | "same_day";

export interface ShipmentAddress {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  contactName: string;
  contactPhone: string;
  notes?: string;
}

export interface ShipmentCargo {
  description: string;
  weightKg: number;
  declaredValueCents: number;
  currency: string;
  requiresRefrigeration?: boolean;
  isHazardous?: boolean;
}

export interface ShipmentVehicleRequirements {
  vehicleType: string;
  liftgateRequired: boolean;
  palletJackRequired: boolean;
}

export interface ShipmentRecord {
  id: string;
  referenceNumber: string;
  companyId: string;
  createdByUserId: string;
  status: ShipmentStatus;
  priority: ShipmentPriority;
  pickup: ShipmentAddress;
  delivery: ShipmentAddress;
  cargo: ShipmentCargo;
  vehicle: ShipmentVehicleRequirements;
  services: string[];
  createdAt: string;
  updatedAt: string;
}
