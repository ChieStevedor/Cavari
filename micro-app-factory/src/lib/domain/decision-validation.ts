// Decision confirmation safety net (P0.1 remediation). Confirmed bug:
// confirmDecision() used to apply a PENDING decision's status change
// unconditionally, with no re-check against current data. A 55-day-old
// KILL decision was confirmed against a product that had since become a
// clear SCALE candidate, and it was silently killed.
//
// This module is pure — no I/O — so it's fully unit-testable. The actual
// re-fetching and writing happens in actions/decisions.ts.

import type { Decision, DecisionType } from "@/lib/supabase/types";
import type { Recommendation } from "@/lib/domain/decision-engine";

/**
 * The one Recommendation value each decision_type is expected to still
 * match at confirm time. Intentionally an exact-match rule, not "current is
 * at least as good" — if the situation has moved from ITERATE to SCALE
 * since the decision was created, that's still a different decision the
 * founder should consciously see and confirm, not ride an old one into.
 * Types with no entry (approve_validation, launch, change_pricing,
 * increase_marketing_budget) aren't currently produced by the
 * recommendation engine, so there's nothing to re-check them against —
 * confirmation for those only goes through the transition/conflict checks.
 */
export const DECISION_TYPE_EXPECTED_RECOMMENDATION: Partial<
  Record<DecisionType, Recommendation>
> = {
  kill: "KILL",
  scale: "SCALE",
  approve_build: "BUILD",
  continue_validating: "CONTINUE_VALIDATING",
  iterate: "ITERATE",
};

export type ConfirmBlockReason =
  | "already_resolved"
  | "conflicting_decisions"
  | "invalid_transition"
  | "stale_recommendation";

export interface ConflictingDecisionSummary {
  id: string;
  decision_type: DecisionType;
  recommendation: string;
  created_at: string;
}

export interface ConfirmBlockedResult {
  ok: false;
  reason: ConfirmBlockReason;
  message: string;
  requestedDecisionType: DecisionType;
  requestedRecommendation: string;
  decisionCreatedAt: string;
  currentStatus: string;
  currentRecommendation?: Recommendation;
  conflictingDecisions?: ConflictingDecisionSummary[];
}

export interface ConfirmAllowedResult {
  ok: true;
  /** Status to write, if this decision_type maps to one for this subject
   * kind. Undefined for decision types with no status effect. */
  nextStatus?: string;
}

export function evaluateDecisionConfirmation(input: {
  decision: Decision;
  /** The subject's status as of right now (freshly re-fetched, not from
   * whenever the decision was created). */
  currentStatus: string;
  /** Recomputed by re-running the real recommendation engine against
   * freshly re-fetched metrics. Null when this decision_type has no
   * engine-produced counterpart to check (see the map above). */
  currentRecommendation: Recommendation | null;
  /** Other PENDING decisions on the same subject, excluding this one. */
  otherPendingDecisions: ConflictingDecisionSummary[];
  /** Whether currentStatus -> the decision's mapped target status is a
   * legal transition (via canTransitionIdea/canTransitionProduct). */
  canTransition: boolean;
  /** The status this decision would apply, if confirmed and valid. */
  nextStatus: string | undefined;
}): ConfirmBlockedResult | ConfirmAllowedResult {
  const { decision } = input;

  if (decision.status !== "PENDING") {
    return {
      ok: false,
      reason: "already_resolved",
      message: `This decision was already ${decision.status.toLowerCase()} — nothing to confirm.`,
      requestedDecisionType: decision.decision_type,
      requestedRecommendation: decision.recommendation,
      decisionCreatedAt: decision.created_at,
      currentStatus: input.currentStatus,
    };
  }

  if (input.otherPendingDecisions.length > 0) {
    return {
      ok: false,
      reason: "conflicting_decisions",
      message:
        `${input.otherPendingDecisions.length + 1} pending decisions exist for this ` +
        `subject with different recommendations. Review the conflict before confirming either one.`,
      requestedDecisionType: decision.decision_type,
      requestedRecommendation: decision.recommendation,
      decisionCreatedAt: decision.created_at,
      currentStatus: input.currentStatus,
      conflictingDecisions: input.otherPendingDecisions,
    };
  }

  if (input.nextStatus !== undefined && !input.canTransition) {
    return {
      ok: false,
      reason: "invalid_transition",
      message: `${input.currentStatus} can no longer move to ${input.nextStatus} — the status has changed since this decision was created.`,
      requestedDecisionType: decision.decision_type,
      requestedRecommendation: decision.recommendation,
      decisionCreatedAt: decision.created_at,
      currentStatus: input.currentStatus,
    };
  }

  const expected = DECISION_TYPE_EXPECTED_RECOMMENDATION[decision.decision_type];
  if (
    expected !== undefined &&
    input.currentRecommendation !== null &&
    input.currentRecommendation !== expected
  ) {
    return {
      ok: false,
      reason: "stale_recommendation",
      message:
        `This decision recommended ${decision.recommendation.replace("_", " ")}, but current data now ` +
        `recommends ${input.currentRecommendation.replace("_", " ")}. Confirming was blocked — the ` +
        `situation has changed since ${new Date(decision.created_at).toLocaleDateString()}.`,
      requestedDecisionType: decision.decision_type,
      requestedRecommendation: decision.recommendation,
      decisionCreatedAt: decision.created_at,
      currentStatus: input.currentStatus,
      currentRecommendation: input.currentRecommendation,
    };
  }

  return { ok: true, nextStatus: input.nextStatus };
}
