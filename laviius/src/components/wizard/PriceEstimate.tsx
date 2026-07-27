"use client";

import { DollarSign } from "lucide-react";
import type { ShipmentFormValues } from "@/types/shipment";
import { PRIORITY_MULTIPLIER, SERVICE_ADDON_USD, VEHICLE_BASE_RATE_USD, VEHICLE_OPTIONS, SERVICE_OPTIONS } from "@/lib/shipment/constants";
import { estimatePrice, formatPriceEstimate } from "@/lib/shipment/pricing";
import { SectionCard } from "@/components/ui/SectionCard";

export function PriceEstimate({ values }: { values: ShipmentFormValues }) {
  const estimate = estimatePrice(values);
  const vehicle = values.service.vehicle;
  const vehicleLabel = vehicle ? VEHICLE_OPTIONS.find((v) => v.value === vehicle)?.label : null;

  return (
    <SectionCard icon={<DollarSign className="h-4.5 w-4.5" />} title="Estimated Price">
      <p className="text-3xl font-bold text-navy">{formatPriceEstimate(estimate)}</p>
      <p className="mt-1 text-xs text-slate-500">Final price confirmed once a carrier accepts.</p>

      {vehicle && (
        <dl className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">{vehicleLabel} base rate</dt>
            <dd className="text-navy">${VEHICLE_BASE_RATE_USD[vehicle]}</dd>
          </div>
          {values.service.services.map((s) => (
            <div key={s} className="flex justify-between">
              <dt className="text-slate-500">{SERVICE_OPTIONS.find((o) => o.value === s)?.label}</dt>
              <dd className="text-navy">+${SERVICE_ADDON_USD[s]}</dd>
            </div>
          ))}
          {values.service.priority !== "standard" && (
            <div className="flex justify-between">
              <dt className="text-slate-500 capitalize">{values.service.priority.replace("_", " ")} priority</dt>
              <dd className="text-navy">×{PRIORITY_MULTIPLIER[values.service.priority]}</dd>
            </div>
          )}
        </dl>
      )}
    </SectionCard>
  );
}
