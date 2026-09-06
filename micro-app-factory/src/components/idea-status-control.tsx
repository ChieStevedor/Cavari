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

export function IdeaStatusControl({
  ideaId,
  status,
}: {
  ideaId: string;
  status: IdeaStatus;
}) {
  const transitions = allowedIdeaTransitions(status);
  const [next, setNext] = useState<IdeaStatus | "">("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (transitions.length === 0) return null;

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
          setError(null);
          startTransition(async () => {
            try {
              await updateIdeaStatus(ideaId, status, next);
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
