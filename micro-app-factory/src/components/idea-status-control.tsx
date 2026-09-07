"use client";

import { useState, useTransition } from "react";

import { updateIdeaStatus } from "@/actions/ideas";
import { allowedIdeaTransitions, IDEA_STATUS_LABELS } from "@/lib/domain/statuses";
import type { IdeaStatus } from "@/lib/supabase/types";
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

const DESTRUCTIVE_STATUSES: IdeaStatus[] = ["KILLED", "ARCHIVED"];

/** Current evidence shown in the confirm dialog for a destructive
 * transition (P2.11) — mirrors ProductStatusControl's dialog. */
export interface IdeaDestructiveEvidence {
  opportunityScore: number;
  evidenceConfidence: number | null;
}

export function IdeaStatusControl({
  ideaId,
  ideaName,
  status,
  evidence,
}: {
  ideaId: string;
  ideaName: string;
  status: IdeaStatus;
  evidence?: IdeaDestructiveEvidence;
}) {
  const transitions = allowedIdeaTransitions(status);
  const [next, setNext] = useState<IdeaStatus | "">("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (transitions.length === 0) return null;

  function applyTransition(target: IdeaStatus) {
    setError(null);
    startTransition(async () => {
      try {
        await updateIdeaStatus(ideaId, status, target);
        setNext("");
        setConfirmOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={next} onValueChange={(v) => setNext(v as IdeaStatus)}>
        <SelectTrigger size="sm" className="w-44">
          <SelectValue placeholder="Move to…" />
        </SelectTrigger>
        <SelectContent>
          {transitions.map((s) => (
            <SelectItem key={s} value={s}>
              {IDEA_STATUS_LABELS[s]}
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
              {next === "KILLED" ? "Kill" : "Archive"} {ideaName}?
            </DialogTitle>
            <DialogDescription>
              This moves the idea to {next && IDEA_STATUS_LABELS[next]}. It stays in the
              Archive permanently for learning — nothing is deleted — but this action
              itself cannot be undone from here.
            </DialogDescription>
          </DialogHeader>
          {evidence && (
            <dl className="grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Opportunity score</dt>
                <dd className="font-medium">{evidence.opportunityScore}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Evidence confidence</dt>
                <dd className="font-medium">
                  {evidence.evidenceConfidence === null ? "Unknown" : evidence.evidenceConfidence}
                </dd>
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
