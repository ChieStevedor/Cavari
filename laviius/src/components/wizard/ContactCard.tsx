"use client";

import { useFormContext } from "react-hook-form";
import { Building2, Mail, Phone, User } from "lucide-react";
import type { ShipmentFormValues } from "@/types/shipment";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";

interface ContactCardProps {
  prefix: "pickup" | "delivery";
  showEmail?: boolean;
}

export function ContactCard({ prefix, showEmail }: ContactCardProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ShipmentFormValues>();

  const sectionErrors = errors[prefix];

  return (
    <SectionCard
      icon={<Building2 className="h-4.5 w-4.5" />}
      title="Contact Information"
      description={prefix === "pickup" ? "Who the carrier should coordinate pickup with." : "Who the carrier should coordinate delivery with."}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Company Name"
          leadingIcon={<Building2 className="h-4 w-4" />}
          error={sectionErrors?.companyName?.message as string | undefined}
          {...register(`${prefix}.companyName`)}
          required
        />
        <TextField
          label="Contact Name"
          leadingIcon={<User className="h-4 w-4" />}
          error={sectionErrors?.contactName?.message as string | undefined}
          {...register(`${prefix}.contactName`)}
          required
        />
        <TextField
          label="Phone"
          type="tel"
          leadingIcon={<Phone className="h-4 w-4" />}
          error={sectionErrors?.phone?.message as string | undefined}
          {...register(`${prefix}.phone`)}
          required
        />
        {showEmail && (
          <TextField
            label="Email"
            type="email"
            leadingIcon={<Mail className="h-4 w-4" />}
            error={
              (errors.pickup as { email?: { message?: string } } | undefined)?.email?.message
            }
            {...register("pickup.email")}
            required
          />
        )}
      </div>
    </SectionCard>
  );
}
