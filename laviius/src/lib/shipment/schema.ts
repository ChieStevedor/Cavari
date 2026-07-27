import { z } from "zod";
import type { WizardStepId } from "@/types/shipment";

const PHONE_RE = /^[0-9()+\-.\s]{7,20}$/;
const NUMERIC_RE = /^\d+(\.\d+)?$/;

const addressSchema = z.object({
  formatted: z.string().min(1, "Enter an address"),
  line1: z.string().min(1, "Enter a street address"),
  city: z.string().min(1, "Enter a city"),
  region: z.string().min(1, "Enter a state or province"),
  postalCode: z.string().min(1, "Enter a postal code"),
  country: z.string(),
  placeId: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const uploadedFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["uploading", "done", "error"]),
  previewUrl: z.string().optional(),
});

export const shipmentSchema = z
  .object({
    pickup: z.object({
      companyName: z.string().min(1, "Company name is required"),
      contactName: z.string().min(1, "Contact name is required"),
      phone: z.string().regex(PHONE_RE, "Enter a valid phone number"),
      email: z.string().email("Enter a valid email address"),
      address: addressSchema,
      date: z.string(),
      time: z.string(),
      loadingDockAvailable: z.boolean(),
      appointmentRequired: z.boolean(),
      notes: z.string(),
    }),
    delivery: z.object({
      companyName: z.string().min(1, "Company name is required"),
      contactName: z.string().min(1, "Contact name is required"),
      phone: z.string().regex(PHONE_RE, "Enter a valid phone number"),
      address: addressSchema,
      date: z.string(),
      time: z.string(),
      appointmentRequired: z.boolean(),
      notes: z.string(),
    }),
    cargo: z.object({
      cargoType: z
        .enum([
          "pallets",
          "furniture",
          "appliances",
          "crates",
          "electronics",
          "construction_materials",
          "machinery",
          "other",
        ])
        .nullable()
        .refine((v) => v !== null, "Choose a cargo type"),
      quantity: z.string().regex(NUMERIC_RE, "Enter a quantity"),
      weight: z.string().regex(NUMERIC_RE, "Enter a weight in lbs"),
      dimensions: z.object({
        length: z.string(),
        width: z.string(),
        height: z.string(),
        unit: z.enum(["in", "cm"]),
      }),
      declaredValue: z
        .string()
        .refine((v) => v === "" || NUMERIC_RE.test(v), "Enter a valid dollar amount"),
      photos: z.array(uploadedFileSchema),
      documents: z.array(uploadedFileSchema),
      pallet: z.object({
        palletCount: z.string(),
        palletDimensions: z.string(),
        stackable: z.boolean(),
        forkliftAvailable: z.boolean(),
      }),
      furniture: z.object({
        roomOfChoice: z.string(),
        stairs: z.boolean(),
        elevator: z.boolean(),
      }),
      appliance: z.object({
        disconnectOld: z.boolean(),
        installNew: z.boolean(),
        packagingRemoval: z.boolean(),
      }),
    }),
    service: z.object({
      vehicle: z
        .enum(["cargo_van", "sprinter", "cube_van", "five_ton", "tractor"])
        .nullable()
        .refine((v) => v !== null, "Choose a vehicle"),
      services: z.array(
        z.enum([
          "liftgate",
          "white_glove",
          "inside_delivery",
          "assembly",
          "debris_removal",
          "two_movers",
          "three_movers",
          "blanket_wrap",
          "tailgate",
        ]),
      ),
      priority: z.enum(["standard", "same_day", "asap"]),
    }),
    dismissedSuggestions: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    const asap = data.service.priority === "asap";

    if (!asap && !data.pickup.date) {
      ctx.addIssue({ code: "custom", path: ["pickup", "date"], message: "Pickup date is required" });
    }
    if (!asap && !data.pickup.time) {
      ctx.addIssue({ code: "custom", path: ["pickup", "time"], message: "Pickup time is required" });
    }
    if (!asap && !data.delivery.date) {
      ctx.addIssue({ code: "custom", path: ["delivery", "date"], message: "Delivery date is required" });
    }
    if (!asap && !data.delivery.time) {
      ctx.addIssue({ code: "custom", path: ["delivery", "time"], message: "Delivery time is required" });
    }

    if (data.cargo.cargoType === "pallets") {
      if (!data.cargo.pallet.palletCount) {
        ctx.addIssue({
          code: "custom",
          path: ["cargo", "pallet", "palletCount"],
          message: "Number of pallets is required",
        });
      }
      if (!data.cargo.pallet.palletDimensions) {
        ctx.addIssue({
          code: "custom",
          path: ["cargo", "pallet", "palletDimensions"],
          message: "Pallet dimensions are required",
        });
      }
    }

    if (data.cargo.cargoType === "furniture" && !data.cargo.furniture.roomOfChoice) {
      ctx.addIssue({
        code: "custom",
        path: ["cargo", "furniture", "roomOfChoice"],
        message: "Room of choice is required",
      });
    }
  });

export type ShipmentSchema = z.infer<typeof shipmentSchema>;

/** Field paths validated when the customer clicks "Next" on each step. */
export const STEP_FIELD_NAMES: Record<WizardStepId, string[]> = {
  pickup: [
    "pickup.companyName",
    "pickup.contactName",
    "pickup.phone",
    "pickup.email",
    "pickup.address",
    "pickup.date",
    "pickup.time",
  ],
  delivery: [
    "delivery.companyName",
    "delivery.contactName",
    "delivery.phone",
    "delivery.address",
    "delivery.date",
    "delivery.time",
  ],
  shipment: [
    "cargo.cargoType",
    "cargo.quantity",
    "cargo.weight",
    "cargo.declaredValue",
    "cargo.pallet.palletCount",
    "cargo.pallet.palletDimensions",
    "cargo.furniture.roomOfChoice",
  ],
  service: ["service.vehicle"],
  review: [],
};
