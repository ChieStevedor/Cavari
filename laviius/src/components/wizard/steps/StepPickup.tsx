import { ContactCard } from "@/components/wizard/ContactCard";
import { AddressCard } from "@/components/wizard/AddressCard";

export function StepPickup() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Pickup Details</h1>
        <p className="mt-1 text-sm text-slate-500">Tell us where and when to collect the shipment.</p>
      </div>
      <ContactCard prefix="pickup" showEmail />
      <AddressCard prefix="pickup" showLoadingDock />
    </div>
  );
}
