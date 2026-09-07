// Decision Engine (§18-20). Produces a recommendation plus the reasons
// behind it from real numbers — never a silent, irreversible action. Every
// recommendation returned here is meant to be shown to the user with a
// manual confirm/dismiss step (spec: "recommendations require manual
// confirmation").
//
// Thresholds are named constants, each with a one-line rationale, so they
// can become Settings-page-editable scoring rules later (§8) without
// touching the logic that uses them — and so a reviewer can see *why* a
// number was chosen instead of taking it on faith.

import type { ProductPnl, ProductMetricsTotals } from "@/lib/domain/pnl";
import type { ValidationTotals } from "@/lib/domain/validation-metrics";
import type { DecisionType } from "@/lib/supabase/types";

export type { ProductMetricsTotals };

export const KILL_CRITERIA_THRESHOLDS = {
  /** §19: "no activation after 100-200 qualified visitors" — midpoint. */
  minVisitorsForActivationCheck: 150,
  /** §19: "meaningful usage but no willingness to pay" — the spec's own
   * worked KILL example (§18) uses activated-user counts in this range as
   * "meaningful". */
  minActivatedUsersForMonetizationCheck: 15,
  /** §19: "economics clearly do not justify continued investment". The
   * spec's own worked example calls 14.5 sunk hours + $0 revenue enough to
   * justify a kill call; this rounds up slightly as a clean, standalone
   * economics-only bar (used even when neither traffic nor activation
   * alone crosses their thresholds — e.g. real usage, real spend, real
   * time, just never converted). */
  minHoursForEconomicsCheck: 20,
};

/**
 * Below this exposure, there isn't enough post-launch signal to judge
 * anything — killing OR scaling a product on 5 visitors would be reading
 * tea leaves. A product needs *some* real traffic or *some* real time
 * invested before any verdict beyond "not enough yet" is defensible.
 * (This is what actually fixes the confirmed bug where a product with
 * meaningful traffic and real losses was labeled the same as one that
 * simply hadn't launched: those two cases now diverge right here.)
 */
export const SUFFICIENCY_THRESHOLDS = {
  minVisitorsForJudgment: 30,
  minHoursForJudgment: 10,
};

/**
 * A single returning user out of hundreds of visitors is not retention —
 * it's noise. Five is still a low bar, but it's a deliberate floor instead
 * of ">0", which is what let one incidental repeat visit flip a losing
 * product's recommendation in the confirmed bug.
 */
export const MIN_RETURNING_USERS_FOR_RETENTION_SIGNAL = 5;

/**
 * §20 lists six independent SCALE criteria (consistent revenue, repeat
 * usage, positive trend, acceptable economics, strong conversion, a clear
 * segment) — the spirit is corroboration, not any single metric. Of the
 * four positive signals this function can evaluate from its inputs
 * (revenue ever collected, current MRR, real retention, profitable unit
 * economics), at least this many must agree before recommending SCALE.
 */
export const SCALE_MIN_POSITIVE_SIGNALS = 3;

export type Recommendation =
  | "INSUFFICIENT_DATA"
  | "BUILD"
  | "CONTINUE_VALIDATING"
  | "LAUNCH"
  | "ITERATE"
  | "SCALE"
  | "KILL";

/** Which decision_type a computed recommendation logs as, when a user sends
 * it to the Decision Queue — shared between server pages (to look up an
 * existing pending decision of the matching type) and the client card that
 * creates one. INSUFFICIENT_DATA has no decision_type: there is nothing to
 * decide yet. */
export const RECOMMENDATION_TO_DECISION_TYPE: Partial<Record<Recommendation, DecisionType>> = {
  BUILD: "approve_build",
  LAUNCH: "launch",
  SCALE: "scale",
  CONTINUE_VALIDATING: "continue_validating",
  ITERATE: "iterate",
  KILL: "kill",
};

/** A named reason code per signal that fired, so the UI can explain a
 * recommendation as a list of evaluated conditions rather than only a
 * prose sentence. */
export type RecommendationReasonCode =
  | "insufficient_exposure"
  | "no_activation_after_traffic"
  | "no_monetization_after_activation"
  | "negative_economics_after_investment"
  | "validated_purchases"
  | "scale_signals_corroborated"
  | "some_positive_signal"
  | "no_signal_yet";

export interface RecommendationResult {
  recommendation: Recommendation;
  reasonCodes: RecommendationReasonCode[];
  reasons: string[];
  evidence: Record<string, number | string | null>;
}

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
      reasonCodes: ["validated_purchases"],
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
      reasonCodes: ["no_activation_after_traffic"],
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
      reasonCodes: ["no_monetization_after_activation"],
      reasons: [
        `${totals.activatedUsers} activated users but $0 revenue — meaningful usage without willingness to pay.`,
      ],
      evidence,
    };
  }

  return {
    recommendation: "CONTINUE_VALIDATING",
    reasonCodes: ["no_signal_yet"],
    reasons: [
      "Evidence so far is inconclusive — not enough signal yet to build or kill confidently.",
    ],
    evidence,
  };
}

