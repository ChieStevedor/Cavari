import { z } from "zod";

// Single source of truth for shipment request validation. Import this same
// schema from both the wizard's client-side form and the API route handler
// that persists it — never write a second, "server-only" copy. Client-side
// use is a UX convenience (inline errors); the server-side parse in
// app/api/shipments/route.ts is the actual security boundary.

export const shipmentAddressSchema = z.object({
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().length(2, "Use a 2-letter ISO country code"),
  contactName: z.string().trim().min(1).max(150),
  contactPhone: z.string().trim().min(1).max(30),
  notes: z.string().trim().max(1000).optional(),
});

export const shipmentCargoSchema = z.object({
  description: z.string().trim().min(1).max(500),
  weightKg: z.number().positive().max(50_000),
  declaredValueCents: z.number().int().nonnegative().max(1_000_000_000),
  currency: z.string().trim().length(3, "Use a 3-letter ISO currency code"),
  requiresRefrigeration: z.boolean().optional(),
  isHazardous: z.boolean().optional(),
});

export const shipmentVehicleSchema = z.object({
  vehicleType: z.string().trim().min(1).max(100),
  liftgateRequired: z.boolean(),
  palletJackRequired: z.boolean(),
});

export const shipmentPrioritySchema = z.enum([
  "standard",
  "expedited",
  "same_day",
]);

export const createShipmentSchema = z.object({
  companyId: z.string().uuid(),
  priority: shipmentPrioritySchema,
  pickup: shipmentAddressSchema,
  delivery: shipmentAddressSchema,
  cargo: shipmentCargoSchema,
  vehicle: shipmentVehicleSchema,
  services: z.array(z.string().trim().min(1).max(100)).max(20),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
