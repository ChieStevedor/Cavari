"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import { CalendarClock, MapPinned } from "lucide-react";
import type { ShipmentFormValues } from "@/types/shipment";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { Toggle } from "@/components/ui/Toggle";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { AdaptiveFieldGroup } from "./AdaptiveFieldGroup";
import { isFieldVisible } from "@/lib/shipment/rules";

interface AddressCardProps {
  prefix: "pickup" | "delivery";
  showLoadingDock?: boolean;
}

export function AddressCard({ prefix, showLoadingDock }: AddressCardProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ShipmentFormValues>();
  const values = useWatch<ShipmentFormValues>({ control });
  const sectionErrors = errors[prefix];
  const schedulingVisible = values
    ? isFieldVisible(values as ShipmentFormValues, `${prefix}.scheduling`)
    : true;

  return (
    <SectionCard
      icon={<MapPinned className="h-4.5 w-4.5" />}
      title={prefix === "pickup" ? "Pickup Address" : "Delivery Address"}
      description={
        prefix === "pickup"
          ? "Where the carrier collects the shipment."
          : "Where the carrier drops off the shipment."
      }
    >
      <Controller
        name={`${prefix}.address`}
        control={control}
        render={({ field }) => (
          <AddressAutocomplete
            label="Street Address"
            name={`${prefix}.address`}
            value={field.value}
            onChange={field.onChange}
            error={sectionErrors?.address?.formatted?.message as string | undefined}
          />
        )}
      />

      <AdaptiveFieldGroup visible={schedulingVisible}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label={prefix === "pickup" ? "Pickup Date" : "Delivery Date"}
            type="date"
            leadingIcon={<CalendarClock className="h-4 w-4" />}
            error={sectionErrors?.date?.message as string | undefined}
            {...register(`${prefix}.date`)}
            required
          />
          <TextField
            label={prefix === "pickup" ? "Pickup Time" : "Delivery Time"}
            type="time"
            error={sectionErrors?.time?.message as string | undefined}
            {...register(`${prefix}.time`)}
            required
          />
        </div>
      </AdaptiveFieldGroup>

      {!schedulingVisible && (
        <p className="mt-4 rounded-lg bg-electric/5 px-3.5 py-2.5 text-sm font-medium text-electric">
          ASAP selected — we&apos;ll request the earliest available window automatically.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {showLoadingDock && (
          <Controller
            name="pickup.loadingDockAvailable"
            control={control}
            render={({ field }) => (
              <Toggle
                label="Loading Dock Available?"
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        )}
        <Controller
          name={`${prefix}.appointmentRequired`}
          control={control}
          render={({ field }) => (
            <Toggle label="Appointment Required?" checked={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      <TextAreaField
        label={prefix === "pickup" ? "Pickup Notes" : "Delivery Notes"}
        placeholder="Gate codes, contact instructions, anything the driver should know…"
        containerClassName="mt-4"
        {...register(`${prefix}.notes`)}
      />
    </SectionCard>
  );
}
