"use client";

import { useMemo, useState } from "react";
import { Phone, MessageSquare, ShieldCheck, Star, UserRound, X } from "lucide-react";
import type { Shipment } from "@/types/dispatcher";
import { useDispatcher } from "@/lib/dispatcher/store";
import { rankCarriersForShipment } from "@/lib/dispatcher/mockData";
import { EmptyState } from "@/components/dispatcher/shared/EmptyState";
import { cn } from "@/lib/cn";

function StarRating({ score }: { score: number }) {
  const filled = Math.round((score / 100) * 5);
  return (
    <div className="flex items-center gap-0.5" aria-label={`${filled} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("h-3.5 w-3.5", i < filled ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
      ))}
    </div>
  );
}

export function CarrierTab({ shipment }: { shipment: Shipment }) {
  const { carriers, assignCarrier, setDrawerTab, pushToast } = useDispatcher();
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const recommendations = useMemo(
    () => rankCarriersForShipment(shipment, carriers).filter((r) => !rejectedIds.includes(r.carrier.id)),
    [shipment, carriers, rejectedIds],
  );

  if (shipment.assignedCarrier) {
    const carrier = shipment.assignedCarrier;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-electric/20 bg-electric/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-electric">Assigned Carrier</p>
          <p className="mt-1 text-base font-semibold text-navy">{carrier.name}</p>
          <p className="text-sm text-slate-500">{carrier.onTimePercent}% on-time · {carrier.distanceKm} km away</p>
          {shipment.assignedDriver && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm">
              <UserRound className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-navy">{shipment.assignedDriver.name}</span>
              <span className="text-slate-400">· {shipment.assignedDriver.vehicle.label}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setDrawerTab("communication")}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-navy hover:bg-slate-50"
        >
          <MessageSquare className="h-4 w-4" /> Message Carrier
        </button>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <EmptyState
        icon={UserRound}
        title="No carrier recommendations"
        description="All nearby carriers were rejected. Broaden the search radius or check back shortly."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Ranked by distance, capacity match, and historical performance.</p>
      {recommendations.map((rec) => {
        const isAssigning = assigningId === rec.carrier.id;
        return (
          <div key={rec.carrier.id} className="rounded-2xl border border-slate-200 p-4 transition-shadow hover:shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-xs font-bold text-white">
                    {rec.carrier.logoInitial}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-navy">{rec.carrier.name}</p>
                    <StarRating score={rec.score} />
                  </div>
                </div>
              </div>
              {rec.carrier.whiteGloveCertified && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                  <ShieldCheck className="h-3 w-3" /> White Glove
                </span>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {rec.factors.slice(0, 4).map((f) => (
                <span key={f.label}>
                  <span className="text-slate-400">{f.label}:</span> <span className="font-medium text-slate-600">{f.value}</span>
                </span>
              ))}
            </div>

            <p className="mt-2.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{rec.reason}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                disabled={isAssigning}
                onClick={() => {
                  setAssigningId(rec.carrier.id);
                  window.setTimeout(() => {
                    assignCarrier(shipment.id, rec.carrier.id);
                    setAssigningId(null);
                  }, 500);
                }}
                className="rounded-lg bg-electric px-3 py-1.5 text-xs font-semibold text-white hover:bg-electric-light disabled:opacity-60"
              >
                {isAssigning ? "Assigning…" : "Assign"}
              </button>
              <button
                onClick={() => pushToast(`Calling ${rec.carrier.name}…`, "info")}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
              >
                <Phone className="h-3.5 w-3.5" /> Call
              </button>
              <button
                onClick={() => pushToast(`Message sent to ${rec.carrier.name}.`, "success")}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Message
              </button>
              <button
                onClick={() => setRejectedIds((ids) => [...ids, rec.carrier.id])}
                className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
