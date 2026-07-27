"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useDispatcher } from "@/lib/dispatcher/store";
import { SEVERITY_META } from "@/lib/dispatcher/status";
import { formatRelativeTime } from "@/lib/dispatcher/time";
import { EmptyState } from "@/components/dispatcher/shared/EmptyState";
import { cn } from "@/lib/cn";

export function AlertCenter() {
  const { alerts, markAlertsRead, dismissAlert, openShipment } = useDispatcher();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = alerts.filter((a) => !a.read).length;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Alerts${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-navy"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 z-50 mt-2 w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-navy/10"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-navy">Alert Center</p>
              {unreadCount > 0 && (
                <button onClick={markAlertsRead} className="text-xs font-medium text-electric hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="All clear"
                  description="No operational risks right now. New alerts will appear here."
                  className="border-none py-8"
                />
              ) : (
                alerts.map((alert) => {
                  const meta = SEVERITY_META[alert.severity];
                  return (
                    <div
                      key={alert.id}
                      className={cn("group flex items-start gap-3 border-b border-slate-50 px-4 py-3 last:border-0 hover:bg-slate-50", !alert.read && "bg-blue-50/30")}
                    >
                      <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", meta.dot)} aria-hidden />
                      <button
                        className="min-w-0 flex-1 text-left"
                        onClick={() => {
                          if (alert.shipmentId) openShipment(alert.shipmentId);
                          setOpen(false);
                        }}
                      >
                        <p className="text-sm text-navy">{alert.message}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{formatRelativeTime(alert.createdAt)} ago</p>
                      </button>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Dismiss alert"
                      >
                        <X className="h-3.5 w-3.5 text-slate-400 hover:text-navy" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
