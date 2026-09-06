"use client";

import { useState, useTransition } from "react";

import { updateProductStatus } from "@/actions/products";
import { allowedProductTransitions, PRODUCT_STATUS_LABELS } from "@/lib/domain/statuses";
import type { ProductStatus } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProductStatusControl({
  productId,
  status,
}: {
  productId: string;
  status: ProductStatus;
}) {
  const transitions = allowedProductTransitions(status);
  const [next, setNext] = useState<ProductStatus | "">("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (transitions.length === 0) return null;

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
          setError(null);
          startTransition(async () => {
            try {
              await updateProductStatus(productId, status, next);
              setNext("");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Failed to update");
            }
          });
        }}
      >
        {isPending ? "Updating…" : "Confirm"}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
