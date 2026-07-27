import { Users } from "lucide-react";
import { ComingSoon } from "@/components/dispatcher/shared/ComingSoon";

export default function CustomersPage() {
  return (
    <ComingSoon
      icon={Users}
      title="Customer directory is coming soon"
      description="Account tiers, shipment history, and billing contacts for every customer."
    />
  );
}
