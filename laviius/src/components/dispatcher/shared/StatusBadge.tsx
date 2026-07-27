import { cn } from "@/lib/cn";
import { STATUS_META } from "@/lib/dispatcher/status";
import type { ShipmentStatus } from "@/types/dispatcher";

export function StatusBadge({ status, className }: { status: ShipmentStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        meta.badgeClass,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  );
}
