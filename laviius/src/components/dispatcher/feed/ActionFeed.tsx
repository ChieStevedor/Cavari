"use client";

import { AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useDispatcher } from "@/lib/dispatcher/store";
import { severityRank } from "@/lib/dispatcher/status";
import { EmptyState } from "@/components/dispatcher/shared/EmptyState";
import { ActionFeedCard } from "./ActionFeedCard";

export function ActionFeed() {
  const { actionFeed, shipments } = useDispatcher();

  const sorted = [...actionFeed].sort((a, b) => {
    const rankDiff = severityRank(a.severity) - severityRank(b.severity);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
  });

  return (
    <section aria-label="Action feed">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-navy">What needs your attention</h2>
        {sorted.length > 0 && <span className="text-xs text-slate-400">{sorted.length} item{sorted.length === 1 ? "" : "s"}</span>}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="You're all caught up"
          description="Nothing needs attention right now. New items will surface here the moment they do."
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {sorted.map((item) => (
              <ActionFeedCard key={item.id} item={item} shipment={shipments.find((s) => s.id === item.shipmentId)} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
