"use client";

import { useState, useTransition } from "react";
import { Check, X, AlertTriangle } from "lucide-react";

import { confirmDecision, dismissDecision } from "@/actions/decisions";
import type { ConfirmBlockedResult } from "@/lib/domain/decision-validation";
import { formatEvidenceValue } from "@/lib/money";
import type { DecisionType } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Confirming a "kill" decision is itself the destructive action (§P2.11) —
 * it's the moment the recommendation actually takes effect. Every other
 * decision type (scale, iterate, approve_*, launch, ...) moves the subject
 * forward and is safely reversible by a later decision, so it doesn't need
 * this extra step. */
const DESTRUCTIVE_DECISION_TYPES: DecisionType[] = ["kill"];

export function DecisionActions({
  decisionId,
  decisionType,
  subjectName,
  evidence,
}: {
  decisionId: string;
  decisionType: DecisionType;
  subjectName: string;
  evidence?: Record<string, unknown>;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [blocked, setBlocked] = useState<ConfirmBlockedResult | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  function runConfirm() {
    startTransition(async () => {
      setBlocked(null);
      setWarning(null);
      const result = await confirmDecision(decisionId);
      setConfirmOpen(false);
      if (!result.ok) setBlocked(result);
      else if (result.warning) setWarning(result.warning);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => {
            if (DESTRUCTIVE_DECISION_TYPES.includes(decisionType)) {
              setConfirmOpen(true);
            } else {
              runConfirm();
            }
          }}
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kill {subjectName}?</DialogTitle>
            <DialogDescription>
              Confirming this decision moves {subjectName} to Killed right now. It stays
              in the Archive permanently for learning — nothing is deleted — but this
              action itself cannot be undone from here.
            </DialogDescription>
          </DialogHeader>
          {evidence && Object.keys(evidence).length > 0 && (
            <dl className="grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-3 text-sm">
              {Object.entries(evidence).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k.replace(/_/g, " ")}</dt>
                  <dd className="font-medium">{formatEvidenceValue(k, v)}</dd>
                </div>
              ))}
            </dl>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={isPending} onClick={runConfirm}>
              {isPending ? "Working…" : "Yes, kill it"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
