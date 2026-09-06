"use client";

import { useActionState } from "react";

import { createExperiment } from "@/actions/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export function ExperimentForm({ ideaId }: { ideaId: string }) {
  const [state, formAction, isPending] = useActionState(
    createExperiment.bind(null, ideaId),
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border p-4">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Field id="name" label="Experiment name">
        <Input id="name" name="name" required />
      </Field>
      <Field id="hypothesis" label="Hypothesis — what must be true for this to work?">
        <Textarea id="hypothesis" name="hypothesis" required rows={2} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="target_customer_who" label="Who is the target customer?">
          <Input id="target_customer_who" name="target_customer_who" />
        </Field>
        <Field id="target_customer_problem" label="What's their problem?">
          <Input id="target_customer_problem" name="target_customer_problem" />
        </Field>
        <Field id="current_solution" label="Current solution">
          <Input id="current_solution" name="current_solution" />
        </Field>
        <Field id="dissatisfaction_reason" label="Why dissatisfied?">
          <Input id="dissatisfaction_reason" name="dissatisfaction_reason" />
        </Field>
        <Field id="purchase_trigger" label="Trigger to buy">
          <Input id="purchase_trigger" name="purchase_trigger" />
        </Field>
        <Field id="reach_channel" label="Where can they be reached?">
          <Input id="reach_channel" name="reach_channel" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field id="channel" label="Channel">
          <Input id="channel" name="channel" placeholder="reddit_organic, paid_ads…" />
        </Field>
        <Field id="start_date" label="Start date">
          <Input id="start_date" name="start_date" type="date" />
        </Field>
        <Field id="end_date" label="End date">
          <Input id="end_date" name="end_date" type="date" />
        </Field>
        <Field id="budget_dollars" label="Budget ($)">
          <Input id="budget_dollars" name="budget_dollars" type="number" step="1" min="0" />
        </Field>
        <Field id="time_budget_hours" label="Time budget (hrs)">
          <Input id="time_budget_hours" name="time_budget_hours" type="number" step="0.5" min="0" />
        </Field>
        <Field id="traffic_target" label="Traffic target">
          <Input id="traffic_target" name="traffic_target" type="number" step="1" min="0" />
        </Field>
        <Field id="signup_target" label="Signup target">
          <Input id="signup_target" name="signup_target" type="number" step="1" min="0" />
        </Field>
        <Field id="revenue_target_dollars" label="Revenue target ($)">
          <Input id="revenue_target_dollars" name="revenue_target_dollars" type="number" step="1" min="0" />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Start experiment"}
        </Button>
      </div>
    </form>
  );
}
