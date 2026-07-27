import { Truck } from "lucide-react";
import { ComingSoon } from "@/components/dispatcher/shared/ComingSoon";

export default function CarriersPage() {
  return (
    <ComingSoon
      icon={Truck}
      title="Carrier directory is coming soon"
      description="Full carrier profiles, performance history, and insurance documents. Carrier recommendations are already live inside each shipment's Carrier tab."
    />
  );
}
