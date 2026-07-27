"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronUp, MapPin, X } from "lucide-react";
import type { ShipmentFormValues } from "@/types/shipment";
import { getShipmentSummary } from "@/lib/shipment/summary";

export function MobileSummaryChip({ values }: { values: ShipmentFormValues }) {
  const [open, setOpen] = useState(false);
  const summary = getShipmentSummary(values);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-left shadow-lg backdrop-blur"
      >
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-navy">
          <MapPin className="h-4 w-4 shrink-0 text-electric" />
          <span className="truncate">{summary.pickupCity}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
          <span className="truncate">{summary.deliveryCity}</span>
        </span>
        <span className="ml-3 flex shrink-0 items-center gap-1.5 text-sm font-semibold text-electric">
          {summary.priceLabel !== "Select a vehicle to see pricing" ? summary.priceLabel : "View"}
          <ChevronUp className="h-4 w-4" />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-navy/40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Shipment Summary
                </h3>
                <button
                  type="button"
                  aria-label="Close summary"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Pickup</dt>
                  <dd className="font-medium text-navy">{summary.pickupCity}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Delivery</dt>
                  <dd className="font-medium text-navy">{summary.deliveryCity}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Vehicle</dt>
                  <dd className="font-medium text-navy">{summary.vehicleLabel ?? "Not selected"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Services</dt>
                  <dd className="max-w-[60%] text-right font-medium text-navy">
                    {summary.serviceLabels.length > 0 ? summary.serviceLabels.join(", ") : "None yet"}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3">
                  <dt className="text-slate-500">Estimated Cost</dt>
                  <dd className="font-semibold text-navy">{summary.priceLabel}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Estimated Pickup</dt>
                  <dd className="font-medium text-navy">{summary.pickupWindow}</dd>
                </div>
              </dl>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
