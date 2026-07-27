import type {
  ActionFeedItem,
  ActionButtonKind,
  ActionType,
  Address,
  BillingStatus,
  CargoType,
  Carrier,
  CargoDetails,
  Contact,
  Customer,
  Driver,
  KpiMetric,
  Message,
  OperationalAlert,
  ServiceType,
  Shipment,
  ShipmentDocument,
  ShipmentPriority,
  ShipmentStatus,
  StopInfo,
  TimelineEvent,
  Vehicle,
  VehicleType,
} from "@/types/dispatcher";

// Deterministic-enough mock data generation. Runs client-side only (called
// from a post-mount effect in the dispatcher store), so plain Math.random is
// fine — there is no server-rendered HTML to disagree with.

let idCounter = 1;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted<T>(entries: [T, number][]): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60_000).toISOString();
}

function minutesFromNow(min: number): string {
  return new Date(Date.now() + min * 60_000).toISOString();
}

function referenceNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `LV-${suffix}`;
}

// ---------------------------------------------------------------------------
// Metro Vancouver geography — keeps the Live Map / distance figures coherent.
// ---------------------------------------------------------------------------

const METRO_AREAS: { city: string; region: string; lat: number; lng: number }[] = [
  { city: "Vancouver", region: "BC", lat: 49.2827, lng: -123.1207 },
  { city: "Burnaby", region: "BC", lat: 49.2488, lng: -122.9805 },
  { city: "Richmond", region: "BC", lat: 49.1666, lng: -123.1336 },
  { city: "Surrey", region: "BC", lat: 49.1913, lng: -122.849 },
  { city: "Coquitlam", region: "BC", lat: 49.2838, lng: -122.7932 },
  { city: "North Vancouver", region: "BC", lat: 49.3163, lng: -123.0693 },
  { city: "Delta", region: "BC", lat: 49.0847, lng: -123.0587 },
  { city: "Langley", region: "BC", lat: 49.1044, lng: -122.6604 },
];

function randomAddress(): Address {
  const area = pick(METRO_AREAS);
  const jitter = () => (Math.random() - 0.5) * 0.06;
  return {
    line1: `${randInt(100, 9800)} ${pick(["Marine Way", "Kingsway", "Grandview Hwy", "Boundary Rd", "Fraser St", "Still Creek Dr", "Bridgeport Rd", "72 Ave"])}`,
    city: area.city,
    region: area.region,
    postalCode: `V${randInt(1, 9)}${String.fromCharCode(65 + randInt(0, 25))} ${randInt(1, 9)}${String.fromCharCode(65 + randInt(0, 25))}${randInt(1, 9)}`,
    lat: area.lat + jitter(),
    lng: area.lng + jitter(),
  };
}

const COMPANY_NAMES = [
  "Northshore Distribution",
  "Pacific Crate Co.",
  "Fraser Valley Appliances",
  "Harbourfront Furnishings",
  "Cascade Millwork",
  "Delta Logistics Group",
  "Evergreen Industrial Supply",
  "Burrard Wholesale",
  "Metro Fixtures & Fittings",
  "Lionsgate Electronics",
  "Coastal Build Supply",
  "Skyline Office Interiors",
];

const FIRST_NAMES = ["Jordan", "Priya", "Marcus", "Elena", "Sam", "Devon", "Ava", "Liam", "Noor", "Casey", "Ravi", "Tasha"];
const LAST_NAMES = ["Chen", "Alvarez", "Nguyen", "Patel", "Osei", "Kowalski", "Reyes", "Singh", "MacLeod", "Dubois"];

function randomName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

function randomPhone(): string {
  return `(604) ${randInt(200, 999)}-${String(randInt(0, 9999)).padStart(4, "0")}`;
}

function randomContact(): Contact {
  return {
    companyName: pick(COMPANY_NAMES),
    contactName: randomName(),
    phone: randomPhone(),
    email: undefined,
  };
}

const VEHICLES: Record<VehicleType, { label: string; capacityTons: number }> = {
  cargo_van: { label: "Cargo Van", capacityTons: 1 },
  sprinter: { label: "Sprinter Van", capacityTons: 1.5 },
  cube_van: { label: "Cube Van", capacityTons: 3 },
  five_ton: { label: "5-Ton Truck", capacityTons: 5 },
  tractor: { label: "Tractor & Trailer", capacityTons: 20 },
};

