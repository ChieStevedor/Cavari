import { z } from "zod";

// Server-side file upload constraints for shipment photos/documents. Enforce
// these in the route handler that accepts the upload — never trust a
// client-reported mime type or filename alone (spoofable). See
// SECURITY.md, "File uploads".

export const ALLOWED_SHIPMENT_FILE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_SHIPMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const shipmentFileMetadataSchema = z.object({
  shipmentId: z.string().uuid(),
  mimeType: z.enum(ALLOWED_SHIPMENT_FILE_MIME_TYPES),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_SHIPMENT_FILE_SIZE_BYTES),
});

export type ShipmentFileMetadata = z.infer<typeof shipmentFileMetadataSchema>;

/**
 * Generates a storage-safe filename. The original filename is never trusted
 * or persisted as the storage key — only kept (if at all) as a display-only
 * label, separately from the storage path.
 */
export function generateStorageFilename(mimeType: string): string {
  const extension = MIME_TO_EXTENSION[mimeType] ?? "bin";
  const id =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${id}.${extension}`;
}

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
