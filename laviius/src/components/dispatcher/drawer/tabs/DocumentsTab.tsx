import { FileText, FolderOpen, Image as ImageIcon } from "lucide-react";
import type { Shipment, ShipmentDocument } from "@/types/dispatcher";
import { EmptyState } from "@/components/dispatcher/shared/EmptyState";
import { formatRelativeTime } from "@/lib/dispatcher/time";

const KIND_LABEL: Record<ShipmentDocument["kind"], string> = {
  photo: "Photo",
  pod: "Proof of Delivery",
  bol: "Bill of Lading",
  invoice: "Invoice",
  other: "Document",
};

export function DocumentsTab({ shipment }: { shipment: Shipment }) {
  if (shipment.documents.length === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No documents yet"
        description="Photos, bills of lading, and proof of delivery will appear here once uploaded by the carrier or driver."
      />
    );
  }

  return (
    <div className="space-y-2">
      {shipment.documents.map((doc) => {
        const Icon = doc.kind === "photo" ? ImageIcon : FileText;
        return (
          <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <Icon className="h-4 w-4 text-slate-500" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-navy">{doc.name}</p>
              <p className="text-xs text-slate-400">
                {KIND_LABEL[doc.kind]} · uploaded {formatRelativeTime(doc.uploadedAt)} ago
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
