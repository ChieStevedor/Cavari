import type { ShipmentFormValues } from "@/types/shipment";
import {
  PRIORITY_MULTIPLIER,
  SERVICE_ADDON_USD,
  VEHICLE_BASE_RATE_USD,
} from "./constants";

export interface PriceEstimate {
  low: number;
  high: number;
}

export function estimatePrice(values: ShipmentFormValues): PriceEstimate | null {
  const { vehicle, services, priority } = values.service;
  if (!vehicle) return null;

  const base = VEHICLE_BASE_RATE_USD[vehicle];
  const addons = services.reduce((sum, s) => sum + (SERVICE_ADDON_USD[s] ?? 0), 0);
  const subtotal = (base + addons) * PRIORITY_MULTIPLIER[priority];

  return {
    low: Math.round(subtotal * 0.9),
    high: Math.round(subtotal * 1.15),
  };
}

export function formatPriceEstimate(estimate: PriceEstimate | null): string {
  if (!estimate) return "Select a vehicle to see pricing";
  return `$${estimate.low.toLocaleString()} – $${estimate.high.toLocaleString()}`;
}

export function estimatePickupWindow(values: ShipmentFormValues): string {
  const { priority } = values.service;
  const { date, time } = values.pickup;

  if (priority === "asap") return "Earliest available — typically within 90 minutes";
  if (priority === "same_day") return "Today, within a 4-hour window";

  if (date && time) {
    const parsed = new Date(`${date}T${time}`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  }
  if (date) {
    const parsed = new Date(`${date}T00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  }
  return "Choose a pickup date";
}
