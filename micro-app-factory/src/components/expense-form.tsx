"use client";

import { useActionState } from "react";

import { addExpense } from "@/actions/products";
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

const CATEGORIES = ["hosting", "apis", "ai_usage", "saas", "advertising", "domains", "other"];

export function ExpenseForm({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState(
    addExpense.bind(null, productId),
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
          <Label htmlFor="exp-date" className="text-xs">Date</Label>
          <Input id="exp-date" name="date" type="date" defaultValue={today} required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="exp-category" className="text-xs">Category</Label>
          <Select name="category" defaultValue="other">
            <SelectTrigger id="exp-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="exp-amount" className="text-xs">Amount ($)</Label>
          <Input id="exp-amount" name="amount_dollars" type="number" min="0" step="0.01" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="exp-desc" className="text-xs">Description</Label>
          <Input id="exp-desc" name="description" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Add expense"}
        </Button>
      </div>
    </form>
  );
}
