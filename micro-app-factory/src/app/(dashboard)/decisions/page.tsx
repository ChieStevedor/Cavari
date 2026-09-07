import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { getDecisions, findConflictingPendingGroups } from "@/lib/data/decisions";
import { formatDate } from "@/lib/format";
import { formatEvidenceValue } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DecisionActions } from "@/components/decision-actions";

const TYPE_LABELS: Record<string, string> = {
  approve_validation: "Approve validation",
  approve_build: "Approve build",
  continue_validating: "Continue validating",
  launch: "Launch",
  iterate: "Iterate",
  kill: "Kill",
  scale: "Scale",
  change_pricing: "Change pricing",
  increase_marketing_budget: "Increase marketing budget",
};

const RECOMMENDATION_VARIANT: Record<string, "success" | "danger" | "warning" | "info"> = {
  KILL: "danger",
  SCALE: "success",
  BUILD: "success",
  LAUNCH: "success",
  CONTINUE_VALIDATING: "info",
  ITERATE: "warning",
};

export default async function DecisionsPage() {
  const [pending, resolved] = await Promise.all([
    getDecisions("PENDING"),
    getDecisions(),
  ]);
  const recentResolved = resolved
    .filter((d) => d.status !== "PENDING")
    .slice(0, 15);
  const conflicts = findConflictingPendingGroups(pending);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Decisions</h1>
        <p className="text-sm text-muted-foreground">
          Every recommendation here needs a human to confirm it — nothing
          changes automatically.
        </p>
      </div>

      {conflicts.map((group) => (
        <Alert key={group.subjectHref} variant="warning">
          <AlertTriangle />
          <AlertTitle>
            {group.decisions.length} conflicting pending decisions for{" "}
            <Link href={group.subjectHref} className="underline">
              {group.subjectName}
            </Link>
          </AlertTitle>
          <AlertDescription>
            {group.decisions
              .map(
                (d) =>
                  `${d.recommendation.replace("_", " ")} created ${formatDate(d.created_at)}`,
              )
              .join(" · ")}
            . Review the conflict before confirming either one — confirming
            will be blocked until it&apos;s resolved.
          </AlertDescription>
        </Alert>
      ))}

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold">
          Decisions required ({pending.length})
        </h2>
        {pending.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nothing waiting on you right now.
          </p>
        )}
        {pending.map((decision) => {
          const subject = decision.idea ?? decision.product;
          const href = decision.idea
            ? `/ideas/${decision.idea.id}`
            : decision.product
              ? `/products/${decision.product.id}`
              : undefined;
          return (
            <Card key={decision.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle>
                    {href ? (
                      <Link href={href} className="hover:underline">
                        {subject?.name ?? "Unknown"}
                      </Link>
                    ) : (
                      subject?.name ?? "Unknown"
                    )}
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {TYPE_LABELS[decision.decision_type] ?? decision.decision_type} ·{" "}
                    {formatDate(decision.created_at)}
                  </p>
                </div>
                <Badge variant={RECOMMENDATION_VARIANT[decision.recommendation] ?? "outline"}>
                  {decision.recommendation.replace("_", " ")}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm">{decision.reason}</p>
                {Object.keys(decision.evidence).length > 0 && (
                  <dl className="grid grid-cols-2 gap-2 rounded-md bg-muted/40 p-3 text-xs sm:grid-cols-3">
                    {Object.entries(decision.evidence).map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-muted-foreground">{k.replace(/_/g, " ")}</dt>
                        <dd className="font-medium">{formatEvidenceValue(k, v)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <DecisionActions decisionId={decision.id} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {recentResolved.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Recently resolved
          </h2>
          <div className="flex flex-col gap-1">
            {recentResolved.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>{(d.idea ?? d.product)?.name ?? "Unknown"}</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  {d.recommendation.replace("_", " ")}
                  <Badge variant={d.status === "CONFIRMED" ? "success" : "outline"}>
                    {d.status}
                  </Badge>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