function randomVehicle(type?: VehicleType): Vehicle {
  const t = type ?? pick(Object.keys(VEHICLES) as VehicleType[]);
  return { type: t, ...VEHICLES[t] };
}

const CARRIER_NAMES = [
  "ABC Cartage",
  "Summit Freight Partners",
  "Westline Carriers",
  "Bluewater Transport",
  "Ironclad Logistics",
  "Redline Cartage Co.",
  "Harborline Freight",
  "Nordic Transfer & Storage",
];

function randomDriverFor(vehicle: Vehicle): Driver {
  return {
    id: nextId("drv"),
    name: randomName(),
    phone: randomPhone(),
    status: pickWeighted([
      ["available", 5],
      ["en_route", 3],
      ["on_shift", 2],
      ["off_shift", 1],
    ]),
    vehicle,
    currentLocation: (() => {
      const a = pick(METRO_AREAS);
      return { lat: a.lat + (Math.random() - 0.5) * 0.08, lng: a.lng + (Math.random() - 0.5) * 0.08 };
    })(),
    rating: Number((4 + Math.random()).toFixed(1)),
  };
}

function generateCarriers(count: number): Carrier[] {
  return Array.from({ length: count }, (_, i) => {
    const name = CARRIER_NAMES[i % CARRIER_NAMES.length];
    const vehicles = Array.from({ length: randInt(2, 4) }, () => randomVehicle());
    const drivers = vehicles.map(randomDriverFor);
    const expiresInDays = randInt(-5, 200);
    return {
      id: nextId("car"),
      name,
      logoInitial: name.charAt(0),
      onTimePercent: randInt(88, 99),
      damageRatePercent: Number((Math.random() * 2.2).toFixed(1)),
      acceptanceRatePercent: randInt(70, 98),
      avgResponseMinutes: randInt(2, 18),
      whiteGloveCertified: Math.random() > 0.4,
      insuranceStatus: expiresInDays < 0 ? "expired" : expiresInDays < 14 ? "expiring_soon" : "active",
      insuranceExpiresAt: minutesFromNow(expiresInDays * 24 * 60),
      distanceKm: Number((Math.random() * 28 + 1).toFixed(1)),
      vehiclesAvailable: vehicles,
      drivers,
      previousJobsWithCustomer: randInt(0, 24),
    };
  });
}

function generateCustomers(count: number): Customer[] {
  return Array.from({ length: count }, () => {
    const companyName = pick(COMPANY_NAMES);
    return {
      id: nextId("cus"),
      name: randomName(),
      companyName,
      tier: pickWeighted<Customer["tier"]>([
        ["standard", 6],
        ["priority", 3],
        ["enterprise", 1],
      ]),
      shipmentsCompleted: randInt(1, 340),
      phone: randomPhone(),
      email: `dispatch@${companyName.toLowerCase().replace(/[^a-z]+/g, "")}.com`,
    };
  });
}

const CARGO_TYPES: CargoType[] = [
  "pallets",
  "furniture",
  "appliances",
  "crates",
  "electronics",
  "construction_materials",
  "machinery",
  "other",
];

const SERVICE_TYPES: ServiceType[] = [
  "liftgate",
  "white_glove",
  "inside_delivery",
  "assembly",
  "debris_removal",
  "two_movers",
  "three_movers",
  "blanket_wrap",
  "tailgate",
];

function randomCargo(): CargoDetails {
  const cargoType = pick(CARGO_TYPES);
  return {
    cargoType,
    quantity: randInt(1, 24),
    weightLbs: randInt(80, 9000),
    dimensions: { length: randInt(20, 120), width: randInt(20, 96), height: randInt(20, 90), unit: "in" },
    declaredValueUsd: pickWeighted([
      [randInt(200, 3000), 6],
      [randInt(3000, 15000), 3],
      [randInt(15000, 60000), 1],
    ]),
  };
}

function randomStop(offsetMinutes: number): StopInfo {
  return {
    contact: randomContact(),
    address: randomAddress(),
    scheduledFor: minutesFromNow(offsetMinutes),
    appointmentRequired: Math.random() > 0.6,
    notes: Math.random() > 0.7 ? pick(["Loading dock in rear", "Call on arrival", "Gate code 4471", "Ask for receiving manager"]) : undefined,
  };
}

