"use client";

import { useState, useTransition } from "react";

import { updateExperimentStatus } from "@/actions/validation";
import {
  allowedExperimentTransitions,
  EXPERIMENT_STATUS_LABELS,
} from "@/lib/domain/statuses";
import type { ExperimentStatus } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ExperimentStatusControl({
  experimentId,
  ideaId,
  status,
}: {
  experimentId: string;
  ideaId: string;
  status: ExperimentStatus;
}) {
  const transitions = allowedExperimentTransitions(status);
  const [next, setNext] = useState<ExperimentStatus | "">("");
  const [isPending, startTransition] = useTransition();

  if (transitions.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Select value={next} onValueChange={(v) => setNext(v as ExperimentStatus)}>
        <SelectTrigger size="sm" className="w-40">
          <SelectValue placeholder="Move to…" />
        </SelectTrigger>
        <SelectContent>
          {transitions.map((s) => (
            <SelectItem key={s} value={s}>
              {EXPERIMENT_STATUS_LABELS[s]}
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
          startTransition(async () => {
            await updateExperimentStatus(experimentId, ideaId, next);
            setNext("");
          });
        }}
      >
        {isPending ? "Updating…" : "Confirm"}
      </Button>
    </div>
  );
}
