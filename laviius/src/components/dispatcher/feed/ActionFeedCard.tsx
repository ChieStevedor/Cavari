"use client";

import { motion } from "framer-motion";
import { Eye, MessageSquare, Phone, Receipt, UserPlus, X } from "lucide-react";
import type { ActionButtonKind, ActionFeedItem, Shipment } from "@/types/dispatcher";
import { useDispatcher } from "@/lib/dispatcher/store";
import { SEVERITY_META } from "@/lib/dispatcher/status";
import { formatRelativeTime } from "@/lib/dispatcher/time";
import { cn } from "@/lib/cn";

const ACTION_META: Record<ActionButtonKind, { label: string; icon: typeof Eye }> = {
  assign_carrier: { label: "Assign Carrier", icon: UserPlus },
  open_shipment: { label: "Open Shipment", icon: Eye },
  call_customer: { label: "Call Customer", icon: Phone },
  message_carrier: { label: "Message Carrier", icon: MessageSquare },
  generate_invoice: { label: "Generate Invoice", icon: Receipt },
  dismiss: { label: "Dismiss", icon: X },
};

export function ActionFeedCard({ item, shipment }: { item: ActionFeedItem; shipment?: Shipment }) {
  const { openShipment, dismissFeedItem, generateInvoice, pushToast } = useDispatcher();
  const meta = SEVERITY_META[item.severity];

  function handleAction(kind: ActionButtonKind) {
    switch (kind) {
      case "assign_carrier":
        openShipment(item.shipmentId, "carrier");
        break;
      case "open_shipment":
        openShipment(item.shipmentId);
        break;
      case "message_carrier":
        openShipment(item.shipmentId, "communication");
        break;
      case "call_customer":
        pushToast(shipment ? `Calling ${shipment.customer.name} at ${shipment.customer.phone}…` : "Calling customer…", "info");
        break;
      case "generate_invoice":
        generateInvoice(item.shipmentId);
        break;
      case "dismiss":
        dismissFeedItem(item.id);
        break;
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 ring-1 ring-transparent sm:flex-row sm:items-center", meta.ring)}
    >
      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", meta.dot)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-navy">{item.title}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {item.detail} · {formatRelativeTime(item.occurredAt)} ago
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-1.5">
        {item.actions.map((kind) => {
          const a = ACTION_META[kind];
          const Icon = a.icon;
          const isPrimary = kind !== "dismiss" && kind !== "open_shipment";
          return (
            <button
              key={kind}
              onClick={() => handleAction(kind)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                isPrimary
                  ? "bg-navy text-white hover:bg-navy-light"
                  : kind === "dismiss"
                    ? "text-slate-400 hover:bg-slate-100 hover:text-navy"
                    : "border border-slate-200 text-navy hover:bg-slate-50",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {a.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
