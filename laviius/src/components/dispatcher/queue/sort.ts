import type { Shipment } from "@/types/dispatcher";

const STATUS_ORDER: Record<Shipment["status"], number> = {
  delayed: 0,
  waiting_assignment: 1,
  assigned: 2,
  driver_en_route: 3,
  picked_up: 4,
  delivered: 5,
  cancelled: 6,
};

const PRIORITY_ORDER: Record<Shipment["priority"], number> = {
  asap: 0,
  same_day: 1,
  standard: 2,
};

export function getSortValue(shipment: Shipment, columnId: string): string | number {
  switch (columnId) {
    case "number":
      return shipment.number;
    case "priority":
      return PRIORITY_ORDER[shipment.priority];
    case "status":
      return STATUS_ORDER[shipment.status];
    case "pickup":
      return shipment.pickup.address.city;
    case "delivery":
      return shipment.delivery.address.city;
    case "customer":
      return shipment.customer.companyName;
    case "carrier":
      return shipment.assignedCarrier?.name ?? "￿";
    case "driver":
      return shipment.assignedDriver?.name ?? "￿";
    case "vehicle":
      return shipment.requestedVehicle;
    case "pickupTime":
      return new Date(shipment.pickup.scheduledFor).getTime();
    case "eta":
      return shipment.etaMinutes ?? Number.MAX_SAFE_INTEGER;
    case "dispatcher":
      return shipment.dispatcherName ?? "￿";
    default:
      return shipment.number;
  }
}
