import { cn } from "@/lib/cn";
import { PRIORITY_META } from "@/lib/dispatcher/status";
import type { ShipmentPriority } from "@/types/dispatcher";

export function PriorityBadge({ priority, className }: { priority: ShipmentPriority; className?: string }) {
  if (priority === "standard") return null;
  const meta = PRIORITY_META[priority];
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", meta.badgeClass, className)}>
      {meta.label}
    </span>
  );
}
