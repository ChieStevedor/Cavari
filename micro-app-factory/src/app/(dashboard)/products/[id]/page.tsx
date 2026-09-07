import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import {
  getProductById,
  getMetricsForProduct,
  getExpensesForProduct,
  getTimeEntriesForProduct,
  getLaunchChecklistForProduct,
} from "@/lib/data/products";
import { computeProductPnl, sumProductMetrics } from "@/lib/domain/pnl";
import { computeProductHealth } from "@/lib/domain/health-score";
import {
  recommendForProduct,
  RECOMMENDATION_TO_DECISION_TYPE,
} from "@/lib/domain/decision-engine";
import { getPendingDecisionForSubject } from "@/lib/data/decisions";
import { formatCents, formatDate, formatHours } from "@/lib/format";
import { ProductStatusBadge } from "@/components/status-badge";
import { ProductStatusControl } from "@/components/product-status-control";
import { ProductOverviewForm } from "@/components/product-overview-form";
import { MvpScopeBoard } from "@/components/mvp-scope-board";
import { MvpScopeForm } from "@/components/mvp-scope-form";
import { LaunchChecklist } from "@/components/launch-checklist";
import { ProductMetricForm } from "@/components/product-metric-form";
import { ExpenseForm } from "@/components/expense-form";
import { TimeEntryForm } from "@/components/time-entry-form";
import { PnlSummary } from "@/components/pnl-summary";
import { HealthScorecard } from "@/components/health-scorecard";
import { RecommendationCard } from "@/components/recommendation-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const [metrics, expenses, timeEntries, checklist] = await Promise.all([
    getMetricsForProduct(id),
    getExpensesForProduct(id),
    getTimeEntriesForProduct(id),
    getLaunchChecklistForProduct(id),
  ]);

  const pnl = computeProductPnl(metrics, expenses, timeEntries);
  const health = computeProductHealth(metrics);
  const totals = sumProductMetrics(metrics);
  const recommendation = recommendForProduct(totals, pnl);
  const recommendationDecisionType =
    RECOMMENDATION_TO_DECISION_TYPE[recommendation.recommendation];
  const existingPendingDecision = recommendationDecisionType
    ? await getPendingDecisionForSubject(
        { productId: product.id },
        recommendationDecisionType,
      )
    : null;

  const checklistComplete =
    checklist.length > 0 && checklist.every((c) => c.completed);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">{product.name}</h1>
            <ProductStatusBadge status={product.status} />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>Maturity {product.maturity}/6</span>
            {product.idea && (
              <Link href={`/ideas/${product.idea.id}`} className="hover:underline">
                Source idea: {product.idea.name}
              </Link>
            )}
            {product.url && (
              <a
                href={product.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-info hover:underline"
              >
                {product.url} <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <ProductStatusControl
              productId={product.id}
              productName={product.name}
              status={product.status}
              evidence={{
                revenueCents: totals.revenueCents,
                profitPerHourCents: pnl.profitPerHourCents,
                healthScore: health.score,
                totalHours: pnl.totalHours,
              }}
            />
            <ProductOverviewForm product={product} />
          </div>
          {product.status !== "KILLED" &&
            product.status !== "ARCHIVED" &&
            !checklistComplete && (
              <span className="text-xs text-warning-foreground">
                Launch checklist incomplete — visible below.
              </span>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <HealthScorecard health={health} />
          </CardContent>
        </Card>
        <RecommendationCard
          result={recommendation}
          productId={product.id}
          existingPendingDecision={existingPendingDecision}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>P&amp;L</CardTitle>
        </CardHeader>
        <CardContent>
          <PnlSummary pnl={pnl} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>MVP scope</CardTitle>
          <MvpScopeForm product={product} />
        </CardHeader>
        <CardContent>
          <MvpScopeBoard
            mustHave={product.mvp_must_have}
            shouldHave={product.mvp_should_have}
            notNow={product.mvp_not_now}
            future={product.mvp_future}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Launch checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <LaunchChecklist productId={product.id} items={checklist} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metrics</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ProductMetricForm productId={product.id} />
          {metrics.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Visitors</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Activated</TableHead>
                    <TableHead>Returning</TableHead>
                    <TableHead>Purchases</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...metrics].reverse().slice(0, 30).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{formatDate(m.date)}</TableCell>
                      <TableCell>{m.visitors}</TableCell>
                      <TableCell>{m.users}</TableCell>
                      <TableCell>{m.activated_users}</TableCell>
                      <TableCell>{m.returning_users}</TableCell>
                      <TableCell>{m.purchases}</TableCell>
                      <TableCell>{formatCents(m.revenue_cents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ExpenseForm productId={product.id} />
          {expenses.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.slice(0, 20).map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{formatDate(e.date)}</TableCell>
                      <TableCell className="capitalize">{e.category.replace("_", " ")}</TableCell>
                      <TableCell>{formatCents(e.amount_cents)}</TableCell>
                      <TableCell className="text-muted-foreground">{e.description ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time tracking</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <TimeEntryForm productId={product.id} />
          {timeEntries.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.slice(0, 20).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{formatDate(t.date)}</TableCell>
                      <TableCell className="capitalize">{t.category}</TableCell>
                      <TableCell>{formatHours(t.hours)}</TableCell>
                      <TableCell className="text-muted-foreground">{t.description ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
