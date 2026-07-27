"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";
import {
  Boxes,
  Cog,
  Cpu,
  HardHat,
  MoreHorizontal,
  Package,
  Refrigerator,
  Ruler,
  Scale,
  Sofa,
} from "lucide-react";
import type { CargoType, ShipmentFormValues } from "@/types/shipment";
import { CARGO_TYPE_OPTIONS } from "@/lib/shipment/constants";
import { isFieldVisible } from "@/lib/shipment/rules";
import { SectionCard } from "@/components/ui/SectionCard";
import { TextField } from "@/components/ui/TextField";
import { RadioCardGroup, type RadioCardOption } from "@/components/ui/RadioCardGroup";
import { Toggle } from "@/components/ui/Toggle";
import { AdaptiveFieldGroup } from "./AdaptiveFieldGroup";
import { UploadZone } from "./UploadZone";

const CARGO_ICONS: Record<CargoType, React.ReactNode> = {
  pallets: <Package className="h-5 w-5" />,
  furniture: <Sofa className="h-5 w-5" />,
  appliances: <Refrigerator className="h-5 w-5" />,
  crates: <Boxes className="h-5 w-5" />,
  electronics: <Cpu className="h-5 w-5" />,
  construction_materials: <HardHat className="h-5 w-5" />,
  machinery: <Cog className="h-5 w-5" />,
  other: <MoreHorizontal className="h-5 w-5" />,
};

const cargoOptions: RadioCardOption<CargoType>[] = CARGO_TYPE_OPTIONS.map((opt) => ({
  ...opt,
  icon: CARGO_ICONS[opt.value],
}));

export function CargoCard() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ShipmentFormValues>();
  const values = useWatch<ShipmentFormValues>({ control });
  const v = values as ShipmentFormValues | undefined;
  const cargoErrors = errors.cargo;

  const palletVisible = v ? isFieldVisible(v, "cargo.pallet.palletCount") : false;
  const furnitureVisible = v ? isFieldVisible(v, "cargo.furniture.roomOfChoice") : false;
  const applianceVisible = v ? isFieldVisible(v, "cargo.appliance.disconnectOld") : false;

  return (
    <>
      <SectionCard icon={<Package className="h-4.5 w-4.5" />} title="Cargo Type" description="This determines which fields and services we show next.">
        <Controller
          name="cargo.cargoType"
          control={control}
          render={({ field }) => (
            <RadioCardGroup
              name="cargoType"
              options={cargoOptions}
              value={field.value}
              onChange={field.onChange}
              columns={4}
              error={cargoErrors?.cargoType?.message as string | undefined}
            />
          )}
        />
      </SectionCard>

      <SectionCard icon={<Scale className="h-4.5 w-4.5" />} title="Shipment Details" className="mt-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="Quantity"
            type="number"
            min={0}
            inputMode="numeric"
            error={cargoErrors?.quantity?.message as string | undefined}
            {...register("cargo.quantity")}
            required
          />
          <TextField
            label="Weight (lbs)"
            type="number"
            min={0}
            inputMode="numeric"
            leadingIcon={<Scale className="h-4 w-4" />}
            error={cargoErrors?.weight?.message as string | undefined}
            {...register("cargo.weight")}
            required
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <TextField label="Length" type="number" min={0} leadingIcon={<Ruler className="h-4 w-4" />} {...register("cargo.dimensions.length")} />
          <TextField label="Width" type="number" min={0} {...register("cargo.dimensions.width")} />
          <TextField label="Height" type="number" min={0} {...register("cargo.dimensions.height")} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dimensions-unit" className="text-sm font-medium text-navy">Unit</label>
            <select
              id="dimensions-unit"
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-navy focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric/40"
              {...register("cargo.dimensions.unit")}
            >
              <option value="in">inches</option>
              <option value="cm">cm</option>
            </select>
          </div>
        </div>

        <TextField
          label="Declared Value (USD)"
          type="number"
          min={0}
          leadingIcon={<span className="text-sm">$</span>}
          error={cargoErrors?.declaredValue?.message as string | undefined}
          containerClassName="mt-4"
          {...register("cargo.declaredValue")}
        />

        {/* Adaptive Workflow: cargo-type-specific fields */}
        <AdaptiveFieldGroup visible={palletVisible}>
          <div className="grid grid-cols-1 gap-4 rounded-xl bg-card p-4 sm:grid-cols-2">
            <TextField label="Number of Pallets" type="number" min={0} error={cargoErrors?.pallet?.palletCount?.message as string | undefined} {...register("cargo.pallet.palletCount")} />
            <TextField label="Pallet Dimensions" placeholder="48 × 40 in" error={cargoErrors?.pallet?.palletDimensions?.message as string | undefined} {...register("cargo.pallet.palletDimensions")} />
            <Controller name="cargo.pallet.stackable" control={control} render={({ field }) => (
              <Toggle label="Stackable?" checked={field.value} onChange={field.onChange} />
            )} />
            <Controller name="cargo.pallet.forkliftAvailable" control={control} render={({ field }) => (
              <Toggle label="Forklift Available?" checked={field.value} onChange={field.onChange} />
            )} />
          </div>
        </AdaptiveFieldGroup>

        <AdaptiveFieldGroup visible={furnitureVisible}>
          <div className="grid grid-cols-1 gap-4 rounded-xl bg-card p-4 sm:grid-cols-2">
            <TextField label="Room of Choice" placeholder="e.g. 2nd floor bedroom" error={cargoErrors?.furniture?.roomOfChoice?.message as string | undefined} {...register("cargo.furniture.roomOfChoice")} />
            <div className="flex flex-col gap-3">
              <Controller name="cargo.furniture.stairs" control={control} render={({ field }) => (
                <Toggle label="Stairs?" checked={field.value} onChange={field.onChange} />
              )} />
              <Controller name="cargo.furniture.elevator" control={control} render={({ field }) => (
                <Toggle label="Elevator?" checked={field.value} onChange={field.onChange} />
              )} />
            </div>
          </div>
        </AdaptiveFieldGroup>

        <AdaptiveFieldGroup visible={applianceVisible}>
          <div className="grid grid-cols-1 gap-3 rounded-xl bg-card p-4 sm:grid-cols-1">
            <Controller name="cargo.appliance.disconnectOld" control={control} render={({ field }) => (
              <Toggle label="Disconnect Old Appliance?" checked={field.value} onChange={field.onChange} />
            )} />
            <Controller name="cargo.appliance.installNew" control={control} render={({ field }) => (
              <Toggle label="Install New Appliance?" checked={field.value} onChange={field.onChange} />
            )} />
            <Controller name="cargo.appliance.packagingRemoval" control={control} render={({ field }) => (
              <Toggle label="Packaging Removal?" checked={field.value} onChange={field.onChange} />
            )} />
          </div>
        </AdaptiveFieldGroup>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Controller
            name="cargo.photos"
            control={control}
            render={({ field }) => (
              <UploadZone label="Upload Photos" hint="Helps carriers plan equipment and handling." accept="image/*" files={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            name="cargo.documents"
            control={control}
            render={({ field }) => (
              <UploadZone label="Upload Documents" hint="Packing lists, BOLs, permits, etc." accept=".pdf,.doc,.docx,image/*" files={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </SectionCard>
    </>
  );
}
