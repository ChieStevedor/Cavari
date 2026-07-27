import type { FreightSuggestion, ShipmentFormValues, VehicleType } from "@/types/shipment";
import {
  DECLARED_VALUE_INSURANCE_THRESHOLD_USD,
  VEHICLE_CLASS_ORDER,
  VEHICLE_OPTIONS,
} from "./constants";

function vehicleLabel(vehicle: VehicleType): string {
  return VEHICLE_OPTIONS.find((v) => v.value === vehicle)?.label ?? vehicle;
}

function recommendVehicleForWeight(weight: number, isPalletized: boolean): VehicleType {
  if (isPalletized) {
    // Palletized freight needs dock-height, forklift-loadable trucks well before
    // its raw weight would exceed a smaller van's rated capacity.
    return weight >= 1500 ? "five_ton" : "cube_van";
  }
  const match = VEHICLE_OPTIONS.find((v) => v.capacityLbs >= weight);
  return match ? match.value : "tractor";
}

/**
 * Freight Intelligence: derives dismissible, low-friction suggestions from
 * whatever the customer has entered so far. Never blocks submission.
 */
export function generateSuggestions(values: ShipmentFormValues): FreightSuggestion[] {
  const suggestions: FreightSuggestion[] = [];
  const weight = parseFloat(values.cargo.weight);
  const declaredValue = parseFloat(values.cargo.declaredValue);
  const isPalletized = values.cargo.cargoType === "pallets";
  const { vehicle, services } = values.service;
  const hasMovers = services.includes("two_movers") || services.includes("three_movers");

  // Vehicle sizing: recommend, or warn on a capacity mismatch.
  if (!Number.isNaN(weight) && weight > 0) {
    const recommended = recommendVehicleForWeight(weight, isPalletized);
    if (!vehicle) {
      suggestions.push({
        id: `vehicle-recommend-${recommended}`,
        tone: "success",
        title: `${vehicleLabel(recommended)} Truck Recommended`,
        body: `Based on ${weight.toLocaleString()} lbs${isPalletized ? " of palletized freight" : ""}, a ${vehicleLabel(recommended)} is the best fit.`,
        action: {
          label: `Use ${vehicleLabel(recommended)}`,
          apply: (v) => ({ service: { ...v.service, vehicle: recommended } }),
        },
      });
    } else {
      const fits = isPalletized
        ? VEHICLE_CLASS_ORDER.indexOf(vehicle) >= VEHICLE_CLASS_ORDER.indexOf(recommended)
        : weight <= (VEHICLE_OPTIONS.find((v) => v.value === vehicle)?.capacityLbs ?? 0);
      if (!fits) {
        suggestions.push({
          id: "vehicle-capacity-warning",
          tone: "warning",
          title: "This shipment may exceed the recommended vehicle capacity",
          body: `${weight.toLocaleString()} lbs is more than a ${vehicleLabel(vehicle)} typically handles. Consider a ${vehicleLabel(recommended)}.`,
          action: {
            label: `Switch to ${vehicleLabel(recommended)}`,
            apply: (v) => ({ service: { ...v.service, vehicle: recommended } }),
          },
        });
      }
    }
  }

  // White Glove pairs with extra hands.
  if (services.includes("white_glove") && !hasMovers) {
    suggestions.push({
      id: "white-glove-movers",
      tone: "info",
      title: "Two Movers Recommended",
      body: "White Glove service typically requires two movers for safe, careful handling.",
      action: {
        label: "Add Two Movers",
        apply: (v) => ({
          service: { ...v.service, services: [...v.service.services, "two_movers"] },
        }),
      },
    });
  }

  // Stair access without an elevator, and no movers already selected.
  if (
    values.cargo.cargoType === "furniture" &&
    values.cargo.furniture.stairs &&
    !values.cargo.furniture.elevator &&
    !hasMovers &&
    !services.includes("white_glove")
  ) {
    suggestions.push({
      id: "furniture-stairs-movers",
      tone: "info",
      title: "Two Movers Recommended",
      body: "Stair access without an elevator usually goes faster — and safer — with an extra set of hands.",
      action: {
        label: "Add Two Movers",
        apply: (v) => ({
          service: { ...v.service, services: [...v.service.services, "two_movers"] },
        }),
      },
    });
  }

  // High declared value: prompt additional coverage.
  if (!Number.isNaN(declaredValue) && declaredValue >= DECLARED_VALUE_INSURANCE_THRESHOLD_USD) {
    suggestions.push({
      id: "insurance-suggested",
      tone: "warning",
      title: "Consider Additional Cargo Insurance",
      body: `A declared value of $${declaredValue.toLocaleString()} is above standard carrier liability coverage. We can connect you with additional coverage.`,
    });
  }

  // New appliance install usually leaves packaging behind.
  if (
    values.cargo.cargoType === "appliances" &&
    values.cargo.appliance.installNew &&
    !values.cargo.appliance.packagingRemoval
  ) {
    suggestions.push({
      id: "appliance-packaging-removal",
      tone: "info",
      title: "Packaging Removal Suggested",
      body: "Installing a new appliance usually leaves packaging behind — we can haul it away for you.",
      action: {
        label: "Add Packaging Removal",
        apply: (v) => ({
          cargo: { ...v.cargo, appliance: { ...v.cargo.appliance, packagingRemoval: true } },
        }),
      },
    });
  }

  return suggestions.filter((s) => !values.dismissedSuggestions.includes(s.id));
}
