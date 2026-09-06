"use client";

import { useActionState } from "react";

import { addValidationMetric } from "@/actions/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function MetricEntryForm({
  experimentId,
  ideaId,
}: {
  experimentId: string;
  ideaId: string;
}) {
  const action = addValidationMetric.bind(null, experimentId, ideaId);
  const [state, formAction, isPending] = useActionState(action, {});
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border p-3">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Field id="date" label="Date">
          <Input id="date" name="date" type="date" defaultValue={today} required />
        </Field>
        <Field id="visitors" label="Visitors">
          <Input id="visitors" name="visitors" type="number" min="0" defaultValue={0} />
        </Field>
        <Field id="signups" label="Signups">
          <Input id="signups" name="signups" type="number" min="0" defaultValue={0} />
        </Field>
        <Field id="activated_users" label="Activated">
          <Input id="activated_users" name="activated_users" type="number" min="0" defaultValue={0} />
        </Field>
        <Field id="returning_users" label="Returning">
          <Input id="returning_users" name="returning_users" type="number" min="0" defaultValue={0} />
        </Field>
        <Field id="checkout_starts" label="Checkout starts">
          <Input id="checkout_starts" name="checkout_starts" type="number" min="0" defaultValue={0} />
        </Field>
        <Field id="purchases" label="Purchases">
          <Input id="purchases" name="purchases" type="number" min="0" defaultValue={0} />
        </Field>
        <Field id="revenue_dollars" label="Revenue ($)">
          <Input id="revenue_dollars" name="revenue_dollars" type="number" min="0" step="0.01" defaultValue={0} />
        </Field>
        <Field id="cost_dollars" label="Cost ($)">
          <Input id="cost_dollars" name="cost_dollars" type="number" min="0" step="0.01" defaultValue={0} />
        </Field>
        <Field id="hours" label="Hours">
          <Input id="hours" name="hours" type="number" min="0" step="0.25" defaultValue={0} />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Log day"}
        </Button>
      </div>
    </form>
  );
}
