// Product Health Score (§16) and Scorecard (§32). A summary of real
// metrics, never a replacement for them — the UI must always show the
// underlying numbers alongside this score. When there isn't enough data to
// say something meaningful, this returns insufficientData: true rather than
// fabricating a number.

import type { Metric } from "@/lib/supabase/types";
import { safeDiv } from "@/lib/domain/validation-metrics";

const MIN_DAYS_FOR_SCORE = 3;

export interface HealthComponent {
  label: string;
  value: number | null; // 0-1 normalized, or null if insufficient data
  insufficientData: boolean;
}

export interface ProductHealth {
  insufficientData: boolean;
  score: number | null; // 0-100
  components: {
    growth: HealthComponent;
    activation: HealthComponent;
    retention: HealthComponent;
    revenue: HealthComponent;
    conversion: HealthComponent;
    trend: HealthComponent;
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function computeProductHealth(metrics: Metric[]): ProductHealth {
  const sorted = [...metrics].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length < MIN_DAYS_FOR_SCORE) {
    const insufficient: HealthComponent = {
      label: "INSUFFICIENT DATA",
      value: null,
      insufficientData: true,
    };
    return {
      insufficientData: true,
      score: null,
      components: {
        growth: insufficient,
        activation: insufficient,
        retention: insufficient,
        revenue: insufficient,
        conversion: insufficient,
        trend: insufficient,
      },
    };
  }

  const totals = sorted.reduce(
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

  const activation: HealthComponent = {
    label: "Activation",
    value:
      safeDiv(totals.activatedUsers, totals.users) !== null
        ? clamp01(safeDiv(totals.activatedUsers, totals.users)!)
        : null,
    insufficientData: safeDiv(totals.activatedUsers, totals.users) === null,
  };

  const retention: HealthComponent = {
    label: "Retention",
    value:
      safeDiv(totals.returningUsers, totals.activatedUsers) !== null
        ? clamp01(safeDiv(totals.returningUsers, totals.activatedUsers)!)
        : null,
    insufficientData:
      safeDiv(totals.returningUsers, totals.activatedUsers) === null,
  };

  const conversion: HealthComponent = {
    label: "Conversion",
    value:
      safeDiv(totals.purchases, totals.checkoutStarts) !== null
        ? clamp01(safeDiv(totals.purchases, totals.checkoutStarts)!)
        : null,
    insufficientData: safeDiv(totals.purchases, totals.checkoutStarts) === null,
  };

  const revenue: HealthComponent = {
    label: "Revenue",
    // Presence of any revenue at all is the signal here — cross-product
    // benchmarking is future work once there's a real portfolio baseline.
    value: totals.revenueCents > 0 ? 1 : 0,
    insufficientData: false,
  };

  // Trend + growth: compare the first half of the window to the second half.
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);
  const firstVisitors = firstHalf.reduce((s, m) => s + m.visitors, 0);
  const secondVisitors = secondHalf.reduce((s, m) => s + m.visitors, 0);
  const firstRevenue = firstHalf.reduce((s, m) => s + m.revenue_cents, 0);
  const secondRevenue = secondHalf.reduce((s, m) => s + m.revenue_cents, 0);

  const growthRatio = safeDiv(secondVisitors - firstVisitors, Math.max(firstVisitors, 1));
  const growth: HealthComponent = {
    label: "Growth",
    value: growthRatio !== null ? clamp01(0.5 + growthRatio / 2) : null,
    insufficientData: growthRatio === null,
  };

  const trendDirection =
    secondRevenue > firstRevenue
      ? 1
      : secondRevenue < firstRevenue
        ? 0
        : 0.5;
  const trend: HealthComponent = {
    label: "Trend",
    value: trendDirection,
    insufficientData: false,
  };

  const components = { growth, activation, retention, revenue, conversion, trend };
  const scored = Object.values(components).filter((c) => c.value !== null);
  const score =
    scored.length > 0
      ? Math.round(
          (scored.reduce((s, c) => s + (c.value ?? 0), 0) / scored.length) * 100,
        )
      : null;

  return { insufficientData: false, score, components };
}
