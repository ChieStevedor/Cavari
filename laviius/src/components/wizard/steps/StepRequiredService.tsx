"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Zap } from "lucide-react";
import type { Priority, ShipmentFormValues } from "@/types/shipment";
import { PRIORITY_OPTIONS } from "@/lib/shipment/constants";
import { SectionCard } from "@/components/ui/SectionCard";
import { RadioCardGroup, type RadioCardOption } from "@/components/ui/RadioCardGroup";
import { VehicleSelector } from "@/components/wizard/VehicleSelector";
import { ServiceSelector } from "@/components/wizard/ServiceSelector";

const priorityOptions: RadioCardOption<Priority>[] = PRIORITY_OPTIONS.map((p) => ({
  value: p.value,
  label: p.label,
  helper: p.helper,
  icon: <Zap className="h-5 w-5" />,
}));

export function StepRequiredService() {
  const { control } = useFormContext<ShipmentFormValues>();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Required Service</h1>
        <p className="mt-1 text-sm text-slate-500">Pick the truck, add-on services, and how soon you need it.</p>
      </div>
      <VehicleSelector />
      <ServiceSelector />
      <SectionCard icon={<Zap className="h-4.5 w-4.5" />} title="Priority">
        <Controller
          name="service.priority"
          control={control}
          render={({ field }) => (
            <RadioCardGroup name="priority" options={priorityOptions} value={field.value} onChange={field.onChange} columns={3} />
          )}
        />
      </SectionCard>
    </div>
  );
}
