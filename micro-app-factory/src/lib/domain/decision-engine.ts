// Decision Engine (§18-20). Produces a recommendation plus the reasons
// behind it from real numbers — never a silent, irreversible action. Every
// recommendation returned here is meant to be shown to the user with a
// manual confirm/dismiss step (spec: "recommendations require manual
// confirmation").
//
// Thresholds are named constants so they can become Settings-page-editable
// scoring rules later (§8: "allow the scoring model to be configurable")
// without touching the logic that uses them.

import type { ProductPnl, ProductMetricsTotals } from "@/lib/domain/pnl";
import type { ValidationTotals } from "@/lib/domain/validation-metrics";
import type { DecisionType } from "@/lib/supabase/types";

export type { ProductMetricsTotals };

export const KILL_CRITERIA_THRESHOLDS = {
  /** §19: "no activation after 100-200 qualified visitors" */
  minVisitorsForActivationCheck: 150,
  /** §19: "meaningful usage but no willingness to pay" */
  minActivatedUsersForMonetizationCheck: 15,
};

export type Recommendation =
  | "BUILD"
  | "CONTINUE_VALIDATING"
  | "LAUNCH"
  | "ITERATE"
  | "SCALE"
  | "KILL";

export interface RecommendationResult {
  recommendation: Recommendation;
  reasons: string[];
  evidence: Record<string, number | string | null>;
}

/** Which decision_type a computed recommendation logs as, when a user sends
 * it to the Decision Queue — shared between server pages (to look up an
 * existing pending decision of the matching type) and the client card that
 * creates one. */
export const RECOMMENDATION_TO_DECISION_TYPE: Record<Recommendation, DecisionType> = {
  BUILD: "approve_build",
  LAUNCH: "launch",
  SCALE: "scale",
  CONTINUE_VALIDATING: "continue_validating",
  ITERATE: "iterate",
  KILL: "kill",
};

export function recommendForValidation(
  totals: ValidationTotals,
): RecommendationResult {
  const evidence = {
    visitors: totals.visitors,
    signups: totals.signups,
    activated_users: totals.activatedUsers,
    purchases: totals.purchases,
    revenue_cents: totals.revenueCents,
    hours_invested: totals.hours,
  };

  if (totals.purchases > 0) {
    return {
      recommendation: "BUILD",
      reasons: [
        `${totals.purchases} purchase${totals.purchases === 1 ? "" : "s"} collected ($${(totals.revenueCents / 100).toFixed(2)}) — real willingness to pay, not just interest.`,
      ],
      evidence,
    };
  }

  if (
    totals.visitors >= KILL_CRITERIA_THRESHOLDS.minVisitorsForActivationCheck &&
    totals.activatedUsers === 0
  ) {
    return {
      recommendation: "KILL",
      reasons: [
        `${totals.visitors} qualified visitors with 0 activated users — no activation after a meaningful distribution attempt.`,
        `${totals.hours} hours invested with no positive signal.`,
      ],
      evidence,
    };
  }

  if (
    totals.activatedUsers >=
      KILL_CRITERIA_THRESHOLDS.minActivatedUsersForMonetizationCheck &&
    totals.purchases === 0
  ) {
    return {
      recommendation: "KILL",
      reasons: [
        `${totals.activatedUsers} activated users but $0 revenue — meaningful usage without willingness to pay.`,
      ],
      evidence,
    };
  }

  return {
    recommendation: "CONTINUE_VALIDATING",
    reasons: [
      "Evidence so far is inconclusive — not enough signal yet to build or kill confidently.",
    ],
    evidence,
  };
}

export function recommendForProduct(
  totals: ProductMetricsTotals,
  pnl: ProductPnl,
): RecommendationResult {
  const evidence = {
    visitors: totals.visitors,
    users: totals.users,
    activated_users: totals.activatedUsers,
    returning_users: totals.returningUsers,
    revenue_cents: totals.revenueCents,
    net_profit_cents: pnl.netProfitCents,
    total_hours: pnl.totalHours,
  };

  if (
    totals.visitors >= KILL_CRITERIA_THRESHOLDS.minVisitorsForActivationCheck &&
    totals.activatedUsers === 0
  ) {
    return {
      recommendation: "KILL",
      reasons: [
        `${totals.visitors} visitors with 0 activated users — no activation after meaningful traffic.`,
        `${pnl.totalHours} hours invested with no positive trend.`,
      ],
      evidence,
    };
  }

  if (
    totals.activatedUsers >=
      KILL_CRITERIA_THRESHOLDS.minActivatedUsersForMonetizationCheck &&
    totals.revenueCents === 0
  ) {
    return {
      recommendation: "KILL",
      reasons: [
        `${totals.activatedUsers} activated users but $0 revenue — usage without willingness to pay.`,
      ],
      evidence,
    };
  }

  if (
    pnl.mrrCents > 0 &&
    totals.returningUsers > 0 &&
    (pnl.profitPerHourCents ?? 0) > 0
  ) {
    return {
      recommendation: "SCALE",
      reasons: [
        `Positive MRR ($${(pnl.mrrCents / 100).toFixed(2)}) with repeat usage and profit/hour above zero.`,
      ],
      evidence,
    };
  }

  if (totals.revenueCents > 0 || totals.returningUsers > 0) {
    return {
      recommendation: "ITERATE",
      reasons: [
        "Some real signal (revenue or repeat usage) but not yet consistent enough to scale.",
      ],
      evidence,
    };
  }

  return {
    recommendation: "CONTINUE_VALIDATING",
    reasons: ["Not enough post-launch data yet to recommend a direction."],
    evidence,
  };
}