function buildTimeline(status: ShipmentStatus, createdAt: string): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { id: nextId("tl"), timestamp: createdAt, label: "Shipment Submitted", actorName: "Customer Portal", actorRole: "System", source: "customer" },
  ];
  const dispatcher = randomName();
  const push = (offsetMin: number, label: string, actorName: string, actorRole: string, source: TimelineEvent["source"], notes?: string) => {
    events.push({ id: nextId("tl"), timestamp: minutesAgo(offsetMin), label, actorName, actorRole, source, notes });
  };

  const order: ShipmentStatus[] = ["waiting_assignment", "assigned", "driver_en_route", "picked_up", "delivered"];
  const reached = order.indexOf(status === "delayed" || status === "cancelled" ? "assigned" : status);

  if (reached >= 0) push(38, "Dispatcher Viewed", dispatcher, "Dispatcher", "dispatcher");
  if (status !== "waiting_assignment" && status !== "cancelled") {
    push(32, "Carrier Offer Sent", dispatcher, "Dispatcher", "dispatcher");
    push(28, "Carrier Accepted", pick(CARRIER_NAMES), "Carrier", "carrier");
    push(24, "Driver Assigned", randomName(), "Driver", "carrier");
  }
  if (["picked_up", "delivered"].includes(status)) {
    push(14, "Driver Arrived", randomName(), "Driver", "driver");
    push(11, "Loaded", randomName(), "Driver", "driver");
  }
  if (status === "delivered") {
    push(3, "Delivered", randomName(), "Driver", "driver");
    push(1, "POD Uploaded", randomName(), "Driver", "driver");
  }
  if (status === "cancelled") {
    push(10, "Shipment Cancelled", dispatcher, "Dispatcher", "dispatcher", "Cancelled at customer request");
  }
  if (status === "delayed") {
    push(6, "Delay Reported", randomName(), "Driver", "driver", "Heavy traffic on Marine Way");
  }
  return events;
}

function buildDocuments(status: ShipmentStatus): ShipmentDocument[] {
  const docs: ShipmentDocument[] = [];
  if (["picked_up", "delivered"].includes(status)) {
    docs.push({ id: nextId("doc"), name: "Bill of Lading.pdf", kind: "bol", url: "#", uploadedAt: minutesAgo(randInt(10, 20)) });
    if (Math.random() > 0.4) {
      docs.push({ id: nextId("doc"), name: "Cargo Photo 1.jpg", kind: "photo", url: "#", uploadedAt: minutesAgo(randInt(10, 20)) });
    }
  }
  if (status === "delivered") {
    docs.push({ id: nextId("doc"), name: "Proof of Delivery.pdf", kind: "pod", url: "#", uploadedAt: minutesAgo(randInt(1, 8)) });
  }
  return docs;
}

function buildMessages(shipmentNumber: number): Message[] {
  if (Math.random() > 0.6) return [];
  return [
    {
      id: nextId("msg"),
      channel: "customer",
      authorName: randomName(),
      authorRole: "Customer",
      body: `Any update on shipment #${shipmentNumber}? Need it before end of day.`,
      timestamp: minutesAgo(randInt(5, 90)),
    },
  ];
}

const STATUS_WEIGHTS: [ShipmentStatus, number][] = [
  ["waiting_assignment", 5],
  ["assigned", 4],
  ["driver_en_route", 4],
  ["picked_up", 3],
  ["delivered", 8],
  ["delayed", 2],
  ["cancelled", 1],
];

const PRIORITY_WEIGHTS: [ShipmentPriority, number][] = [
  ["standard", 6],
  ["same_day", 3],
  ["asap", 1],
];

