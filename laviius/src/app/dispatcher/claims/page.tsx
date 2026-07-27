import { ShieldAlert } from "lucide-react";
import { ComingSoon } from "@/components/dispatcher/shared/ComingSoon";

export default function ClaimsPage() {
  return (
    <ComingSoon
      icon={ShieldAlert}
      title="Claims workspace is coming soon"
      description="Damage and loss claims will be triaged here, linked back to the originating shipment's timeline and documents."
    />
  );
}
