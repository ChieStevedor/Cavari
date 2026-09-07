"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Clock } from "lucide-react";

import { createDecision } from "@/actions/decisions";
import {
  RECOMMENDATION_TO_DECISION_TYPE,
  type RecommendationResult,
} from "@/lib/domain/decision-engine";
import type { Decision } from "@/lib/supabase/types";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RECOMMENDATION_VARIANT: Record<
  string,
  "success" | "danger" | "warning" | "info" | "outline"
> = {
  BUILD: "success",
  LAUNCH: "success",
  SCALE: "success",
  CONTINUE_VALIDATING: "info",
  ITERATE: "warning",
  KILL: "danger",
  INSUFFICIENT_DATA: "outline",
};

export function RecommendationCard({
  result,
  ideaId,
  productId,
  existingPendingDecision,
}: {
  result: RecommendationResult;
  ideaId?: string;
  productId?: string;
  /** A PENDING decision of this exact type already fetched server-side, if
   * one exists — lets the button reflect real state instead of a local
   * flag that forgets on remount (P0.2: dedup). */
  existingPendingDecision?: Decision | null;
}) {
  const [logged, setLogged] = useState<Decision | null>(
    existingPendingDecision ?? null,
  );
  const [isPending, startTransition] = useTransition();
  const decisionType = RECOMMENDATION_TO_DECISION_TYPE[result.recommendation];

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
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            {logged.recommendation === result.recommendation ? (
              <CheckCircle2 className="size-4 text-success" />
            ) : (
              <Clock className="size-4 text-warning-foreground" />
            )}
            Already pending since {formatDate(logged.created_at)}
            {logged.recommendation !== result.recommendation &&
              ` — as ${logged.recommendation.replace("_", " ")}, though the current recommendation is now ${result.recommendation.replace("_", " ")}`}
          </span>
        ) : decisionType ? (
          <div>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const { decision } = await createDecision({
                    ideaId,
                    productId,
                    decisionType,
                    recommendation: result.recommendation,
                    reason: result.reasons.join(" "),
                    evidence: result.evidence,
                  });
                  setLogged(decision);
                })
              }
            >
              {isPending ? "Sending…" : "Send to Decision Queue"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
