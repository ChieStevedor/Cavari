import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { checklistHasFailure } from "@/domain/checklists";
import { getNextStage } from "@/domain/workflow";
import { useSyncQueueStore } from "@/stores/syncQueueStore";
import type {
  CapturedPhoto,
  ChecklistItemId,
  GeoPoint,
  PhotoCategory,
  ProofOfDelivery,
  ShipmentException,
  SignatureRecord,
  Shipment,
  ShipmentStage,
  WhiteGloveTaskType,
} from "@/types/shipment";

interface ShipmentState {
  shipments: Shipment[];
  hasHydratedFromServer: boolean;

  hydrate: (shipments: Shipment[]) => void;
  getById: (id: string) => Shipment | undefined;

  acceptAssignment: (id: string) => void;
  advanceStage: (id: string, explicitStage?: ShipmentStage) => void;
  setChecklistAnswer: (
    id: string,
    listKey: "pickupChecklist" | "deliveryChecklist",
    itemId: ChecklistItemId,
    value: boolean,
    note?: string
  ) => void;
  addPhoto: (id: string, category: PhotoCategory, localUri: string, gps?: GeoPoint) => string;
  markPhotoUploaded: (id: string, photoId: string, remoteUrl: string) => void;
  markPhotoFailed: (id: string, photoId: string) => void;
  setWhiteGloveTaskComplete: (id: string, type: WhiteGloveTaskType, completed: boolean) => void;
  reportException: (id: string, exception: Omit<ShipmentException, "id" | "reportedAt" | "reportedStage" | "resolved">) => void;
  setSignature: (id: string, signature: SignatureRecord) => void;
  generatePOD: (id: string, driverId: string, driverName: string, gps?: GeoPoint) => void;
}

function touch(shipment: Shipment): Shipment {
  return { ...shipment, updatedAt: new Date().toISOString() };
}

