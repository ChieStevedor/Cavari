import { ContactCard } from "@/components/wizard/ContactCard";
import { AddressCard } from "@/components/wizard/AddressCard";

export function StepDelivery() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Delivery Details</h1>
        <p className="mt-1 text-sm text-slate-500">Tell us where and when the shipment should arrive.</p>
      </div>
      <ContactCard prefix="delivery" />
      <AddressCard prefix="delivery" />
    </div>
  );
}
