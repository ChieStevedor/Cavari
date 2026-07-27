// Core domain types for the Dispatcher Console.
//
// A `Shipment` here is the operational record a dispatcher works: it is what
// a Shipment Request Wizard submission (`ShipmentFormValues` in
// `@/types/shipment`) becomes once it lands in dispatch — the same
// pickup/delivery/cargo/service vocabulary, plus everything dispatch adds on
// top (status, assignment, timeline, billing). `referenceNumber` keeps the
// wizard's customer-facing `LV-XXXXXX` code; `number` is the short numeric ID
// dispatchers use out loud on the phone or radio ("shipment fourteen
// eighty-two").

export type ShipmentStatus =
  | "waiting_assignment"
  | "assigned"
  | "driver_en_route"
  | "picked_up"
  | "delivered"
  | "delayed"
  | "cancelled";

export const SHIPMENT_STATUSES: ShipmentStatus[] = [
  "waiting_assignment",
  "assigned",
  "driver_en_route",
  "picked_up",
  "delivered",
  "delayed",
  "cancelled",
];

export type ShipmentPriority = "standard" | "same_day" | "asap";

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

export interface Address {
  line1: string;
  city: string;
  region: string;
  postalCode: string;
  lat: number;
  lng: number;
}

export interface Contact {
  companyName: string;
  contactName: string;
  phone: string;
  email?: string;
}

export interface StopInfo {
  contact: Contact;
  address: Address;
  scheduledFor: string; // ISO timestamp
  notes?: string;
  appointmentRequired: boolean;
}

export interface Customer {
  id: string;
  name: string;
  companyName: string;
  tier: "standard" | "priority" | "enterprise";
  shipmentsCompleted: number;
  phone: string;
  email: string;
}

export interface Vehicle {
  type: VehicleType;
  label: string;
  capacityTons: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  photoUrl?: string;
  status: "available" | "en_route" | "on_shift" | "off_shift";
  vehicle: Vehicle;
  currentLocation: { lat: number; lng: number };
  rating: number;
}

export interface Carrier {
  id: string;
  name: string;
  logoInitial: string;
  onTimePercent: number;
  damageRatePercent: number;
  acceptanceRatePercent: number;
  avgResponseMinutes: number;
  whiteGloveCertified: boolean;
  insuranceStatus: "active" | "expiring_soon" | "expired";
  insuranceExpiresAt: string;
  distanceKm: number;
  vehiclesAvailable: Vehicle[];
  drivers: Driver[];
  previousJobsWithCustomer: number;
}

export interface CarrierRecommendation {
  carrier: Carrier;
  rank: number;
  score: number; // 0-100
  reason: string;
  factors: { label: string; value: string }[];
}

export interface CargoDetails {
  cargoType: CargoType;
  quantity: number;
  weightLbs: number;
  dimensions: { length: number; width: number; height: number; unit: "in" | "cm" };
  declaredValueUsd: number;
}

export type TimelineSource = "system" | "dispatcher" | "carrier" | "driver" | "customer";

export interface TimelineEvent {
  id: string;
  timestamp: string; // ISO
  label: string;
  actorName: string;
  actorRole: string;
  notes?: string;
  source: TimelineSource;
}

export type MessageChannel = "customer" | "carrier" | "driver" | "internal";

export interface Message {
  id: string;
  channel: MessageChannel;
  authorName: string;
  authorRole: string;
  body: string;
  timestamp: string;
}

export interface ShipmentDocument {
  id: string;
  name: string;
  kind: "photo" | "pod" | "bol" | "invoice" | "other";
  url: string;
  uploadedAt: string;
}

export type BillingStatus = "not_ready" | "ready_to_invoice" | "invoiced" | "paid";

export interface Shipment {
  id: string;
  number: number;
  referenceNumber: string; // e.g. LV-8F3K2Q, matches wizard's generated code
  status: ShipmentStatus;
  priority: ShipmentPriority;
  createdAt: string;
  customer: Customer;
  pickup: StopInfo;
  delivery: StopInfo;
  cargo: CargoDetails;
  requestedServices: ServiceType[];
  requestedVehicle: VehicleType;
  assignedCarrier?: Carrier;
  assignedDriver?: Driver;
  dispatcherName?: string;
  etaMinutes?: number;
  pickupDelayMinutes?: number;
  deliveryDelayMinutes?: number;
  billingStatus: BillingStatus;
  internalNotes: string[];
  documents: ShipmentDocument[];
  timeline: TimelineEvent[];
  messages: Message[];
  isPinned?: boolean;
}

// ---------------------------------------------------------------------------
// Action Feed
// ---------------------------------------------------------------------------

export type ActionSeverity = "critical" | "warning" | "attention" | "info" | "approval" | "success";

export type ActionType =
  | "waiting_assignment"
  | "driver_delayed"
  | "asap_request"
  | "carrier_accepted"
  | "high_value_approval"
  | "ready_to_invoice"
  | "missing_pod"
  | "customer_escalation"
  | "carrier_declined"
  | "insurance_expiring";

export interface ActionFeedItem {
  id: string;
  type: ActionType;
  severity: ActionSeverity;
  shipmentId: string;
  title: string;
  detail: string;
  occurredAt: string;
  actions: ActionButtonKind[];
  dismissed?: boolean;
}

export type ActionButtonKind =
  | "assign_carrier"
  | "open_shipment"
  | "call_customer"
  | "message_carrier"
  | "generate_invoice"
  | "dismiss";

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export type AlertType =
  | "late_pickup"
  | "late_delivery"
  | "driver_cancelled"
  | "carrier_declined"
  | "missing_pod"
  | "insurance_expiring"
  | "customer_escalation"
  | "high_value_shipment"
  | "sla_breach_risk";

export interface OperationalAlert {
  id: string;
  type: AlertType;
  severity: ActionSeverity;
  shipmentId?: string;
  message: string;
  createdAt: string;
  read: boolean;
}

// ---------------------------------------------------------------------------
// KPIs
// ---------------------------------------------------------------------------

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  rawValue: number;
  delta?: number;
  deltaDirection?: "up" | "down" | "flat";
  goodDirection?: "up" | "down";
  format: "count" | "currency" | "percent" | "minutes";
}
