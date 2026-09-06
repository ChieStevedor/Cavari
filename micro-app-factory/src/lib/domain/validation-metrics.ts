// Conversion-ratio math for the validation ladder (§11-12). Every ratio
// here can legitimately be undefined (no visitors yet, no signups yet) —
// callers must render that as "—" / "INSUFFICIENT DATA", never as 0% or NaN.

import type { ValidationMetric } from "@/lib/supabase/types";

export function safeDiv(
  numerator: number,
  denominator: number,
): number | null {
  if (!denominator) return null;
  return numerator / denominator;
}

export interface ValidationTotals {
  visitors: number;
  signups: number;
  activatedUsers: number;
  returningUsers: number;
  checkoutStarts: number;
  purchases: number;
  revenueCents: number;
  costCents: number;
  hours: number;
}

export function sumValidationMetrics(
  metrics: ValidationMetric[],
): ValidationTotals {
  return metrics.reduce<ValidationTotals>(
    (acc, m) => ({
      visitors: acc.visitors + m.visitors,
      signups: acc.signups + m.signups,
      activatedUsers: acc.activatedUsers + m.activated_users,
      returningUsers: acc.returningUsers + m.returning_users,
      checkoutStarts: acc.checkoutStarts + m.checkout_starts,
      purchases: acc.purchases + m.purchases,
      revenueCents: acc.revenueCents + m.revenue_cents,
      costCents: acc.costCents + m.cost_cents,
      hours: acc.hours + Number(m.hours),
    }),
    {
      visitors: 0,
      signups: 0,
      activatedUsers: 0,
      returningUsers: 0,
      checkoutStarts: 0,
      purchases: 0,
      revenueCents: 0,
      costCents: 0,
      hours: 0,
    },
  );
}

export interface ValidationRatios {
  landingConversion: number | null;
  activationRate: number | null;
  retentionProxy: number | null;
  paidConversion: number | null;
  revenuePerVisitorCents: number | null;
  revenuePerHourCents: number | null;
}

/** Signups / Visitors */
export function landingConversion(t: ValidationTotals): number | null {
  return safeDiv(t.signups, t.visitors);
}

/** Activated Users / Signups */
export function activationRate(t: ValidationTotals): number | null {
  return safeDiv(t.activatedUsers, t.signups);
}

/** Returning Users / Activated Users */
export function retentionProxy(t: ValidationTotals): number | null {
  return safeDiv(t.returningUsers, t.activatedUsers);
}

/** Purchases / Activated Users */
export function paidConversion(t: ValidationTotals): number | null {
  return safeDiv(t.purchases, t.activatedUsers);
}

/** Revenue / Visitors */
export function revenuePerVisitor(t: ValidationTotals): number | null {
  return safeDiv(t.revenueCents, t.visitors);
}

/** Revenue / Total Hours Invested */
export function revenuePerHour(t: ValidationTotals): number | null {
  return safeDiv(t.revenueCents, t.hours);
}

export function computeValidationRatios(t: ValidationTotals): ValidationRatios {
  return {
    landingConversion: landingConversion(t),
    activationRate: activationRate(t),
    retentionProxy: retentionProxy(t),
    paidConversion: paidConversion(t),
    revenuePerVisitorCents: revenuePerVisitor(t),
    revenuePerHourCents: revenuePerHour(t),
  };
}

export const VALIDATION_LADDER_STAGES = [
  "CLICK",
  "VISIT",
  "SIGNUP",
  "ACTIVATION",
  "RETURN",
  "CHECKOUT",
  "PAYMENT",
] as const;

export type ValidationLadderStage = (typeof VALIDATION_LADDER_STAGES)[number];

/** Maps ladder stages to the totals field that measures them, for the ladder visual. */
export function ladderStageCount(
  stage: ValidationLadderStage,
  t: ValidationTotals,
): number {
  switch (stage) {
    case "CLICK":
    case "VISIT":
      return t.visitors;
    case "SIGNUP":
      return t.signups;
    case "ACTIVATION":
      return t.activatedUsers;
    case "RETURN":
      return t.returningUsers;
    case "CHECKOUT":
      return t.checkoutStarts;
    case "PAYMENT":
      return t.purchases;
  }
}
