"use client";

import { Loader2, Send } from "lucide-react";
import type { ShipmentFormValues, WizardStepId } from "@/types/shipment";
import { CARGO_TYPE_OPTIONS, PRIORITY_OPTIONS, SERVICE_OPTIONS, VEHICLE_OPTIONS } from "@/lib/shipment/constants";
import { Button } from "@/components/ui/Button";
import { ReviewCard } from "@/components/wizard/ReviewCard";
import { TimelineSummary } from "@/components/wizard/TimelineSummary";
import { PriceEstimate } from "@/components/wizard/PriceEstimate";

interface StepReviewProps {
  values: ShipmentFormValues;
  onEditStep: (id: WizardStepId) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function StepReview({ values, onEditStep, onSubmit, isSubmitting }: StepReviewProps) {
  const cargoLabel = CARGO_TYPE_OPTIONS.find((c) => c.value === values.cargo.cargoType)?.label;
  const vehicleLabel = VEHICLE_OPTIONS.find((v) => v.value === values.service.vehicle)?.label;
  const priorityLabel = PRIORITY_OPTIONS.find((p) => p.value === values.service.priority)?.label;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Review Your Request</h1>
        <p className="mt-1 text-sm text-slate-500">Take one last look — you can edit any section below.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <TimelineSummary values={values} />
      </div>

      <ReviewCard title="Pickup" onEdit={() => onEditStep("pickup")}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Row label="Company" value={values.pickup.companyName} />
          <Row label="Contact" value={`${values.pickup.contactName} · ${values.pickup.phone}`} />
          <Row label="Email" value={values.pickup.email} />
          <Row label="Loading Dock" value={values.pickup.loadingDockAvailable ? "Available" : "Not available"} />
          <Row label="Appointment" value={values.pickup.appointmentRequired ? "Required" : "Not required"} />
          {values.pickup.notes && <Row label="Notes" value={values.pickup.notes} full />}
        </dl>
      </ReviewCard>

      <ReviewCard title="Delivery" onEdit={() => onEditStep("delivery")}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Row label="Company" value={values.delivery.companyName} />
          <Row label="Contact" value={`${values.delivery.contactName} · ${values.delivery.phone}`} />
          <Row label="Appointment" value={values.delivery.appointmentRequired ? "Required" : "Not required"} />
          {values.delivery.notes && <Row label="Notes" value={values.delivery.notes} full />}
        </dl>
      </ReviewCard>

      <ReviewCard title="Vehicle & Services" onEdit={() => onEditStep("service")}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Row label="Vehicle" value={vehicleLabel} />
          <Row label="Priority" value={priorityLabel} />
          <Row
            label="Services"
            value={
              values.service.services.length > 0
                ? values.service.services.map((s) => SERVICE_OPTIONS.find((o) => o.value === s)?.label).join(", ")
                : "None"
            }
            full
          />
        </dl>
      </ReviewCard>

      <ReviewCard title="Cargo" onEdit={() => onEditStep("shipment")}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Row label="Cargo Type" value={cargoLabel} />
          <Row label="Quantity" value={values.cargo.quantity} />
          <Row label="Weight" value={values.cargo.weight ? `${values.cargo.weight} lbs` : undefined} />
          <Row
            label="Dimensions"
            value={
              values.cargo.dimensions.length
                ? `${values.cargo.dimensions.length} × ${values.cargo.dimensions.width} × ${values.cargo.dimensions.height} ${values.cargo.dimensions.unit}`
                : undefined
            }
          />
          <Row label="Declared Value" value={values.cargo.declaredValue ? `$${values.cargo.declaredValue}` : undefined} />
          <Row label="Attachments" value={`${values.cargo.photos.length} photo(s), ${values.cargo.documents.length} document(s)`} />
        </dl>
      </ReviewCard>

      <PriceEstimate values={values} />

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={onSubmit}
        type="button"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Submit Delivery Request
          </>
        )}
      </Button>
    </div>
  );
}

function Row({ label, value, full }: { label: string; value?: string; full?: boolean }) {
  if (!value) return null;
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-medium text-navy">{value}</dd>
    </div>
  );
}
