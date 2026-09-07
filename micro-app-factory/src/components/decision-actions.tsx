"use client";

import { useState, useTransition } from "react";
import { Check, X, AlertTriangle } from "lucide-react";

import { confirmDecision, dismissDecision } from "@/actions/decisions";
import type { ConfirmBlockedResult } from "@/lib/domain/decision-validation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DecisionActions({ decisionId }: { decisionId: string }) {
  const [isPending, startTransition] = useTransition();
  const [blocked, setBlocked] = useState<ConfirmBlockedResult | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              setBlocked(null);
              setWarning(null);
              const result = await confirmDecision(decisionId);
              if (!result.ok) setBlocked(result);
              else if (result.warning) setWarning(result.warning);
            })
          }
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
      {blocked && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Confirmation blocked — {blocked.reason.replace(/_/g, " ")}</AlertTitle>
          <AlertDescription>
            <p>{blocked.message}</p>
            {blocked.conflictingDecisions && blocked.conflictingDecisions.length > 0 && (
              <ul className="mt-1 list-disc pl-4">
                {blocked.conflictingDecisions.map((c) => (
                  <li key={c.id}>
                    {c.recommendation.replace("_", " ")} — {c.decision_type.replace(/_/g, " ")} (created{" "}
                    {new Date(c.created_at).toLocaleDateString()})
                  </li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}
      {warning && (
        <Alert variant="warning">
          <AlertTriangle />
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
