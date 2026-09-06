"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";

import { createDecision } from "@/actions/decisions";
import type { RecommendationResult } from "@/lib/domain/decision-engine";
import type { DecisionType } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RECOMMENDATION_VARIANT: Record<
  string,
  "success" | "danger" | "warning" | "info"
> = {
  BUILD: "success",
  LAUNCH: "success",
  SCALE: "success",
  CONTINUE_VALIDATING: "info",
  ITERATE: "warning",
  KILL: "danger",
};

const RECOMMENDATION_TO_DECISION_TYPE: Record<string, DecisionType> = {
  BUILD: "approve_build",
  LAUNCH: "launch",
  SCALE: "scale",
  CONTINUE_VALIDATING: "continue_validating",
  ITERATE: "iterate",
  KILL: "kill",
};

export function RecommendationCard({
  result,
  ideaId,
  productId,
}: {
  result: RecommendationResult;
  ideaId?: string;
  productId?: string;
}) {
  const [logged, setLogged] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recommendation</CardTitle>
        <Badge variant={RECOMMENDATION_VARIANT[result.recommendation] ?? "outline"}>
          {result.recommendation.replace("_", " ")}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="list-disc pl-5 text-sm text-muted-foreground">
          {result.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          This is a computed suggestion from real data, not an automatic
          action. Nothing changes until you confirm it in the Decision Queue.
        </p>
        {logged ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-success">
            <CheckCircle2 className="size-4" />
            Sent to Decision Queue
          </span>
        ) : (
          <div>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await createDecision({
                    ideaId,
                    productId,
                    decisionType:
                      RECOMMENDATION_TO_DECISION_TYPE[result.recommendation],
                    recommendation: result.recommendation,
                    reason: result.reasons.join(" "),
                    evidence: result.evidence,
                  });
                  setLogged(true);
                })
              }
            >
              {isPending ? "Sending…" : "Send to Decision Queue"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