function generateShipments(count: number, carriers: Carrier[], customers: Customer[]): Shipment[] {
  return Array.from({ length: count }, (_, i) => {
    const status = pickWeighted(STATUS_WEIGHTS);
    const priority = pickWeighted(PRIORITY_WEIGHTS);
    // A shipment still waiting on a carrier should look like it just came
    // in — not like it's been sitting untouched for hours, which is what
    // an operational failure looks like, not a normal queue state.
    const createdAt = minutesAgo(status === "waiting_assignment" ? randInt(2, 45) : randInt(15, 60 * 26));
    const assignedCarrier = ["assigned", "driver_en_route", "picked_up", "delivered", "delayed"].includes(status)
      ? pick(carriers)
      : undefined;
    const assignedDriver = assignedCarrier ? pick(assignedCarrier.drivers) : undefined;
    const billingStatus: BillingStatus =
      status === "delivered" ? pickWeighted([["ready_to_invoice", 3], ["invoiced", 2], ["paid", 2]]) : "not_ready";
    const number = 1400 + i;

    return {
      id: nextId("shp"),
      number,
      referenceNumber: referenceNumber(),
      status,
      priority,
      createdAt,
      customer: pick(customers),
      pickup: randomStop(-randInt(5, 180)),
      delivery: randomStop(randInt(30, 300)),
      cargo: randomCargo(),
      requestedServices: Array.from({ length: randInt(0, 3) }, () => pick(SERVICE_TYPES)).filter(
        (v, idx, arr) => arr.indexOf(v) === idx,
      ),
      requestedVehicle: pick(Object.keys(VEHICLES) as VehicleType[]),
      assignedCarrier,
      assignedDriver,
      dispatcherName: assignedCarrier ? randomName() : undefined,
      etaMinutes: ["driver_en_route", "picked_up"].includes(status) ? randInt(4, 90) : undefined,
      // Only shipments with a driver already moving can report a delay —
      // otherwise "waiting assignment" shipments show a nonsensical
      // "driver delayed" card with no driver to speak of.
      pickupDelayMinutes:
        status === "delayed"
          ? randInt(10, 60)
          : ["assigned", "driver_en_route", "picked_up"].includes(status) && Math.random() > 0.92
            ? randInt(3, 20)
            : undefined,
      deliveryDelayMinutes: status === "delayed" ? randInt(10, 90) : undefined,
      billingStatus,
      internalNotes: Math.random() > 0.75 ? ["Customer requested text updates only."] : [],
      documents: buildDocuments(status),
      timeline: buildTimeline(status, createdAt),
      messages: buildMessages(number),
      isPinned: false,
    };
  });
}

function actionsForType(type: ActionType): ActionButtonKind[] {
  switch (type) {
    case "waiting_assignment":
      return ["assign_carrier", "open_shipment", "dismiss"];
    case "driver_delayed":
      return ["message_carrier", "call_customer", "open_shipment"];
    case "asap_request":
      return ["assign_carrier", "call_customer", "open_shipment"];
    case "carrier_accepted":
      return ["open_shipment", "dismiss"];
    case "high_value_approval":
      return ["open_shipment", "dismiss"];
    case "ready_to_invoice":
      return ["generate_invoice", "open_shipment"];
    case "missing_pod":
      return ["message_carrier", "open_shipment"];
    case "customer_escalation":
      return ["call_customer", "open_shipment"];
    case "carrier_declined":
      return ["assign_carrier", "open_shipment"];
    case "insurance_expiring":
      return ["open_shipment", "dismiss"];
    default:
      return ["open_shipment", "dismiss"];
  }
}

function buildActionFeed(shipments: Shipment[]): ActionFeedItem[] {
  const items: ActionFeedItem[] = [];

  for (const s of shipments) {
    if (s.status === "waiting_assignment") {
      const waitedMin = Math.round((Date.now() - new Date(s.createdAt).getTime()) / 60000);
      items.push({
        id: nextId("act"),
        type: "waiting_assignment",
        severity: waitedMin > 20 ? "critical" : "warning",
        shipmentId: s.id,
        title: `Shipment #${s.number} waiting for carrier assignment`,
        detail: `${waitedMin} min since submission — no carrier offered yet.`,
        occurredAt: s.createdAt,
        actions: actionsForType("waiting_assignment"),
      });
    }
    if (s.pickupDelayMinutes || s.deliveryDelayMinutes) {
      const delay = s.deliveryDelayMinutes ?? s.pickupDelayMinutes ?? 0;
      items.push({
        id: nextId("act"),
        type: "driver_delayed",
        severity: delay > 30 ? "critical" : "warning",
        shipmentId: s.id,
        title: `Shipment #${s.number} driver delayed by ${delay} minutes`,
        detail: s.assignedDriver ? `${s.assignedDriver.name} reported heavier than expected traffic.` : "Delay reported en route.",
        occurredAt: minutesAgo(randInt(1, 20)),
        actions: actionsForType("driver_delayed"),
      });
    }
    if (s.priority === "asap" && s.status === "waiting_assignment") {
      items.push({
        id: nextId("act"),
        type: "asap_request",
        severity: "attention",
        shipmentId: s.id,
        title: `Shipment #${s.number} customer requested ASAP pickup`,
        detail: `${s.customer.companyName} needs pickup as soon as possible.`,
        occurredAt: s.createdAt,
        actions: actionsForType("asap_request"),
      });
    }
    if (s.status === "assigned" && Math.random() > 0.6) {
      items.push({
        id: nextId("act"),
        type: "carrier_accepted",
        severity: "info",
        shipmentId: s.id,
        title: `${s.assignedCarrier?.name ?? "Carrier"} accepted Shipment #${s.number}`,
        detail: "Awaiting driver dispatch.",
        occurredAt: minutesAgo(randInt(1, 15)),
        actions: actionsForType("carrier_accepted"),
      });
    }
    if (s.cargo.declaredValueUsd > 15000) {
      items.push({
        id: nextId("act"),
        type: "high_value_approval",
        severity: "approval",
        shipmentId: s.id,
        title: `High-value shipment ($${s.cargo.declaredValueUsd.toLocaleString()}) requires manual approval`,
        detail: `${s.customer.companyName} — declared value exceeds auto-approval threshold.`,
        occurredAt: s.createdAt,
        actions: actionsForType("high_value_approval"),
      });
    }
    if (s.billingStatus === "ready_to_invoice") {
      items.push({
        id: nextId("act"),
        type: "ready_to_invoice",
        severity: "success",
        shipmentId: s.id,
        title: `Shipment #${s.number} delivered - ready for invoicing`,
        detail: `${s.customer.companyName} — POD received.`,
        occurredAt: minutesAgo(randInt(2, 40)),
        actions: actionsForType("ready_to_invoice"),
      });
    }
  }

  return items
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 24);
}

