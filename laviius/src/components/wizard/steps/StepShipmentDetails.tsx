import { CargoCard } from "@/components/wizard/CargoCard";

export function StepShipmentDetails() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Shipment Details</h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose your cargo type — we&apos;ll only ask what&apos;s relevant from here on.
        </p>
      </div>
      <CargoCard />
    </div>
  );
}
