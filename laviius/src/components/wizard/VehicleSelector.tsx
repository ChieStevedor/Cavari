"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Truck } from "lucide-react";
import type { ShipmentFormValues } from "@/types/shipment";
import { VEHICLE_OPTIONS } from "@/lib/shipment/constants";
import { SectionCard } from "@/components/ui/SectionCard";
import { RadioCardGroup, type RadioCardOption } from "@/components/ui/RadioCardGroup";
import type { VehicleType } from "@/types/shipment";

const vehicleOptions: RadioCardOption<VehicleType>[] = VEHICLE_OPTIONS.map((v) => ({
  value: v.value,
  label: v.label,
  helper: v.helper,
  icon: <Truck className="h-5 w-5" />,
}));

export function VehicleSelector() {
  const {
    control,
    formState: { errors },
  } = useFormContext<ShipmentFormValues>();

  return (
    <SectionCard icon={<Truck className="h-4.5 w-4.5" />} title="Vehicle" description="Choose the truck that fits your shipment.">
      <Controller
        name="service.vehicle"
        control={control}
        render={({ field }) => (
          <RadioCardGroup
            name="vehicle"
            options={vehicleOptions}
            value={field.value}
            onChange={field.onChange}
            columns={3}
            error={errors.service?.vehicle?.message as string | undefined}
          />
        )}
      />
    </SectionCard>
  );
}
