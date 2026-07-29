import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { pushShipmentEvent } from "@/api/client";
import { useConnectivityStore } from "@/stores/connectivityStore";

/**
 * Offline-first mutation queue. Every workflow action that must reach the
 * server (stage advance, checklist answer, photo upload metadata, exception
 * report, signature, message send) is written locally first and enqueued
 * here. `flush()` drains the queue when connectivity returns — nothing is
 * ever lost, and the driver never blocks on a network round trip mid-task.
 */

export type SyncEventType =
  | "stage_advanced"
  | "checklist_updated"
  | "photo_captured"
  | "white_glove_task_updated"
  | "exception_reported"
  | "signature_captured"
  | "pod_generated"
  | "message_sent";

export interface SyncQueueItem {
  id: string;
  type: SyncEventType;
  shipmentId: string;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

interface SyncQueueState {
  queue: SyncQueueItem[];
  isFlushing: boolean;
  enqueue: (item: Omit<SyncQueueItem, "id" | "createdAt" | "attempts">) => void;
  flush: () => Promise<void>;
  clear: () => void;
}

export const useSyncQueueStore = create<SyncQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isFlushing: false,
      enqueue: (item) => {
        const entry: SyncQueueItem = {
          ...item,
          id: `sync_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
          createdAt: new Date().toISOString(),
          attempts: 0,
        };
        set((s) => ({ queue: [...s.queue, entry] }));
        if (useConnectivityStore.getState().isOnline) {
          void get().flush();
        }
      },
      flush: async () => {
        if (get().isFlushing) return;
        if (!useConnectivityStore.getState().isOnline) return;
        set({ isFlushing: true });
        try {
          let remaining = [...get().queue];
          for (const item of [...remaining]) {
            try {
              await pushShipmentEvent(item);
              remaining = remaining.filter((q) => q.id !== item.id);
              set({ queue: remaining });
            } catch (err) {
              remaining = remaining.map((q) =>
                q.id === item.id
                  ? { ...q, attempts: q.attempts + 1, lastError: String(err) }
                  : q
              );
              set({ queue: remaining });
              // Stop draining on first failure — preserves ordering and
              // avoids hammering a down endpoint; will retry on next flush.
              break;
            }
          }
        } finally {
          set({ isFlushing: false });
        }
      },
      clear: () => set({ queue: [] }),
    }),
    {
      name: "laviius-driver-sync-queue",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/** Wire this once from the root layout so reconnects trigger a flush. */
export function initSyncOnReconnect() {
  return useConnectivityStore.subscribe((state, prev) => {
    if (state.isOnline && !prev.isOnline) {
      void useSyncQueueStore.getState().flush();
    }
  });
}
