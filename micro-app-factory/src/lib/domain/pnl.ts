// Product-level economics (§17). All money in integer cents; every ratio
// that divides by zero returns null so callers render "INSUFFICIENT DATA"
// rather than 0 or Infinity.

import type { Expense, Metric, TimeEntry } from "@/lib/supabase/types";
import { safeDiv } from "@/lib/domain/validation-metrics";

/**
 * P1.6 remediation: a measured zero (real expense data, $0 MRR — genuinely
 * not profitable yet) and missing data (no expenses ever logged, nothing
 * to judge break-even against) used to both collapse to `null` and render
 * as "INSUFFICIENT DATA" — which is simply false in the first case. These
 * are now distinguishable at the type level so a caller can't conflate
 * them by accident.
 */
export type BreakEvenStatus =
  | { status: "computed"; months: number }
  | { status: "not_yet_profitable" }
  | { status: "unknown" };

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
  /** Months of current MRR needed to cover one month of operating cost. */
  breakEven: BreakEvenStatus;
}

export interface ProductMetricsTotals {
  visitors: number;
  users: number;
  activatedUsers: number;
  returningUsers: number;
  checkoutStarts: number;
  purchases: number;
  /** Net of refunds — see P1.8 remediation: the recommendation engine and
   * the P&L card must agree on one revenue figure, not silently mix gross
   * and refund-adjusted numbers. */
  revenueCents: number;
}

/** The one canonical way to sum a product's daily metrics into totals.
 * Used by the product detail page, the decision-engine recommendation, and
 * Today's Actions — previously each computed this inline with a different
 * (sometimes gross, sometimes net) definition of revenue. */
export function sumProductMetrics(metrics: Metric[]): ProductMetricsTotals {
  return metrics.reduce<ProductMetricsTotals>(
    (acc, m) => ({
      visitors: acc.visitors + m.visitors,
      users: acc.users + m.users,
      activatedUsers: acc.activatedUsers + m.activated_users,
      returningUsers: acc.returningUsers + m.returning_users,
      checkoutStarts: acc.checkoutStarts + m.checkout_starts,
      purchases: acc.purchases + m.purchases,
      revenueCents: acc.revenueCents + m.revenue_cents - m.refunds_cents,
    }),
    {
      visitors: 0,
      users: 0,
      activatedUsers: 0,
      returningUsers: 0,
      checkoutStarts: 0,
      purchases: 0,
      revenueCents: 0,
    },
  );
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

  const breakEven: BreakEvenStatus =
    expenses.length === 0
      ? { status: "unknown" } // no expense data has ever been logged
      : mrrCents > 0
        ? { status: "computed", months: monthlyOperatingCostCents / mrrCents }
        : { status: "not_yet_profitable" }; // real expenses on record, $0 MRR — a measured zero, not missing data

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
    breakEven,
  };
}
