"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";

import { confirmDecision, dismissDecision } from "@/actions/decisions";
import { Button } from "@/components/ui/button";

export function DecisionActions({ decisionId }: { decisionId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => confirmDecision(decisionId))}
      >
        <Check />
        Confirm
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => startTransition(() => dismissDecision(decisionId))}
      >
        <X />
        Dismiss
      </Button>
    </div>
  );
}
