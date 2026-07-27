import type { ShipmentFormValues } from "@/types/shipment";
import { SERVICE_OPTIONS, VEHICLE_OPTIONS } from "./constants";
import { estimatePickupWindow, estimatePrice, formatPriceEstimate } from "./pricing";

export interface ShipmentSummary {
  pickupCity: string;
  deliveryCity: string;
  vehicleLabel: string | null;
  serviceLabels: string[];
  priceLabel: string;
  pickupWindow: string;
}

export function getShipmentSummary(values: ShipmentFormValues): ShipmentSummary {
  return {
    pickupCity: values.pickup.address.city || "—",
    deliveryCity: values.delivery.address.city || "—",
    vehicleLabel: values.service.vehicle
      ? (VEHICLE_OPTIONS.find((v) => v.value === values.service.vehicle)?.label ?? null)
      : null,
    serviceLabels: values.service.services.map(
      (s) => SERVICE_OPTIONS.find((opt) => opt.value === s)?.label ?? s,
    ),
    priceLabel: formatPriceEstimate(estimatePrice(values)),
    pickupWindow: estimatePickupWindow(values),
  };
}

export function computeProgressPercent(values: ShipmentFormValues): number {
  const checks = [
    !!values.pickup.companyName && !!values.pickup.address.formatted,
    !!values.delivery.companyName && !!values.delivery.address.formatted,
    !!values.cargo.cargoType && !!values.cargo.weight,
    !!values.service.vehicle,
    values.service.services.length > 0 || values.service.priority !== "standard",
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}
