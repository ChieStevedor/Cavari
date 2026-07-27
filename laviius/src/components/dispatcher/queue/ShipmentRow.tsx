"use client";

import { forwardRef } from "react";
import { MessageSquare, Pin, UserPlus } from "lucide-react";
import type { Shipment } from "@/types/dispatcher";
import { cn } from "@/lib/cn";
import type { QueueColumn } from "./columns";

interface ShipmentRowProps {
  shipment: Shipment;
  columns: QueueColumn[];
  gridTemplateColumns: string;
  selected: boolean;
  focused: boolean;
  pinned: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  onTogglePin: () => void;
  onQuickAction: () => void;
  style?: React.CSSProperties;
}

export const ShipmentRow = forwardRef<HTMLDivElement, ShipmentRowProps>(function ShipmentRow(
  { shipment, columns, gridTemplateColumns, selected, focused, pinned, onToggleSelect, onOpen, onTogglePin, onQuickAction, style },
  ref,
) {
  return (
    <div
      ref={ref}
      style={{ ...style, gridTemplateColumns }}
      role="row"
      aria-selected={selected}
      tabIndex={focused ? 0 : -1}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
        if (e.key === " ") {
          e.preventDefault();
          onToggleSelect();
        }
      }}
      className={cn(
        "grid cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-xs outline-none transition-colors hover:bg-slate-50",
        selected && "bg-electric/5",
        focused && "ring-1 ring-inset ring-electric/40",
        shipment.status === "delayed" && "bg-red-50/40",
      )}
    >
      <span onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Select shipment #${shipment.number}`}
          className="h-3.5 w-3.5 rounded border-slate-300 text-electric focus:ring-electric"
        />
        <button
          onClick={onTogglePin}
          aria-label={pinned ? "Unpin shipment" : "Pin shipment"}
          aria-pressed={pinned}
          className={cn("shrink-0", pinned ? "text-electric" : "text-slate-300 hover:text-slate-500")}
        >
          <Pin className={cn("h-3.5 w-3.5", pinned && "fill-current")} />
        </button>
      </span>
      {columns.map((col) => (
        <div key={col.id} className="min-w-0 truncate">
          {col.render(shipment)}
        </div>
      ))}
      <span onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onQuickAction}
          aria-label={shipment.status === "waiting_assignment" ? "Assign carrier" : "Message carrier"}
          title={shipment.status === "waiting_assignment" ? "Assign carrier" : "Message carrier"}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-navy"
        >
          {shipment.status === "waiting_assignment" ? <UserPlus className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
        </button>
      </span>
    </div>
  );
});
