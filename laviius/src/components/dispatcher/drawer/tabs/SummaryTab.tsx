"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { StickyNote } from "lucide-react";
import type { Shipment } from "@/types/dispatcher";
import { useDispatcher } from "@/lib/dispatcher/store";
import { DetailRow, DetailSection } from "../DetailSection";
import { CARGO_TYPE_LABELS, SERVICE_TYPE_LABELS, VEHICLE_TYPE_LABELS } from "@/lib/dispatcher/labels";
import { BILLING_META } from "@/lib/dispatcher/status";
import { formatClockTime, formatMoney } from "@/lib/dispatcher/time";
import { cn } from "@/lib/cn";

const noteSchema = z.object({
  note: z.string().trim().min(1, "Write a note before saving.").max(500, "Keep notes under 500 characters."),
});
type NoteFormValues = z.infer<typeof noteSchema>;

export function SummaryTab({ shipment }: { shipment: Shipment }) {
  const { addNote, pushToast } = useDispatcher();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormValues>({ resolver: zodResolver(noteSchema), defaultValues: { note: "" } });

  function onSubmit(values: NoteFormValues) {
    addNote(shipment.id, values.note);
    reset();
    pushToast("Note added to shipment.", "success");
  }

  return (
    <div className="space-y-6">
      <DetailSection title="Customer">
        <DetailRow label="Company" value={shipment.customer.companyName} />
        <DetailRow label="Contact" value={shipment.customer.name} />
        <DetailRow label="Phone" value={shipment.customer.phone} />
        <DetailRow label="Tier" value={<span className="capitalize">{shipment.customer.tier}</span>} />
      </DetailSection>

      <DetailSection title="Pickup">
        <DetailRow label="Contact" value={`${shipment.pickup.contact.contactName} · ${shipment.pickup.contact.companyName}`} />
        <DetailRow label="Phone" value={shipment.pickup.contact.phone} />
        <DetailRow label="Address" value={`${shipment.pickup.address.line1}, ${shipment.pickup.address.city}`} />
        <DetailRow label="Scheduled" value={formatClockTime(shipment.pickup.scheduledFor)} />
        {shipment.pickup.notes && <DetailRow label="Notes" value={shipment.pickup.notes} />}
      </DetailSection>

      <DetailSection title="Delivery">
        <DetailRow label="Contact" value={`${shipment.delivery.contact.contactName} · ${shipment.delivery.contact.companyName}`} />
        <DetailRow label="Phone" value={shipment.delivery.contact.phone} />
        <DetailRow label="Address" value={`${shipment.delivery.address.line1}, ${shipment.delivery.address.city}`} />
        <DetailRow label="Scheduled" value={formatClockTime(shipment.delivery.scheduledFor)} />
        {shipment.delivery.notes && <DetailRow label="Notes" value={shipment.delivery.notes} />}
      </DetailSection>

      <DetailSection title="Cargo">
        <DetailRow label="Type" value={CARGO_TYPE_LABELS[shipment.cargo.cargoType]} />
        <DetailRow label="Quantity" value={shipment.cargo.quantity} />
        <DetailRow label="Weight" value={`${shipment.cargo.weightLbs.toLocaleString()} lbs`} />
        <DetailRow
          label="Dimensions"
          value={`${shipment.cargo.dimensions.length}×${shipment.cargo.dimensions.width}×${shipment.cargo.dimensions.height} ${shipment.cargo.dimensions.unit}`}
        />
        <DetailRow label="Declared Value" value={formatMoney(shipment.cargo.declaredValueUsd)} />
        <DetailRow label="Requested Vehicle" value={VEHICLE_TYPE_LABELS[shipment.requestedVehicle]} />
      </DetailSection>

      {shipment.requestedServices.length > 0 && (
        <DetailSection title="Requested Services">
          <div className="flex flex-wrap gap-1.5">
            {shipment.requestedServices.map((service) => (
              <span key={service} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {SERVICE_TYPE_LABELS[service]}
              </span>
            ))}
          </div>
        </DetailSection>
      )}

      <DetailSection title="Billing">
        <span className={cn("inline-flex rounded-md px-2.5 py-1 text-xs font-semibold", BILLING_META[shipment.billingStatus].badgeClass)}>
          {BILLING_META[shipment.billingStatus].label}
        </span>
      </DetailSection>

      <DetailSection title="Internal Notes">
        <div className="space-y-2">
          {shipment.internalNotes.length === 0 && <p className="text-sm text-slate-400">No internal notes yet.</p>}
          {shipment.internalNotes.map((note, i) => (
            <div key={i} className="flex gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-navy">
              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              {note}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-2 pt-1">
          <div className="flex-1">
            <textarea
              {...register("note")}
              rows={2}
              placeholder="Add an internal note (not visible to customer)…"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy placeholder:text-slate-400 focus:border-electric focus:outline-none focus:ring-1 focus:ring-electric"
            />
            {errors.note && <p className="mt-1 text-xs text-red-600">{errors.note.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-9 shrink-0 rounded-lg bg-navy px-3.5 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50"
          >
            Save
          </button>
        </form>
      </DetailSection>
    </div>
  );
}