function buildAlerts(shipments: Shipment[]): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];
  for (const s of shipments) {
    if (s.status === "delayed") {
      alerts.push({
        id: nextId("alr"),
        type: "late_delivery",
        severity: "critical",
        shipmentId: s.id,
        message: `Shipment #${s.number} is running late to ${s.delivery.address.city}.`,
        createdAt: minutesAgo(randInt(1, 30)),
        read: false,
      });
    }
    if (s.assignedCarrier?.insuranceStatus === "expiring_soon") {
      alerts.push({
        id: nextId("alr"),
        type: "insurance_expiring",
        severity: "attention",
        shipmentId: s.id,
        message: `${s.assignedCarrier.name}'s insurance expires soon.`,
        createdAt: minutesAgo(randInt(30, 300)),
        read: false,
      });
    }
    if (s.cargo.declaredValueUsd > 30000) {
      alerts.push({
        id: nextId("alr"),
        type: "high_value_shipment",
        severity: "approval",
        shipmentId: s.id,
        message: `Shipment #${s.number} declared value is $${s.cargo.declaredValueUsd.toLocaleString()}.`,
        createdAt: s.createdAt,
        read: false,
      });
    }
  }
  return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
}

function buildKpis(shipments: Shipment[]): KpiMetric[] {
  const active = shipments.filter((s) => !["delivered", "cancelled"].includes(s.status));
  const waiting = shipments.filter((s) => s.status === "waiting_assignment");
  const enRoute = shipments.filter((s) => s.status === "driver_en_route");
  const late = shipments.filter((s) => s.status === "delayed");
  const deliveredToday = shipments.filter((s) => s.status === "delivered");
  const revenue = deliveredToday.reduce((sum, s) => sum + s.cargo.declaredValueUsd * 0.18, 0);
  const margin = 22 + Math.random() * 6;
  const avgAssignMin = 9 + Math.random() * 6;
  const avgPickupDelay = 4 + Math.random() * 5;
  const avgDeliveryDelay = 6 + Math.random() * 8;

  const metric = (
    id: string,
    label: string,
    rawValue: number,
    format: KpiMetric["format"],
    goodDirection: KpiMetric["goodDirection"] = "up",
  ): KpiMetric => ({
    id,
    label,
    rawValue,
    format,
    goodDirection,
    delta: Number((Math.random() * 10 - 4).toFixed(1)),
    deltaDirection: Math.random() > 0.5 ? "up" : "down",
    value:
      format === "currency"
        ? `$${Math.round(rawValue).toLocaleString()}`
        : format === "percent"
          ? `${rawValue.toFixed(1)}%`
          : format === "minutes"
            ? `${Math.round(rawValue)} min`
            : `${Math.round(rawValue)}`,
  });

  return [
    metric("active", "Active Shipments", active.length, "count"),
    metric("waiting", "Waiting Assignment", waiting.length, "count", "down"),
    metric("en_route", "Drivers En Route", enRoute.length, "count"),
    metric("late", "Late Shipments", late.length, "count", "down"),
    metric("completed", "Completed Today", deliveredToday.length, "count"),
    metric("revenue", "Revenue Today", revenue, "currency"),
    metric("margin", "Platform Margin", margin, "percent"),
    metric("avg_assign", "Avg Assignment Time", avgAssignMin, "minutes", "down"),
    metric("avg_pickup_delay", "Avg Pickup Delay", avgPickupDelay, "minutes", "down"),
    metric("avg_delivery_delay", "Avg Delivery Delay", avgDeliveryDelay, "minutes", "down"),
  ];
}

