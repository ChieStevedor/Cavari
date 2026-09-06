// Product-level economics (§17). All money in integer cents; every ratio
// that divides by zero returns null so callers render "INSUFFICIENT DATA"
// rather than 0 or Infinity.

import type { Expense, Metric, TimeEntry } from "@/lib/supabase/types";
import { safeDiv } from "@/lib/domain/validation-metrics";

export interface ProductPnl {
  grossRevenueCents: number;
  refundsCents: number;
  netRevenueCents: number;
  totalCostCents: number;
  totalHours: number;
  netProfitCents: number;
  profitPerHourCents: number | null;
  revenuePerHourCents: number | null;
  /** Approximate MRR: net revenue over the most recent 30 days of metrics. */
  mrrCents: number;
  monthlyOperatingCostCents: number;
  /** Months of current MRR needed to cover one month of operating cost, or
   * null if there isn't enough revenue yet to break even at all. */
  breakEvenMonths: number | null;
}

export function computeProductPnl(
  metrics: Metric[],
  expenses: Expense[],
  timeEntries: TimeEntry[],
): ProductPnl {
  const grossRevenueCents = metrics.reduce((s, m) => s + m.revenue_cents, 0);
  const refundsCents = metrics.reduce((s, m) => s + m.refunds_cents, 0);
  const netRevenueCents = grossRevenueCents - refundsCents;
  const totalCostCents = expenses.reduce((s, e) => s + e.amount_cents, 0);
  const totalHours = timeEntries.reduce((s, t) => s + Number(t.hours), 0);
  const netProfitCents = netRevenueCents - totalCostCents;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentMetrics = metrics.filter((m) => new Date(m.date) >= thirtyDaysAgo);
  const mrrCents = recentMetrics.reduce(
    (s, m) => s + m.revenue_cents - m.refunds_cents,
    0,
  );

  const recentExpenses = expenses.filter(
    (e) => new Date(e.date) >= thirtyDaysAgo,
  );
  const monthlyOperatingCostCents = recentExpenses.reduce(
    (s, e) => s + e.amount_cents,
    0,
  );

  const breakEvenMonths =
    mrrCents > 0 ? monthlyOperatingCostCents / mrrCents : null;

  return {
    grossRevenueCents,
    refundsCents,
    netRevenueCents,
    totalCostCents,
    totalHours,
    netProfitCents,
    profitPerHourCents: safeDiv(netProfitCents, totalHours),
    revenuePerHourCents: safeDiv(netRevenueCents, totalHours),
    mrrCents,
    monthlyOperatingCostCents,
    breakEvenMonths,
  };
}
