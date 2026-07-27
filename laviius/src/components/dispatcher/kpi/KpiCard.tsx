import { ArrowDown, ArrowUp } from "lucide-react";
import type { KpiMetric } from "@/types/dispatcher";
import { cn } from "@/lib/cn";

export function KpiCard({ metric }: { metric: KpiMetric }) {
  const isGood =
    metric.deltaDirection && metric.goodDirection ? metric.deltaDirection === metric.goodDirection : undefined;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <p className="truncate text-xs font-medium text-slate-500">{metric.label}</p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-xl font-semibold tracking-tight text-navy">{metric.value}</span>
        {metric.delta !== undefined && metric.deltaDirection && metric.deltaDirection !== "flat" && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold",
              isGood === undefined ? "text-slate-400" : isGood ? "text-emerald-600" : "text-red-500",
            )}
          >
            {metric.deltaDirection === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(metric.delta)}
            {metric.format === "percent" ? "pt" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