export interface DispatcherSnapshot {
  shipments: Shipment[];
  carriers: Carrier[];
  customers: Customer[];
  actionFeed: ActionFeedItem[];
  alerts: OperationalAlert[];
  kpis: KpiMetric[];
}

export function generateDispatcherSnapshot(): DispatcherSnapshot {
  const carriers = generateCarriers(8);
  const customers = generateCustomers(10);
  const shipments = generateShipments(64, carriers, customers);
  return {
    shipments,
    carriers,
    customers,
    actionFeed: buildActionFeed(shipments),
    alerts: buildAlerts(shipments),
    kpis: buildKpis(shipments),
  };
}

export function rankCarriersForShipment(shipment: Shipment, carriers: Carrier[]) {
  const scored = carriers.map((carrier) => {
    let score = 0;
    const factors: { label: string; value: string }[] = [];

    const distanceScore = Math.max(0, 30 - carrier.distanceKm);
    score += distanceScore;
    factors.push({ label: "Distance", value: `${carrier.distanceKm} km away` });

    const capable = carrier.vehiclesAvailable.some(
      (v) => VEHICLES[v.type].capacityTons >= VEHICLES[shipment.requestedVehicle].capacityTons * 0.9,
    );
    if (capable) {
      score += 20;
      factors.push({ label: "Vehicle Match", value: "Suitable capacity available" });
    }

    score += carrier.onTimePercent * 0.3;
    factors.push({ label: "On-Time %", value: `${carrier.onTimePercent}%` });

    score += carrier.acceptanceRatePercent * 0.15;
    factors.push({ label: "Acceptance Rate", value: `${carrier.acceptanceRatePercent}%` });

    score -= carrier.damageRatePercent * 4;
    factors.push({ label: "Damage Rate", value: `${carrier.damageRatePercent}%` });

    if (shipment.requestedServices.includes("white_glove")) {
      if (carrier.whiteGloveCertified) {
        score += 15;
        factors.push({ label: "White Glove", value: "Certified" });
      } else {
        score -= 25;
      }
    }

    if (carrier.previousJobsWithCustomer > 0) {
      score += Math.min(10, carrier.previousJobsWithCustomer);
      factors.push({ label: "Customer History", value: `${carrier.previousJobsWithCustomer} prior jobs` });
    }

    score += Math.max(0, 10 - carrier.avgResponseMinutes / 2);
    factors.push({ label: "Response Time", value: `~${carrier.avgResponseMinutes} min` });

    if (carrier.insuranceStatus === "active") {
      score += 5;
      factors.push({ label: "Insurance", value: "Active" });
    } else {
      score -= 15;
      factors.push({ label: "Insurance", value: carrier.insuranceStatus === "expired" ? "Expired" : "Expiring soon" });
    }

    return { carrier, score: Math.max(0, Math.round(score)), factors };
  });

  scored.sort((a, b) => b.score - a.score);
  const max = Math.max(...scored.map((s) => s.score), 1);

  return scored.slice(0, 4).map((s, i) => {
    const reasons: string[] = [];
    if (s.carrier.distanceKm < 15) reasons.push("nearest certified carrier");
    if (s.carrier.acceptanceRatePercent >= 90) reasons.push("highest acceptance rate");
    if (s.carrier.previousJobsWithCustomer > 0) reasons.push(`${s.carrier.previousJobsWithCustomer} previous successful deliveries for this customer`);
    if (s.carrier.onTimePercent >= 95) reasons.push("excellent on-time record");
    if (reasons.length === 0) reasons.push("best available match on distance and capacity");

    return {
      carrier: s.carrier,
      rank: i + 1,
      score: Math.round((s.score / max) * 100),
      reason: `Recommended because: ${reasons.join(", ")}.`,
      factors: s.factors,
    };
  });
}