export const useShipmentStore = create<ShipmentState>()(
  persist(
    (set, get) => ({
      shipments: [],
      hasHydratedFromServer: false,

      hydrate: (shipments) => set({ shipments, hasHydratedFromServer: true }),

      getById: (id) => get().shipments.find((s) => s.id === id),

      acceptAssignment: (id) => {
        get().advanceStage(id, "en_route_pickup");
      },

      advanceStage: (id, explicitStage) => {
        const shipment = get().getById(id);
        if (!shipment) return;
        const nextStage = explicitStage ?? getNextStage(shipment) ?? shipment.stage;
        const isDone = nextStage === "completed";
        set((s) => ({
          shipments: s.shipments.map((sh) =>
            sh.id === id
              ? touch({ ...sh, stage: nextStage, status: isDone ? "completed" : "active" })
              : sh
          ),
        }));
        useSyncQueueStore.getState().enqueue({
          type: "stage_advanced",
          shipmentId: id,
          payload: { stage: nextStage },
        });
      },

      setChecklistAnswer: (id, listKey, itemId, value, note) => {
        set((s) => ({
          shipments: s.shipments.map((sh) => {
            if (sh.id !== id) return sh;
            const list = sh[listKey].map((a) =>
              a.id === itemId ? { ...a, value, note: note ?? a.note } : a
            );
            return touch({ ...sh, [listKey]: list });
          }),
        }));
        const shipment = get().getById(id);
        const list = shipment?.[listKey] ?? [];
        useSyncQueueStore.getState().enqueue({
          type: "checklist_updated",
          shipmentId: id,
          payload: { listKey, itemId, value, note, hasFailure: checklistHasFailure(list) },
        });
      },

      addPhoto: (id, category, localUri, gps) => {
        const photo: CapturedPhoto = {
          id: `photo_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
          category,
          localUri,
          takenAt: new Date().toISOString(),
          uploadStatus: "pending",
          gps,
        };
        set((s) => ({
          shipments: s.shipments.map((sh) =>
            sh.id === id ? touch({ ...sh, photos: [...sh.photos, photo] }) : sh
          ),
        }));
        useSyncQueueStore.getState().enqueue({
          type: "photo_captured",
          shipmentId: id,
          payload: { photoId: photo.id, category },
        });
        return photo.id;
      },

      markPhotoUploaded: (id, photoId, remoteUrl) => {
        set((s) => ({
          shipments: s.shipments.map((sh) =>
            sh.id !== id
              ? sh
              : {
                  ...sh,
                  photos: sh.photos.map((p) =>
                    p.id === photoId ? { ...p, uploadStatus: "uploaded", remoteUrl } : p
                  ),
                },
          ),
        }));
      },

      markPhotoFailed: (id, photoId) => {
        set((s) => ({
          shipments: s.shipments.map((sh) =>
            sh.id !== id
              ? sh
              : {
                  ...sh,
                  photos: sh.photos.map((p) =>
                    p.id === photoId ? { ...p, uploadStatus: "failed" } : p
                  ),
                },
          ),
        }));
      },

      setWhiteGloveTaskComplete: (id, type, completed) => {
        set((s) => ({
          shipments: s.shipments.map((sh) =>
            sh.id !== id
              ? sh
              : touch({
                  ...sh,
                  whiteGloveTasks: sh.whiteGloveTasks.map((t) =>
                    t.type === type ? { ...t, completed } : t
                  ),
                })
          ),
        }));
        useSyncQueueStore.getState().enqueue({
          type: "white_glove_task_updated",
          shipmentId: id,
          payload: { type, completed },
        });
      },

      reportException: (id, exception) => {
        const shipment = get().getById(id);
        if (!shipment) return;
        const full: ShipmentException = {
          ...exception,
          id: `exc_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
          reportedAt: new Date().toISOString(),
          reportedStage: shipment.stage,
          resolved: false,
        };
        set((s) => ({
          shipments: s.shipments.map((sh) =>
            sh.id === id
              ? touch({ ...sh, exceptions: [...sh.exceptions, full], status: "exception" })
              : sh
          ),
        }));
        useSyncQueueStore.getState().enqueue({
          type: "exception_reported",
          shipmentId: id,
          payload: { exceptionId: full.id, issueType: full.type, notes: full.notes },
        });
      },

      setSignature: (id, signature) => {
        set((s) => ({
          shipments: s.shipments.map((sh) =>
            sh.id === id ? touch({ ...sh, status: "active" }) : sh
          ),
        }));
        set((s) => ({
          shipments: s.shipments.map((sh) => {
            if (sh.id !== id) return sh;
            const pod: ProofOfDelivery = sh.pod
              ? { ...sh.pod, signature }
              : {
                  id: `pod_${sh.id}`,
                  shipmentId: sh.id,
                  generatedAt: new Date().toISOString(),
                  driverId: "",
                  driverName: "",
                  photoIds: [],
                  exceptionIds: [],
                  signature,
                };
            return touch({ ...sh, pod });
          }),
        }));
        useSyncQueueStore.getState().enqueue({
          type: "signature_captured",
          shipmentId: id,
          payload: { signerName: signature.signerName, signedAt: signature.signedAt },
        });
      },

      generatePOD: (id, driverId, driverName, gps) => {
        set((s) => ({
          shipments: s.shipments.map((sh) => {
            if (sh.id !== id) return sh;
            const pod: ProofOfDelivery = {
              id: sh.pod?.id ?? `pod_${sh.id}`,
              shipmentId: sh.id,
              generatedAt: new Date().toISOString(),
              driverId,
              driverName,
              gps,
              photoIds: sh.photos.filter((p) => p.category === "delivery").map((p) => p.id),
              signature: sh.pod?.signature,
              exceptionIds: sh.exceptions.map((e) => e.id),
              deliveredToName: sh.delivery.contactName,
            };
            return touch({ ...sh, pod, stage: "pod_generated" });
          }),
        }));
        useSyncQueueStore.getState().enqueue({
          type: "pod_generated",
          shipmentId: id,
          payload: {},
        });
      },
    }),
    {
      name: "laviius-driver-shipments",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
