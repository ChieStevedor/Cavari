"use client";

import { useMemo, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Sparkles, Wrench } from "lucide-react";
import type { ServiceType, ShipmentFormValues } from "@/types/shipment";
import { SERVICE_OPTIONS } from "@/lib/shipment/constants";
import { resolveVisibility, vehicleMeetsServiceRequirement } from "@/lib/shipment/rules";
import { SectionCard } from "@/components/ui/SectionCard";
import { CheckboxChip } from "@/components/ui/CheckboxChip";

export function ServiceSelector() {
  const { control } = useFormContext<ShipmentFormValues>();
  const values = useWatch<ShipmentFormValues>({ control }) as ShipmentFormValues | undefined;
  const [showMore, setShowMore] = useState(false);

  const { recommendedIds, availableOptions } = useMemo(() => {
    if (!values) return { recommendedIds: new Set<ServiceType>(), availableOptions: SERVICE_OPTIONS };
    const { visible } = resolveVisibility(values);
    const recommended = new Set<ServiceType>();
    SERVICE_OPTIONS.forEach((opt) => {
      const key = `service.${opt.value}`;
      if ([...visible].some((v) => v === key)) recommended.add(opt.value);
    });
    const available = SERVICE_OPTIONS.filter((opt) =>
      vehicleMeetsServiceRequirement(values.service.vehicle, opt.minVehicle),
    );
    return { recommendedIds: recommended, availableOptions: available };
  }, [values]);

  const recommended = availableOptions.filter((o) => recommendedIds.has(o.value));
  const rest = availableOptions.filter((o) => !recommendedIds.has(o.value));

  return (
    <SectionCard icon={<Wrench className="h-4.5 w-4.5" />} title="Services" description="Add anything the carrier needs to know about handling.">
      <Controller
        name="service.services"
        control={control}
        render={({ field }) => {
          const toggle = (value: ServiceType) => {
            const set = new Set(field.value);
            if (set.has(value)) {
              set.delete(value);
            } else {
              set.add(value);
            }
            field.onChange([...set]);
          };

          return (
            <div className="flex flex-col gap-4">
              {recommended.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-electric">
                    <Sparkles className="h-3.5 w-3.5" /> Recommended for This Cargo
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recommended.map((opt) => (
                      <CheckboxChip
                        key={opt.value}
                        label={opt.label}
                        checked={field.value.includes(opt.value)}
                        onChange={() => toggle(opt.value)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {rest.length > 0 && (
                <div>
                  {recommended.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowMore((v) => !v)}
                      className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600"
                    >
                      More Services
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showMore ? "rotate-180" : ""}`} />
                    </button>
                  )}
                  <AnimatePresence initial={false}>
                    {(showMore || recommended.length === 0) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-2">
                          {rest.map((opt) => (
                            <CheckboxChip
                              key={opt.value}
                              label={opt.label}
                              checked={field.value.includes(opt.value)}
                              onChange={() => toggle(opt.value)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          );
        }}
      />
    </SectionCard>
  );
}
