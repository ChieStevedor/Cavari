/** Core freight domain model. Mirrors the shipment record produced by the
 * Shipment Request Wizard → Dispatcher Console → Carrier Portal pipeline
 * that hands off to this driver app. */

export type ShipmentServiceType =
  | "cartage"
  | "white_glove"
  | "first_mile"
  | "last_mile"
  | "ltl"
  | "commercial";

/** Ordered lifecycle. UI never lets a driver skip forward out of order —
 * see src/domain/workflow.ts for the transition rules. */
export type ShipmentStage =
  | "assigned" // accept assignment
  | "en_route_pickup" // navigate to pickup
  | "arrived_pickup"
  | "loading_checklist"
  | "cargo_verification"
  | "pickup_photos"
  | "confirm_loaded"
  | "en_route_delivery" // start route
  | "arrived_delivery"
  | "unload_checklist"
  | "white_glove_tasks" // skipped entirely for non-white-glove shipments
  | "customer_signature"
  | "delivery_photos"
  | "pod_generated"
  | "completed";

export type ShipmentStatus =
  | "upcoming" // assigned, not yet started (future appointment window)
  | "active" // driver is currently working this stage
  | "exception" // blocked on a reported issue
  | "completed"
  | "cancelled";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Address {
  label: string; // "Consignee Warehouse", "3rd & Main Loading Dock"
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  contactName?: string;
  contactPhone?: string;
  accessNotes?: string; // gate codes, dock numbers, buzzer instructions
  coordinates: GeoPoint;
}

export interface AppointmentWindow {
  start: string; // ISO 8601
  end: string; // ISO 8601
  isHardAppointment: boolean; // strict dock/customer appointment vs. flexible window
}

export interface CargoDimensions {
  lengthIn: number;
  widthIn: number;
  heightIn: number;
}

export interface CargoItem {
  id: string;
  description: string;
  quantity: number;
  weightLbs: number;
  dimensions?: CargoDimensions;
  isFragile?: boolean;
  requiresTwoPerson?: boolean;
}

export interface VehicleAssignment {
  id: string;
  label: string; // "Box Truck 14" / "Sprinter Van 3"
  type: string;
  licensePlate: string;
  liftgate: boolean;
}

export type WhiteGloveTaskType =
  | "room_of_choice"
  | "assembly_required"
  | "blanket_wrap"
  | "packaging_removal"
  | "debris_removal"
  | "stairs"
  | "elevator"
  | "two_movers"
  | "three_movers";

export interface WhiteGloveTask {
  type: WhiteGloveTaskType;
  label: string;
  detail?: string; // e.g. "3rd floor, no elevator" for stairs
  required: boolean;
  completed: boolean;
}

export type PhotoCategory =
  | "pickup"
  | "delivery"
  | "damage"
  | "exception"
  | "vehicle";

export interface CapturedPhoto {
  id: string;
  category: PhotoCategory;
  localUri: string;
  remoteUrl?: string; // populated after background upload completes
  takenAt: string; // ISO 8601
  uploadStatus: "pending" | "uploading" | "uploaded" | "failed";
  gps?: GeoPoint;
}

export type ChecklistItemId =
  | "cargo_matches_order"
  | "packaging_acceptable"
  | "visible_damage"
  | "correct_quantity"
  | "securely_loaded"
  | "correct_location"
  | "cargo_delivered"
  | "white_glove_completed"
  | "assembly_completed"
  | "packaging_removed"
  | "customer_satisfied";

export interface ChecklistAnswer {
  id: ChecklistItemId;
  label: string;
  /** null = unanswered. For "visible_damage" true means damage WAS found
   * (an inverted/warning item — answering true raises an exception). */
  value: boolean | null;
  isWarningItem?: boolean;
  note?: string;
}

export type IssueType =
  | "damage"
  | "customer_unavailable"
  | "access_issue"
  | "delay"
  | "wrong_freight"
  | "unsafe_conditions"
  | "vehicle_issue";

export interface ShipmentException {
  id: string;
  type: IssueType;
  label: string;
  notes?: string;
  voiceNoteUri?: string;
  photoIds: string[];
  reportedAt: string;
  reportedStage: ShipmentStage;
  dispatcherNotifiedAt?: string;
  resolved: boolean;
}

export interface SignatureRecord {
  signerName: string;
  svgOrPngUri: string;
  signedAt: string;
  gps?: GeoPoint;
}

export interface ProofOfDelivery {
  id: string;
  shipmentId: string;
  generatedAt: string;
  driverId: string;
  driverName: string;
  gps?: GeoPoint;
  photoIds: string[];
  signature?: SignatureRecord;
  notes?: string;
  exceptionIds: string[];
  deliveredToName?: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string; // customer-facing, e.g. "LVX-48213"
  customerName: string;
  serviceType: ShipmentServiceType;
  isWhiteGlove: boolean;

  pickup: Address;
  delivery: Address;
  pickupWindow: AppointmentWindow;
  deliveryWindow: AppointmentWindow;

  cargo: CargoItem[];
  totalWeightLbs: number;

  vehicle: VehicleAssignment;

  dispatcherNotes?: string;
  carrierNotes?: string;
  specialInstructions?: string;

  whiteGloveTasks: WhiteGloveTask[];

  stage: ShipmentStage;
  status: ShipmentStatus;

  photos: CapturedPhoto[];
  pickupChecklist: ChecklistAnswer[];
  deliveryChecklist: ChecklistAnswer[];
  exceptions: ShipmentException[];
  pod?: ProofOfDelivery;

  requiresSignature: boolean;

  createdAt: string;
  updatedAt: string;
}
