import { Package } from "lucide-react";
import { ComingSoon } from "@/components/dispatcher/shared/ComingSoon";

export default function ShipmentsPage() {
  return (
    <ComingSoon
      icon={Package}
      title="Shipment explorer is coming soon"
      description="A dedicated searchable archive of past and historical shipments. For active operations, use the Dispatch Queue."
    />
  );
}
