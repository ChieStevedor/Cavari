"use client";

import type { ShipmentPriority, ShipmentStatus } from "@/types/dispatcher";

export interface SavedView {
  id: string;
  name: string;
  statuses: ShipmentStatus[] | "all";
  priority: ShipmentPriority | "all";
}

export const BUILT_IN_VIEWS: SavedView[] = [
  { id: "all", name: "All Shipments", statuses: "all", priority: "all" },
  { id: "needs_action", name: "Needs Action", statuses: ["waiting_assignment", "delayed"], priority: "all" },
  { id: "in_transit", name: "In Transit", statuses: ["driver_en_route", "picked_up"], priority: "all" },
  { id: "delivered", name: "Delivered", statuses: ["delivered"], priority: "all" },
];

const PREFS_KEY = "laviius.dispatcher.queuePrefs.v1";

interface QueuePrefs {
  visibleOptionalColumns: string[];
  lastViewId: string;
}

const DEFAULT_PREFS: QueuePrefs = {
  visibleOptionalColumns: ["driver", "eta"],
  lastViewId: "all",
};

export function loadQueuePrefs(): QueuePrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveQueuePrefs(prefs: QueuePrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export type { QueuePrefs };
