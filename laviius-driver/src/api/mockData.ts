import { buildDeliveryChecklist, buildPickupChecklist } from "@/domain/checklists";
import type { DriverProfile } from "@/types/driver";
import type { MessageThread } from "@/types/messaging";
import type { Shipment } from "@/types/shipment";

const now = new Date();
const at = (hoursFromNow: number) =>
  new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000).toISOString();

export const mockDriver: DriverProfile = {
  id: "drv_001",
  name: "Marcus Reyes",
  phone: "(312) 555-0148",
  email: "marcus.reyes@atlascartage.com",
  carrierName: "Atlas Cartage & Logistics",
  employeeId: "AC-2291",
  status: "on_duty",
  certifications: [
    { id: "cert_1", name: "White Glove Certified", issuedAt: "2023-02-01", isWhiteGlove: true },
    { id: "cert_2", name: "Forklift Operator", issuedAt: "2022-06-15", expiresAt: "2027-06-15" },
    { id: "cert_3", name: "HAZMAT Endorsement", issuedAt: "2024-01-10", expiresAt: "2026-01-10" },
  ],
  performance: {
    onTimePercent: 98.2,
    completedJobs: 1247,
    claimsCount: 2,
    customerRatingAvg: 4.9,
    ratingCount: 612,
  },
  vehicle: { id: "veh_14", label: "Box Truck 14", type: "26' Box Truck", licensePlate: "IL-LVX1142" },
  documents: [
    { id: "doc_1", name: "CDL - Class B", expiresAt: "2027-08-01", status: "valid" },
    { id: "doc_2", name: "Insurance Card", expiresAt: "2026-09-01", status: "valid" },
    { id: "doc_3", name: "Medical Certificate", expiresAt: "2026-08-30", status: "expiring_soon" },
  ],
};

const activeShipment: Shipment = {
  id: "shp_1001",
  shipmentNumber: "LVX-48213",
  customerName: "Chatham Fine Furnishings",
  serviceType: "white_glove",
  isWhiteGlove: true,
  pickup: {
    label: "Chatham Distribution Center",
    line1: "4100 W Fulton Market",
    city: "Chicago",
    state: "IL",
    zip: "60624",
    contactName: "Warehouse Dock",
    contactPhone: "(312) 555-9012",
    accessNotes: "Dock 3. Ring bell, gate code #4471.",
    coordinates: { lat: 41.8859, lng: -87.6963 },
  },
  delivery: {
    label: "Residence — Beatty",
    line1: "220 E Walton St, Unit 14B",
    city: "Chicago",
    state: "IL",
    zip: "60611",
    contactName: "Elaine Beatty",
    contactPhone: "(773) 555-2231",
    accessNotes: "Doorman building. Freight elevator after 10am.",
    coordinates: { lat: 41.9007, lng: -87.6231 },
  },
  pickupWindow: { start: at(0.4), end: at(1.4), isHardAppointment: true },
  deliveryWindow: { start: at(2.5), end: at(3.5), isHardAppointment: true },
  cargo: [
    { id: "c1", description: "Sectional Sofa", quantity: 1, weightLbs: 240, dimensions: { lengthIn: 110, widthIn: 40, heightIn: 34 }, requiresTwoPerson: true },
    { id: "c2", description: "Dining Table, Glass Top", quantity: 1, weightLbs: 165, isFragile: true, requiresTwoPerson: true },
    { id: "c3", description: "Dining Chairs", quantity: 6, weightLbs: 18 },
  ],
  totalWeightLbs: 513,
  vehicle: { id: "veh_14", label: "Box Truck 14", type: "26' Box Truck", licensePlate: "IL-LVX1142", liftgate: true },
  dispatcherNotes: "Customer requested morning delivery, confirmed by phone.",
  carrierNotes: "Two-person crew required for sofa + glass table.",
  specialInstructions: "Glass top table — extra padding required, do not stack.",
  whiteGloveTasks: [
    { type: "room_of_choice", label: "Room of Choice", detail: "Living room, 3rd floor", required: true, completed: false },
    { type: "blanket_wrap", label: "Blanket Wrap", required: true, completed: false },
    { type: "elevator", label: "Elevator", detail: "Freight elevator available after 10am", required: true, completed: false },
    { type: "two_movers", label: "Two Movers", required: true, completed: false },
    { type: "packaging_removal", label: "Packaging Removal", required: true, completed: false },
    { type: "debris_removal", label: "Debris Removal", required: false, completed: false },
  ],
  stage: "en_route_pickup",
  status: "active",
  photos: [],
  pickupChecklist: buildPickupChecklist(),
  deliveryChecklist: buildDeliveryChecklist({ isWhiteGlove: true }),
  exceptions: [],
  requiresSignature: true,
  createdAt: at(-4),
  updatedAt: at(-0.1),
};

