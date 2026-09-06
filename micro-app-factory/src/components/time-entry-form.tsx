"use client";

import { useActionState } from "react";

import { addTimeEntry } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["research", "coding", "design", "marketing", "support", "admin"];

export function TimeEntryForm({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState(
    addTimeEntry.bind(null, productId),
    {},
  );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border p-3">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="time-date" className="text-xs">Date</Label>
          <Input id="time-date" name="date" type="date" defaultValue={today} required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="time-category" className="text-xs">Category</Label>
          <Select name="category" defaultValue="coding">
            <SelectTrigger id="time-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="time-hours" className="text-xs">Hours</Label>
          <Input id="time-hours" name="hours" type="number" min="0.25" step="0.25" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="time-desc" className="text-xs">Description</Label>
          <Input id="time-desc" name="description" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Log time"}
        </Button>
      </div>
    </form>
  );
}
