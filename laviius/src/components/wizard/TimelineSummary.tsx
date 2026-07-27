"use client";

import { Circle, MapPin } from "lucide-react";
import type { ShipmentFormValues } from "@/types/shipment";
import { estimatePickupWindow } from "@/lib/shipment/pricing";

export function TimelineSummary({ values }: { values: ShipmentFormValues }) {
  const pickupWindow = estimatePickupWindow(values);
  const asap = values.service.priority === "asap";

  return (
    <div className="relative flex flex-col gap-6 pl-6">
      <span className="absolute top-2 bottom-2 left-[9px] w-px bg-slate-200" aria-hidden="true" />

      <div className="relative">
        <Circle className="absolute -left-6 top-0.5 h-4.5 w-4.5 fill-electric text-electric" />
        <p className="text-xs font-semibold uppercase tracking-wide text-electric">Pickup</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-navy">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          {values.pickup.address.formatted || "Address pending"}
        </p>
        <p className="text-sm text-slate-500">{pickupWindow}</p>
      </div>

      <div className="relative">
        <Circle className="absolute -left-6 top-0.5 h-4.5 w-4.5 fill-emerald text-emerald" />
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald">Delivery</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-navy">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          {values.delivery.address.formatted || "Address pending"}
        </p>
        <p className="text-sm text-slate-500">
          {asap
            ? "As soon as the route allows"
            : values.delivery.date
              ? new Date(`${values.delivery.date}T${values.delivery.time || "00:00"}`).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : "Choose a delivery date"}
        </p>
      </div>
    </div>
  );
}