const nextShipment: Shipment = {
  id: "shp_1002",
  shipmentNumber: "LVX-48219",
  customerName: "Prairie Sound Studios",
  serviceType: "commercial",
  isWhiteGlove: false,
  pickup: {
    label: "Prairie Sound Studios — Loading Bay",
    line1: "980 W 15th St",
    city: "Chicago",
    state: "IL",
    zip: "60608",
    accessNotes: "Loading bay B, no appointment needed before 5pm.",
    coordinates: { lat: 41.8608, lng: -87.6497 },
  },
  delivery: {
    label: "Regal Studios",
    line1: "1200 N Elston Ave",
    city: "Chicago",
    state: "IL",
    zip: "60642",
    coordinates: { lat: 41.9074, lng: -87.6693 },
  },
  pickupWindow: { start: at(4), end: at(5), isHardAppointment: false },
  deliveryWindow: { start: at(6), end: at(7), isHardAppointment: false },
  cargo: [
    { id: "c4", description: "Studio Rack Cases", quantity: 4, weightLbs: 60 },
  ],
  totalWeightLbs: 240,
  vehicle: { id: "veh_14", label: "Box Truck 14", type: "26' Box Truck", licensePlate: "IL-LVX1142", liftgate: true },
  whiteGloveTasks: [],
  stage: "assigned",
  status: "upcoming",
  photos: [],
  pickupChecklist: buildPickupChecklist(),
  deliveryChecklist: buildDeliveryChecklist({ isWhiteGlove: false }),
  exceptions: [],
  requiresSignature: false,
  createdAt: at(-1),
  updatedAt: at(-1),
};

const completedShipment: Shipment = {
  id: "shp_0994",
  shipmentNumber: "LVX-48190",
  customerName: "Northshore Medical Supply",
  serviceType: "last_mile",
  isWhiteGlove: false,
  pickup: {
    label: "Northshore Medical Supply",
    line1: "700 Lake Cook Rd",
    city: "Deerfield",
    state: "IL",
    zip: "60015",
    coordinates: { lat: 42.1653, lng: -87.8256 },
  },
  delivery: {
    label: "Evanston Hospital — Receiving",
    line1: "2650 Ridge Ave",
    city: "Evanston",
    state: "IL",
    zip: "60201",
    coordinates: { lat: 42.0567, lng: -87.6862 },
  },
  pickupWindow: { start: at(-6), end: at(-5), isHardAppointment: true },
  deliveryWindow: { start: at(-3), end: at(-2), isHardAppointment: true },
  cargo: [{ id: "c5", description: "Medical Equipment Pallet", quantity: 1, weightLbs: 410 }],
  totalWeightLbs: 410,
  vehicle: { id: "veh_14", label: "Box Truck 14", type: "26' Box Truck", licensePlate: "IL-LVX1142", liftgate: true },
  whiteGloveTasks: [],
  stage: "completed",
  status: "completed",
  photos: [],
  pickupChecklist: buildPickupChecklist().map((c) => ({ ...c, value: c.isWarningItem ? false : true })),
  deliveryChecklist: buildDeliveryChecklist({ isWhiteGlove: false }).map((c) => ({ ...c, value: true })),
  exceptions: [],
  requiresSignature: true,
  createdAt: at(-8),
  updatedAt: at(-2),
};

export const mockShipments: Shipment[] = [activeShipment, nextShipment, completedShipment];

export const mockThreads: MessageThread[] = [
  {
    id: "thr_1",
    shipmentId: "shp_1001",
    shipmentNumber: "LVX-48213",
    participants: [
      { id: "disp_1", name: "Dana (Dispatch)", role: "dispatcher" },
      { id: "drv_001", name: "Marcus Reyes", role: "driver" },
    ],
    unreadCount: 1,
    updatedAt: at(-0.05),
    lastMessage: {
      id: "msg_9",
      threadId: "thr_1",
      senderId: "disp_1",
      contentType: "text",
      text: "Customer confirmed freight elevator access after 10am — you're good to go.",
      sentAt: at(-0.05),
      deliveryStatus: "delivered",
    },
  },
  {
    id: "thr_2",
    participants: [
      { id: "cdisp_1", name: "Atlas Cartage Ops", role: "carrier_dispatcher" },
      { id: "drv_001", name: "Marcus Reyes", role: "driver" },
    ],
    unreadCount: 0,
    updatedAt: at(-5),
    lastMessage: {
      id: "msg_2",
      threadId: "thr_2",
      senderId: "cdisp_1",
      contentType: "text",
      text: "Vehicle inspection due Friday — schedule at the yard.",
      sentAt: at(-5),
      deliveryStatus: "delivered",
    },
  },
];
