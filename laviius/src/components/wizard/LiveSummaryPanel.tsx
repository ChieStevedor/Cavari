"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock, DollarSign, MapPin, Package, Truck } from "lucide-react";
import type { ShipmentFormValues } from "@/types/shipment";
import { computeProgressPercent, getShipmentSummary } from "@/lib/shipment/summary";

export function LiveSummaryPanel({ values }: { values: ShipmentFormValues }) {
  const summary = getShipmentSummary(values);
  const progress = computeProgressPercent(values);

  return (
    <aside className="sticky top-24 hidden w-[320px] shrink-0 lg:block">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Shipment Summary
        </h3>

        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-navy">
          <MapPin className="h-4 w-4 text-electric" />
          <span className="truncate">{summary.pickupCity}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
          <span className="truncate">{summary.deliveryCity}</span>
        </div>

        <dl className="mt-5 flex flex-col gap-3.5 border-t border-slate-100 pt-5 text-sm">
          <div className="flex items-start justify-between gap-3">
            <dt className="flex items-center gap-2 text-slate-500">
              <Truck className="h-4 w-4" /> Vehicle
            </dt>
            <dd className="text-right font-medium text-navy">
              {summary.vehicleLabel ?? "Not selected"}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-3">
            <dt className="flex items-center gap-2 text-slate-500">
              <Package className="h-4 w-4" /> Services
            </dt>
            <dd className="max-w-[170px] text-right font-medium text-navy">
              {summary.serviceLabels.length > 0 ? summary.serviceLabels.join(", ") : "None yet"}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-3">
            <dt className="flex items-center gap-2 text-slate-500">
              <DollarSign className="h-4 w-4" /> Estimated Cost
            </dt>
            <dd className="text-right font-medium text-navy">{summary.priceLabel}</dd>
          </div>

          <div className="flex items-start justify-between gap-3">
            <dt className="flex items-center gap-2 text-slate-500">
              <Clock className="h-4 w-4" /> Estimated Pickup
            </dt>
            <dd className="max-w-[170px] text-right font-medium text-navy">{summary.pickupWindow}</dd>
          </div>
        </dl>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-electric"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
