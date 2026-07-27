"use client";

import { useDispatcher } from "@/lib/dispatcher/store";
import { KpiCard } from "./KpiCard";

export function KpiRow() {
  const { kpis } = useDispatcher();

  return (
    <section aria-label="Key performance indicators" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {kpis.map((metric) => (
        <KpiCard key={metric.id} metric={metric} />
      ))}
    </section>
  );
}