/**
 * Post-launch product recommendation, as an explicit decision matrix
 * instead of a first-match if-chain (P1.5 remediation). Confirmed bug this
 * replaces: a single incidental returning user, or the exact activation
 * count relative to an arbitrary threshold, could flip the verdict between
 * "not enough data" and "iterate" for data that was unambiguously bad
 * (real traffic, real losses, zero revenue). The fix has two parts:
 *
 * 1. A sufficiency gate up front — INSUFFICIENT_DATA is now reserved for
 *    products that genuinely haven't been exposed to enough traffic or
 *    time to judge, not used as a fallback for "none of my branches
 *    matched."
 * 2. SCALE requires several positive signals to agree (§20's own framing),
 *    so no single metric — a returning user, a dollar of revenue — can
 *    carry a verdict on its own the way it could before.
 */
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
    mrr_cents: pnl.mrrCents,
    net_profit_cents: pnl.netProfitCents,
    profit_per_hour_cents: pnl.profitPerHourCents,
    total_hours: pnl.totalHours,
  };

  const hasSufficientExposure =
    totals.visitors >= SUFFICIENCY_THRESHOLDS.minVisitorsForJudgment ||
    pnl.totalHours >= SUFFICIENCY_THRESHOLDS.minHoursForJudgment;

  if (!hasSufficientExposure) {
    return {
      recommendation: "INSUFFICIENT_DATA",
      reasonCodes: ["insufficient_exposure"],
      reasons: [
        `Only ${totals.visitors} visitor${totals.visitors === 1 ? "" : "s"} and ${pnl.totalHours} hour${pnl.totalHours === 1 ? "" : "s"} invested so far — too little exposure to judge KILL or SCALE yet.`,
      ],
      evidence,
    };
  }

  // --- KILL: any one of these is independently decisive (§19 treats each
  // of its kill criteria as sufficient on its own, not requiring
  // corroboration — killing is meant to be the easy, low-regret call). ---

  if (
    totals.visitors >= KILL_CRITERIA_THRESHOLDS.minVisitorsForActivationCheck &&
    totals.activatedUsers === 0
  ) {
    return {
      recommendation: "KILL",
      reasonCodes: ["no_activation_after_traffic"],
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
      reasonCodes: ["no_monetization_after_activation"],
      reasons: [
        `${totals.activatedUsers} activated users but $0 revenue — usage without willingness to pay.`,
      ],
      evidence,
    };
  }

  if (
    pnl.totalHours >= KILL_CRITERIA_THRESHOLDS.minHoursForEconomicsCheck &&
    totals.revenueCents === 0 &&
    pnl.netProfitCents < 0
  ) {
    return {
      recommendation: "KILL",
      reasonCodes: ["negative_economics_after_investment"],
      reasons: [
        `${pnl.totalHours} hours invested, $0 revenue, and a net loss of ${(Math.abs(pnl.netProfitCents) / 100).toFixed(2)} — economics do not justify continuing.`,
      ],
      evidence,
    };
  }

  // --- SCALE: requires corroboration across independent signals, not any
  // one metric alone (see SCALE_MIN_POSITIVE_SIGNALS rationale above). ---

  const positiveSignals = {
    everCollectedRevenue: totals.revenueCents > 0,
    currentMrr: pnl.mrrCents > 0,
    realRetention: totals.returningUsers >= MIN_RETURNING_USERS_FOR_RETENTION_SIGNAL,
    profitableUnitEconomics: pnl.mrrCents > 0 && (pnl.profitPerHourCents ?? 0) > 0,
  };
  const positiveSignalCount = Object.values(positiveSignals).filter(Boolean).length;

  if (positiveSignalCount >= SCALE_MIN_POSITIVE_SIGNALS) {
    return {
      recommendation: "SCALE",
      reasonCodes: ["scale_signals_corroborated"],
      reasons: [
        `${positiveSignalCount}/4 independent positive signals agree: ` +
          [
            positiveSignals.everCollectedRevenue && "real revenue collected",
            positiveSignals.currentMrr && `positive current MRR ($${(pnl.mrrCents / 100).toFixed(2)})`,
            positiveSignals.realRetention && `${totals.returningUsers} returning users`,
            positiveSignals.profitableUnitEconomics && "profitable unit economics",
          ]
            .filter(Boolean)
            .join(", ") +
          ".",
      ],
      evidence,
    };
  }

  if (positiveSignalCount > 0) {
    return {
      recommendation: "ITERATE",
      reasonCodes: ["some_positive_signal"],
      reasons: [
        `${positiveSignalCount}/4 positive signal${positiveSignalCount === 1 ? "" : "s"} present, but not enough corroboration yet for SCALE — worth continued iteration, not yet a scale-up case.`,
      ],
      evidence,
    };
  }

  return {
    recommendation: "CONTINUE_VALIDATING",
    reasonCodes: ["no_signal_yet"],
    reasons: [
      "Meaningful exposure so far, but no positive signal (revenue, retention, or MRR) and no single kill trigger either — keep watching before deciding either way.",
    ],
    evidence,
  };
}
