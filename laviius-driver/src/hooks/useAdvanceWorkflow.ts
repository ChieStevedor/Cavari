import { router } from "expo-router";

import { getActionCenterEntry } from "@/domain/workflow";
import { useShipmentStore } from "@/stores/shipmentStore";
import type { ShipmentStage } from "@/types/shipment";

/**
 * The "reduce taps" primitive: advances the shipment to its next stage and
 * immediately routes to whatever screen that stage requires — the driver
 * never lands back on Job Details to re-find the next action. Used by
 * every guided-workflow screen's primary CTA.
 */
export function useAdvanceWorkflow(shipmentId: string) {
  const advanceStage = useShipmentStore((s) => s.advanceStage);
  const getById = useShipmentStore((s) => s.getById);

  return (explicitStage?: ShipmentStage) => {
    advanceStage(shipmentId, explicitStage);
    const updated = getById(shipmentId);
    if (!updated) return;
    const entry = getActionCenterEntry(updated);
    router.replace((entry.route ?? `/job/${shipmentId}`) as never);
  };
}
