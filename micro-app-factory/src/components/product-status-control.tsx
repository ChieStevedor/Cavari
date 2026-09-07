"use client";

import { useState, useTransition } from "react";

import { updateProductStatus } from "@/actions/products";
import { allowedProductTransitions, PRODUCT_STATUS_LABELS } from "@/lib/domain/statuses";
import type { ProductStatus } from "@/lib/supabase/types";
import { formatCents, formatHours } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DESTRUCTIVE_STATUSES: ProductStatus[] = ["KILLED", "ARCHIVED"];

/** Current evidence shown in the confirm dialog for a destructive
 * transition (P2.11) — not shown for harmless transitions like
 * MEASURING -> ITERATING, only KILL/ARCHIVE. */
export interface ProductDestructiveEvidence {
  revenueCents: number;
  profitPerHourCents: number | null;
  healthScore: number | null;
  totalHours: number;
}

export function ProductStatusControl({
  productId,
  productName,
  status,
  evidence,
}: {
  productId: string;
  productName: string;
  status: ProductStatus;
  evidence?: ProductDestructiveEvidence;
}) {
  const transitions = allowedProductTransitions(status);
  const [next, setNext] = useState<ProductStatus | "">("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (transitions.length === 0) return null;

  function applyTransition(target: ProductStatus) {
    setError(null);
    startTransition(async () => {
      try {
        await updateProductStatus(productId, status, target);
        setNext("");
        setConfirmOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={next} onValueChange={(v) => setNext(v as ProductStatus)}>
        <SelectTrigger size="sm" className="w-40">
          <SelectValue placeholder="Move to…" />
        </SelectTrigger>
        <SelectContent>
          {transitions.map((s) => (
            <SelectItem key={s} value={s}>
              {PRODUCT_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="secondary"
        disabled={!next || isPending}
        onClick={() => {
          if (!next) return;
          if (DESTRUCTIVE_STATUSES.includes(next)) {
            setConfirmOpen(true);
          } else {
            applyTransition(next);
          }
        }}
      >
        {isPending ? "Updating…" : "Confirm"}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {next === "KILLED" ? "Kill" : "Archive"} {productName}?
            </DialogTitle>
            <DialogDescription>
              This moves the product to {next && PRODUCT_STATUS_LABELS[next]}. It stays
              in the Archive permanently for learning — nothing is deleted — but this
              action itself cannot be undone from here.
            </DialogDescription>
          </DialogHeader>
          {evidence && (
            <dl className="grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Revenue</dt>
                <dd className="font-medium">{formatCents(evidence.revenueCents)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Profit/hour</dt>
                <dd className="font-medium">{formatCents(evidence.profitPerHourCents)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Health</dt>
                <dd className="font-medium">
                  {evidence.healthScore === null ? "INSUFFICIENT DATA" : `${evidence.healthScore}/100`}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Hours invested</dt>
                <dd className="font-medium">{formatHours(evidence.totalHours)}</dd>
              </div>
            </dl>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => next && applyTransition(next)}
            >
              {isPending ? "Working…" : `Yes, ${next === "KILLED" ? "kill" : "archive"} it`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
