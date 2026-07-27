"use client";

import { motion } from "framer-motion";
import { ArrowRight, Star, Trash2, Zap } from "lucide-react";
import type { ShipmentTemplate } from "@/types/shipment";
import { Button } from "@/components/ui/Button";

interface TemplateSelectorProps {
  templates: ShipmentTemplate[];
  onUseTemplate: (template: ShipmentTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onStartNew: () => void;
}

export function TemplateSelector({
  templates,
  onUseTemplate,
  onDeleteTemplate,
  onStartNew,
}: TemplateSelectorProps) {
  if (templates.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-2xl"
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-electric">
          <Zap className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wide">Quick Start</span>
        </div>
        <h2 className="mt-2 text-xl font-bold text-navy">Book from a saved template</h2>
        <p className="mt-1 text-sm text-slate-500">
          Skip straight to review — everything is pre-filled from your last booking.
        </p>

        <ul className="mt-5 flex flex-col gap-2.5">
          {templates.map((t) => (
            <li key={t.id}>
              <div className="group flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition-colors hover:border-electric hover:bg-electric/5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Star className="h-4 w-4" fill="currentColor" />
                </span>
                <button
                  type="button"
                  onClick={() => onUseTemplate(t)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-semibold text-navy">{t.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {t.values.pickup.address.city || "Pickup"} → {t.values.delivery.address.city || "Delivery"}
                  </p>
                </button>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-electric" />
                <button
                  type="button"
                  aria-label={`Delete template ${t.name}`}
                  onClick={() => onDeleteTemplate(t.id)}
                  className="shrink-0 rounded-md p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <Button variant="ghost" size="md" className="mt-5 w-full" onClick={onStartNew}>
          Start a New Booking Instead
        </Button>
      </div>
    </motion.div>
  );
}
