import { History } from "lucide-react";
import type { Shipment } from "@/types/dispatcher";
import { EmptyState } from "@/components/dispatcher/shared/EmptyState";
import { formatClockTime } from "@/lib/dispatcher/time";

const SOURCE_LABEL: Record<Shipment["timeline"][number]["source"], string> = {
  system: "System",
  dispatcher: "Dispatcher",
  carrier: "Carrier",
  driver: "Driver",
  customer: "Customer",
};

export function TimelineTab({ shipment }: { shipment: Shipment }) {
  if (shipment.timeline.length === 0) {
    return (
      <EmptyState icon={History} title="No activity yet" description="Timeline events will appear here as this shipment moves through dispatch." />
    );
  }

  return (
    <ol className="relative space-y-5 pl-5">
      <div className="absolute bottom-2 left-[3px] top-2 w-px bg-slate-200" aria-hidden />
      {shipment.timeline.map((event) => (
        <li key={event.id} className="relative">
          <span className="absolute -left-5 top-1 h-2 w-2 rounded-full bg-electric ring-4 ring-white" aria-hidden />
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-navy">{event.label}</p>
            <time className="shrink-0 text-xs text-slate-400">{formatClockTime(event.timestamp)}</time>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {event.actorName} · {SOURCE_LABEL[event.source]}
            {event.actorRole && event.actorRole !== SOURCE_LABEL[event.source] ? ` (${event.actorRole})` : ""}
          </p>
          {event.notes && <p className="mt-1 text-sm text-slate-600">{event.notes}</p>}
        </li>
      ))}
    </ol>
  );
}
