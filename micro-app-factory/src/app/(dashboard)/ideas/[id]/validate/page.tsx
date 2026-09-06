import { notFound } from "next/navigation";

import { getIdeaById } from "@/lib/data/ideas";
import { getExperimentsForIdea, getMetricsForExperiment } from "@/lib/data/validation";
import { sumValidationMetrics, computeValidationRatios } from "@/lib/domain/validation-metrics";
import { recommendForValidation } from "@/lib/domain/decision-engine";
import { EXPERIMENT_STATUS_LABELS } from "@/lib/domain/statuses";
import { formatCents, formatDate, formatHours, formatNumber } from "@/lib/format";
import { IdeaStatusBadge } from "@/components/status-badge";
import { ValidationLadder } from "@/components/validation-ladder";
import { ConversionStats } from "@/components/conversion-stats";
import { ExperimentForm } from "@/components/experiment-form";
import { MetricEntryForm } from "@/components/metric-entry-form";
import { ExperimentStatusControl } from "@/components/experiment-status-control";
import { ExperimentLearningsForm } from "@/components/experiment-learnings-form";
import { RecommendationCard } from "@/components/recommendation-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ValidationWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idea = await getIdeaById(id);
  if (!idea) notFound();

  const experiments = await getExperimentsForIdea(id);
  const experimentsWithMetrics = await Promise.all(
    experiments.map(async (e) => ({
      experiment: e,
      metrics: await getMetricsForExperiment(e.id),
    })),
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold tracking-tight">{idea.name}</h1>
        <IdeaStatusBadge status={idea.status} />
      </div>
      <p className="text-sm text-muted-foreground">
        Validation workspace — every conclusion here should come from the
        ladder below, not from opinion.
      </p>

      {experimentsWithMetrics.map(({ experiment, metrics }) => {
        const totals = sumValidationMetrics(metrics);
        const ratios = computeValidationRatios(totals);
        const recommendation = recommendForValidation(totals);

        return (
          <Card key={experiment.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>{experiment.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {experiment.hypothesis}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="outline">
                  {EXPERIMENT_STATUS_LABELS[experiment.status]}
                </Badge>
                <ExperimentStatusControl
                  experimentId={experiment.id}
                  ideaId={id}
                  status={experiment.status}
                />
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Channel</dt>
                  <dd>{experiment.channel ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Window</dt>
                  <dd>
                    {formatDate(experiment.start_date)} → {formatDate(experiment.end_date)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Budget</dt>
                  <dd>
                    {formatCents(experiment.budget_cents)} · {formatHours(experiment.time_budget_hours)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Targets</dt>
                  <dd>
                    {formatNumber(experiment.traffic_target)} visitors ·{" "}
                    {formatNumber(experiment.signup_target)} signups ·{" "}
                    {formatCents(experiment.revenue_target_cents)}
                  </dd>
                </div>
              </dl>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Validation Ladder</h3>
                <ValidationLadder totals={totals} />
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Conversion</h3>
                <ConversionStats ratios={ratios} />
              </div>

              <RecommendationCard result={recommendation} ideaId={id} />

              <div>
                <h3 className="mb-2 text-sm font-semibold">Log a day</h3>
                <MetricEntryForm experimentId={experiment.id} ideaId={id} />
              </div>

              {metrics.length > 0 && (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Visitors</TableHead>
                        <TableHead>Signups</TableHead>
                        <TableHead>Activated</TableHead>
                        <TableHead>Returning</TableHead>
                        <TableHead>Checkout</TableHead>
                        <TableHead>Purchases</TableHead>
                        <TableHead>Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>{formatDate(m.date)}</TableCell>
                          <TableCell>{m.visitors}</TableCell>
                          <TableCell>{m.signups}</TableCell>
                          <TableCell>{m.activated_users}</TableCell>
                          <TableCell>{m.returning_users}</TableCell>
                          <TableCell>{m.checkout_starts}</TableCell>
                          <TableCell>{m.purchases}</TableCell>
                          <TableCell>{formatCents(m.revenue_cents)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div>
                <h3 className="mb-2 text-sm font-semibold">Result & Learnings</h3>
                <ExperimentLearningsForm
                  experimentId={experiment.id}
                  ideaId={id}
                  result={experiment.result}
                  learnings={experiment.learnings}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div>
        <h2 className="mb-2 text-sm font-semibold">
          {experiments.length === 0 ? "Start a validation experiment" : "Start another experiment"}
        </h2>
        <ExperimentForm ideaId={id} />
      </div>
    </div>
  );
}
