"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

import { updateProductOverview } from "@/actions/products";
import type { Product } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export function ProductOverviewForm({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    updateProductOverview.bind(null, product.id),
    {},
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) setOpen(false);
    wasPending.current = isPending;
  }, [isPending, state.error]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil />
          Edit overview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Product overview</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <Field id="name" label="Name">
            <Input id="name" name="name" required defaultValue={product.name} />
          </Field>
          <Field id="url" label="URL">
            <Input id="url" name="url" type="url" defaultValue={product.url ?? ""} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field id="pricing_model" label="Pricing model">
              <Input id="pricing_model" name="pricing_model" defaultValue={product.pricing_model ?? ""} />
            </Field>
            <Field id="price_dollars" label="Price (USD)">
              <Input
                id="price_dollars"
                name="price_dollars"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product.price_cents != null ? product.price_cents / 100 : ""}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field id="launch_date" label="Launch date">
              <Input id="launch_date" name="launch_date" type="date" defaultValue={product.launch_date ?? ""} />
            </Field>
            <Field id="dev_target_launch" label="Target launch">
              <Input
                id="dev_target_launch"
                name="dev_target_launch"
                type="date"
                defaultValue={product.dev_target_launch ?? ""}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field id="dev_estimated_hours" label="Estimated hours">
              <Input
                id="dev_estimated_hours"
                name="dev_estimated_hours"
                type="number"
                step="0.5"
                min="0"
                defaultValue={product.dev_estimated_hours ?? ""}
              />
            </Field>
            <Field id="dev_actual_hours" label="Actual hours">
              <Input
                id="dev_actual_hours"
                name="dev_actual_hours"
                type="number"
                step="0.5"
                min="0"
                defaultValue={product.dev_actual_hours ?? ""}
              />
            </Field>
          </div>
          <Field id="dev_tools_used" label="Developer / AI tools used">
            <Input id="dev_tools_used" name="dev_tools_used" defaultValue={product.dev_tools_used ?? ""} />
          </Field>
          <Field id="dev_notes" label="Technical notes">
            <Textarea id="dev_notes" name="dev_notes" defaultValue={product.dev_notes ?? ""} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
