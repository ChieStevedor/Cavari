import type { Shipment } from "@/types/shipment";

/** The shipment the driver is actively working (not completed/cancelled),
 * earliest pickup window first. */
export function selectCurrentAssignment(shipments: Shipment[]): Shipment | null {
  const active = shipments.filter((s) => s.status === "active" || s.status === "exception");
  if (active.length === 0) return null;
  return [...active].sort(
    (a, b) => new Date(a.pickupWindow.start).getTime() - new Date(b.pickupWindow.start).getTime()
  )[0];
}

export function selectNextAssignment(shipments: Shipment[], excludingId?: string): Shipment | null {
  const upcoming = shipments.filter((s) => s.status === "upcoming" && s.id !== excludingId);
  if (upcoming.length === 0) return null;
  return [...upcoming].sort(
    (a, b) => new Date(a.pickupWindow.start).getTime() - new Date(b.pickupWindow.start).getTime()
  )[0];
}

export function selectTodaysShipments(shipments: Shipment[]): Shipment[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return shipments
    .filter((s) => {
      const pickup = new Date(s.pickupWindow.start);
      return pickup >= today && pickup < tomorrow;
    })
    .sort((a, b) => new Date(a.pickupWindow.start).getTime() - new Date(b.pickupWindow.start).getTime());
}
