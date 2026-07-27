"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pin, PinOff, X } from "lucide-react";
import { useDispatcher, type DrawerTab } from "@/lib/dispatcher/store";
import { StatusBadge } from "@/components/dispatcher/shared/StatusBadge";
import { PriorityBadge } from "@/components/dispatcher/shared/PriorityBadge";
import { SummaryTab } from "./tabs/SummaryTab";
import { TimelineTab } from "./tabs/TimelineTab";
import { CarrierTab } from "./tabs/CarrierTab";
import { CommunicationTab } from "./tabs/CommunicationTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { cn } from "@/lib/cn";

const TABS: { id: DrawerTab; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "timeline", label: "Timeline" },
  { id: "carrier", label: "Carrier" },
  { id: "communication", label: "Messages" },
  { id: "documents", label: "Documents" },
];

export function ShipmentDrawer() {
  const { selectedShipment, closeDrawer, drawerTab, setDrawerTab, pinnedIds, togglePin } = useDispatcher();
  const open = Boolean(selectedShipment);
  const isPinned = selectedShipment ? pinnedIds.includes(selectedShipment.id) : false;

  return (
    <AnimatePresence>
      {open && selectedShipment && (
        <>
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-navy/30 backdrop-blur-[1px]"
            onClick={closeDrawer}
          />
          <motion.aside
            key="drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Shipment ${selectedShipment.number} details`}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-navy">Shipment #{selectedShipment.number}</h2>
                  <PriorityBadge priority={selectedShipment.priority} />
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <StatusBadge status={selectedShipment.status} />
                  <span className="text-xs text-slate-400">{selectedShipment.referenceNumber}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => togglePin(selectedShipment.id)}
                  aria-label={isPinned ? "Unpin shipment" : "Pin shipment"}
                  aria-pressed={isPinned}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100",
                    isPinned ? "text-electric" : "text-slate-400",
                  )}
                >
                  {isPinned ? <Pin className="h-4 w-4 fill-current" /> : <PinOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={closeDrawer}
                  aria-label="Close shipment details"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-navy"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div role="tablist" aria-label="Shipment details sections" className="flex gap-1 overflow-x-auto border-b border-slate-100 px-3 pt-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={drawerTab === tab.id}
                  onClick={() => setDrawerTab(tab.id)}
                  className={cn(
                    "relative shrink-0 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors",
                    drawerTab === tab.id ? "text-electric" : "text-slate-500 hover:text-navy",
                  )}
                >
                  {tab.label}
                  {drawerTab === tab.id && (
                    <motion.span layoutId="drawer-tab-indicator" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-electric" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {drawerTab === "summary" && <SummaryTab shipment={selectedShipment} />}
              {drawerTab === "timeline" && <TimelineTab shipment={selectedShipment} />}
              {drawerTab === "carrier" && <CarrierTab shipment={selectedShipment} />}
              {drawerTab === "communication" && <CommunicationTab shipment={selectedShipment} />}
              {drawerTab === "documents" && <DocumentsTab shipment={selectedShipment} />}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
