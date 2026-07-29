import { useMutation } from "@tanstack/react-query";

import { uploadPhoto } from "@/api/client";
import { useShipmentStore } from "@/stores/shipmentStore";
import type { PhotoCategory } from "@/types/shipment";

/**
 * Captures a photo locally (instant, always succeeds) then background-
 * uploads it. The photo is attached to the shipment and visible to the
 * driver immediately regardless of upload outcome — upload failures are
 * retried by the sync queue, never block the workflow.
 */
export function useCapturePhoto(shipmentId: string) {
  const addPhoto = useShipmentStore((s) => s.addPhoto);
  const markUploaded = useShipmentStore((s) => s.markPhotoUploaded);
  const markFailed = useShipmentStore((s) => s.markPhotoFailed);

  return useMutation({
    mutationFn: async ({
      localUri,
      category,
      gps,
    }: {
      localUri: string;
      category: PhotoCategory;
      gps?: { lat: number; lng: number };
    }) => {
      const photoId = addPhoto(shipmentId, category, localUri, gps);
      try {
        const { remoteUrl } = await uploadPhoto(localUri);
        markUploaded(shipmentId, photoId, remoteUrl);
      } catch {
        markFailed(shipmentId, photoId);
      }
      return photoId;
    },
  });
}
