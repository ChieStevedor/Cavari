"use client";

import { useState, useTransition } from "react";

import { updateExperimentLearnings } from "@/actions/validation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ExperimentLearningsForm({
  experimentId,
  ideaId,
  result,
  learnings,
}: {
  experimentId: string;
  ideaId: string;
  result: string | null;
  learnings: string | null;
}) {
  const [resultText, setResultText] = useState(result ?? "");
  const [learningsText, setLearningsText] = useState(learnings ?? "");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`result-${experimentId}`}>Result</Label>
        <Textarea
          id={`result-${experimentId}`}
          value={resultText}
          onChange={(e) => setResultText(e.target.value)}
          placeholder="What actually happened, in numbers."
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`learnings-${experimentId}`}>Learnings</Label>
        <Textarea
          id={`learnings-${experimentId}`}
          value={learningsText}
          onChange={(e) => setLearningsText(e.target.value)}
          placeholder="What did this teach us, regardless of outcome?"
        />
      </div>
      <div>
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() =>
            startTransition(() =>
              updateExperimentLearnings(experimentId, ideaId, {
                result: resultText,
                learnings: learningsText,
              }),
            )
          }
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
