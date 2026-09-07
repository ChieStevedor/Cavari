import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { getCommandCenterData } from "@/lib/data/dashboard";
import { computeProductHealth } from "@/lib/domain/health-score";
import { computeProductPnl } from "@/lib/domain/pnl";
import { formatCents, formatHours, formatPercent } from "@/lib/format";
import { KpiCard } from "@/components/kpi-card";
import { ProductStatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PRIORITY_VARIANT: Record<string, "danger" | "warning" | "info"> = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "info",
};

const PIPELINE_STAGES = [
  { key: "IDEA", label: "Idea" },
  { key: "RESEARCHING", label: "Research" },
  { key: "SCORED", label: "Scoring" },
  { key: "VALIDATING", label: "Validation" },
  { key: "BUILDING", label: "Building" },
  { key: "LIVE", label: "Live" },
  { key: "SCALE", label: "Scale" },
  { key: "WINNER", label: "Winner" },
] as const;

export default async function CommandCenterPage() {
  const data = await getCommandCenterData();
  const { kpis } = data;

  const productsWithScores = data.products
    .filter((p) => !["KILLED", "ARCHIVED"].includes(p.status))
    .map((p) => {
      const productMetrics = data.metrics.filter((m) => m.product_id === p.id);
      const productExpenses = data.expenses.filter((e) => e.product_id === p.id);
      const productTime = data.timeEntries.filter((t) => t.product_id === p.id);
      return {
        product: p,
        pnl: computeProductPnl(productMetrics, productExpenses, productTime),
        health: computeProductHealth(productMetrics),
      };
    })
    .sort((a, b) => (b.pnl.revenuePerHourCents ?? -1) - (a.pnl.revenuePerHourCents ?? -1))
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Command Center</h1>
        <p className="text-sm text-muted-foreground">
          What exists, what&apos;s working, and what to do today — in one screen.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Total ideas" value={String(kpis.totalIdeas)} sublabel={`${kpis.ideasThisWeek} this week`} />
        <KpiCard label="Ideas validated" value={String(kpis.ideasValidated)} />
        <KpiCard label="MVPs launched" value={String(kpis.mvpsLaunched)} />
        <KpiCard label="Active products" value={String(kpis.activeProducts)} />
        <KpiCard label="Winners" value={String(kpis.winners)} />
        <KpiCard label="Killed" value={String(kpis.killedProducts)} />
        <KpiCard label="Total revenue" value={formatCents(kpis.totalRevenueCents)} />
        <KpiCard label="MRR" value={formatCents(kpis.mrrCents)} />
        <KpiCard label="Revenue this month" value={formatCents(kpis.revenueThisMonthCents)} />
        <KpiCard label="Avg hours/product" value={formatHours(kpis.avgHoursPerProduct)} />
        <KpiCard label="Revenue/hour" value={formatCents(kpis.revenuePerHourCents)} />
        <KpiCard label="Conversion rate" value={formatPercent(kpis.conversionRate)} />
        <KpiCard label="Experiments running" value={String(kpis.experimentsRunning)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Factory Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {PIPELINE_STAGES.map((stage, i) => (
              <div key={stage.key} className="flex items-center gap-2">
                <div className="flex flex-col items-center rounded-lg border px-4 py-2">
                  <span className="text-lg font-semibold">{data.pipeline[stage.key]}</span>
                  <span className="text-xs text-muted-foreground">{stage.label}</span>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <span className="text-muted-foreground">→</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.todaysActions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing urgent — pick the highest opportunity idea and keep moving.
              </p>
            )}
            {data.todaysActions.slice(0, 8).map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="flex items-start gap-3 rounded-md border p-3 hover:bg-accent/40"
              >
                <Badge variant={PRIORITY_VARIANT[action.priority]}>{action.priority}</Badge>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{action.title}</span>
                  <span className="text-xs text-muted-foreground">{action.reason}</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Decision Queue</CardTitle>
            <Link href="/decisions" className="text-xs text-info hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {data.pendingDecisionsCount === 0 ? (
              <p className="text-sm text-muted-foreground">No decisions pending.</p>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-warning-foreground" />
                <span className="text-sm">
                  {data.pendingDecisionsCount} decision
                  {data.pendingDecisionsCount === 1 ? "" : "s"} waiting on you.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Product Portfolio</CardTitle>
          <Link href="/products" className="text-xs text-info hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {productsWithScores.length === 0 && (
            <p className="text-sm text-muted-foreground">No active products yet.</p>
          )}
          {productsWithScores.map(({ product, pnl, health }) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="flex items-center justify-between rounded-md border p-3 hover:bg-accent/40"
            >
              <div className="flex items-center gap-3">
                <ProductStatusBadge status={product.status} />
                <span className="text-sm font-medium">{product.name}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{formatCents(pnl.revenuePerHourCents)}/hr</span>
                <span>{health.insufficientData ? "INSUFFICIENT DATA" : `${health.score}/100`}</span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Factory Learning</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {data.learnings.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No experiment learnings logged yet.
            </p>
          )}
          {data.learnings.map((exp) => (
            <div key={exp.id} className="rounded-md border p-3 text-sm">
              <p className="font-medium">{exp.name}</p>
              <p className="text-muted-foreground">{exp.learnings}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
