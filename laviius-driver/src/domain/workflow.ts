import type { ActionColor } from "@/constants/theme";
import type { Shipment, ShipmentStage } from "@/types/shipment";

/**
 * The single source of truth for shipment progression. The driver can only
 * move forward — screens read `resolveActiveStage` to know what to render
 * and write `advanceStage` (via the workflow store) to progress. There is
 * no API for jumping stages out of order, by design (spec: "The driver
 * cannot accidentally skip critical steps").
 */

interface StageMeta {
  stage: ShipmentStage;
  /** Verb-phrase shown in the Action Center, e.g. "Navigate to Pickup". */
  actionLabel: string;
  color: ActionColor;
  icon: string; // Ionicons glyph name
  /** Route segment under /job/[id]/... Null = no dedicated screen (auto-advance). */
  route: string | null;
  /** Screens this stage should skip when not applicable to the shipment. */
  skipIf?: (s: Shipment) => boolean;
}

export const STAGE_SEQUENCE: StageMeta[] = [
  {
    stage: "assigned",
    actionLabel: "Accept Assignment",
    color: "info",
    icon: "checkmark-circle-outline",
    route: "accept",
  },
  {
    stage: "en_route_pickup",
    actionLabel: "Navigate to Pickup",
    color: "go",
    icon: "navigate-outline",
    route: "navigate?leg=pickup",
  },
  {
    stage: "arrived_pickup",
    actionLabel: "Confirm Arrival",
    color: "attention",
    icon: "location-outline",
    route: "arrival?leg=pickup",
  },
  {
    stage: "loading_checklist",
    actionLabel: "Begin Loading",
    color: "info",
    icon: "cube-outline",
    route: "loading-checklist",
  },
  {
    stage: "cargo_verification",
    actionLabel: "Verify Cargo",
    color: "premium",
    icon: "shield-checkmark-outline",
    route: "cargo-verification",
  },
  {
    stage: "pickup_photos",
    actionLabel: "Capture Pickup Photos",
    color: "info",
    icon: "camera-outline",
    route: "photos?leg=pickup",
  },
  {
    stage: "confirm_loaded",
    actionLabel: "Confirm Loaded",
    color: "go",
    icon: "checkmark-done-outline",
    route: "confirm-loaded",
  },
  {
    stage: "en_route_delivery",
    actionLabel: "Start Route",
    color: "go",
    icon: "navigate-outline",
    route: "navigate?leg=delivery",
  },
  {
    stage: "arrived_delivery",
    actionLabel: "Confirm Arrival",
    color: "attention",
    icon: "location-outline",
    route: "arrival?leg=delivery",
  },
  {
    stage: "unload_checklist",
    actionLabel: "Begin Unloading",
    color: "info",
    icon: "cube-outline",
    route: "unload-checklist",
  },
  {
    stage: "white_glove_tasks",
    actionLabel: "Complete White Glove Tasks",
    color: "premium",
    icon: "sparkles-outline",
    route: "white-glove",
    skipIf: (s) => !s.isWhiteGlove,
  },
  {
    stage: "customer_signature",
    actionLabel: "Customer Signature Required",
    color: "attention",
    icon: "create-outline",
    route: "signature",
    skipIf: (s) => !s.requiresSignature,
  },
  {
    stage: "delivery_photos",
    actionLabel: "Capture Delivery Photos",
    color: "info",
    icon: "camera-outline",
    route: "photos?leg=delivery",
  },
  {
    stage: "pod_generated",
    actionLabel: "Generating Proof of Delivery",
    color: "go",
    icon: "document-text-outline",
    route: "pod",
  },
  {
    stage: "completed",
    actionLabel: "Shipment Complete",
    color: "go",
    icon: "checkmark-circle-outline",
    route: null,
  },
];

const STAGE_INDEX = new Map(STAGE_SEQUENCE.map((m, i) => [m.stage, i]));

export function getStageMeta(stage: ShipmentStage): StageMeta {
  const meta = STAGE_SEQUENCE.find((m) => m.stage === stage);
  if (!meta) throw new Error(`Unknown shipment stage: ${stage}`);
  return meta;
}

export function getStageIndex(stage: ShipmentStage): number {
  return STAGE_INDEX.get(stage) ?? 0;
}

/** Percent (0-1) through the guided workflow, for progress bars/steppers. */
export function getStageProgress(shipment: Shipment): number {
  const applicable = STAGE_SEQUENCE.filter((m) => !m.skipIf?.(shipment));
  const idx = applicable.findIndex((m) => m.stage === shipment.stage);
  if (idx === -1) return 0;
  return idx / (applicable.length - 1);
}

/**
 * The next stage in sequence, skipping any stage whose `skipIf` matches
 * this shipment (e.g. white glove tasks for standard freight, signature
 * for shipments that don't require one).
 */
export function getNextStage(shipment: Shipment): ShipmentStage | null {
  let idx = getStageIndex(shipment.stage) + 1;
  while (idx < STAGE_SEQUENCE.length) {
    const meta = STAGE_SEQUENCE[idx];
    if (!meta.skipIf?.(shipment)) return meta.stage;
    idx += 1;
  }
  return null;
}

export function isTerminalStage(stage: ShipmentStage): boolean {
  return stage === "completed";
}

/** What the Action Center should surface right now for this shipment. */
export function getActionCenterEntry(shipment: Shipment) {
  const meta = getStageMeta(shipment.stage);
  return {
    stage: shipment.stage,
    label: meta.actionLabel,
    color: meta.color,
    icon: meta.icon,
    route: meta.route ? `/job/${shipment.id}/${meta.route}` : null,
  };
}
