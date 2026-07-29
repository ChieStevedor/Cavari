import { describe, expect, it } from "vitest";
import { createShipmentSchema } from "./shipment";

const validAddress = {
  line1: "123 Main St",
  city: "Vancouver",
  region: "BC",
  postalCode: "V6B 1A1",
  country: "CA",
  contactName: "Jane Doe",
  contactPhone: "604-555-0100",
};

const validInput = {
  companyId: "123e4567-e89b-12d3-a456-426614174000",
  priority: "standard",
  pickup: validAddress,
  delivery: validAddress,
  cargo: {
    description: "Palletized dry goods",
    weightKg: 250,
    declaredValueCents: 500000,
    currency: "CAD",
  },
  vehicle: {
    vehicleType: "cube_van",
    liftgateRequired: false,
    palletJackRequired: true,
  },
  services: ["white_glove"],
};

describe("createShipmentSchema", () => {
  it("accepts a fully valid shipment request", () => {
    const result = createShipmentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects a non-UUID companyId", () => {
    const result = createShipmentSchema.safeParse({
      ...validInput,
      companyId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid priority value", () => {
    const result = createShipmentSchema.safeParse({
      ...validInput,
      priority: "urgent",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative cargo weight", () => {
    const result = createShipmentSchema.safeParse({
      ...validInput,
      cargo: { ...validInput.cargo, weightKg: -10 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a country code that isn't 2 letters", () => {
    const result = createShipmentSchema.safeParse({
      ...validInput,
      pickup: { ...validAddress, country: "CAN" },
    });
    expect(result.success).toBe(false);
  });
});
