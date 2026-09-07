import { test } from "node:test";
import assert from "node:assert/strict";

import { evaluateDecisionConfirmation } from "./decision-validation";
import type { Decision } from "@/lib/supabase/types";

function decision(overrides: Partial<Decision>): Decision {
  return {
    id: "d1",
    owner_id: "o1",
    idea_id: null,
    product_id: "teampulse",
    decision_type: "kill",
    recommendation: "KILL",
    reason: "stale reason",
    evidence: {},
    status: "PENDING",
    created_at: "2026-07-14T00:00:00Z",
    resolved_at: null,
    ...overrides,
  };
}

test("BUG REGRESSION: a stale KILL decision must NOT execute against a product that now recommends SCALE", () => {
  const verdict = evaluateDecisionConfirmation({
    decision: decision({ decision_type: "kill", recommendation: "KILL" }),
    currentStatus: "MEASURING",
    currentRecommendation: "SCALE", // this is what TeamPulse's real data says today
    otherPendingDecisions: [],
    canTransition: true, // MEASURING -> KILLED is a legal transition in isolation
    nextStatus: "KILLED",
  });

  assert.equal(verdict.ok, false);
  if (!verdict.ok) {
    assert.equal(verdict.reason, "stale_recommendation");
    assert.equal(verdict.currentRecommendation, "SCALE");
  }
});

test("a fresh KILL decision that still matches the current recommendation is allowed", () => {
  const verdict = evaluateDecisionConfirmation({
    decision: decision({ decision_type: "kill", recommendation: "KILL" }),
    currentStatus: "MEASURING",
    currentRecommendation: "KILL",
    otherPendingDecisions: [],
    canTransition: true,
    nextStatus: "KILLED",
  });
  assert.equal(verdict.ok, true);
  if (verdict.ok) assert.equal(verdict.nextStatus, "KILLED");
});

test("a fresh SCALE decision that still matches is allowed and maps to SCALE status", () => {
  const verdict = evaluateDecisionConfirmation({
    decision: decision({ decision_type: "scale", recommendation: "SCALE" }),
    currentStatus: "MEASURING",
    currentRecommendation: "SCALE",
    otherPendingDecisions: [],
    canTransition: true,
    nextStatus: "SCALE",
  });
  assert.equal(verdict.ok, true);
});

test("blocks when the subject already left the status this decision assumed (invalid_transition)", () => {
  const verdict = evaluateDecisionConfirmation({
    decision: decision({ decision_type: "kill" }),
    currentStatus: "ARCHIVED", // e.g. already archived by another action
    currentRecommendation: "KILL",
    otherPendingDecisions: [],
    canTransition: false, // ARCHIVED -> KILLED is not a legal transition
    nextStatus: "KILLED",
  });
  assert.equal(verdict.ok, false);
  if (!verdict.ok) assert.equal(verdict.reason, "invalid_transition");
});

test("blocks on a conflicting pending decision for the same subject, even if this one would otherwise be valid", () => {
  const verdict = evaluateDecisionConfirmation({
    decision: decision({ decision_type: "kill", recommendation: "KILL" }),
    currentStatus: "MEASURING",
    currentRecommendation: "KILL", // matches! but...
    otherPendingDecisions: [
      { id: "d2", decision_type: "scale", recommendation: "SCALE", created_at: "2026-09-01T00:00:00Z" },
    ],
    canTransition: true,
    nextStatus: "KILLED",
  });
  assert.equal(verdict.ok, false);
  if (!verdict.ok) {
    assert.equal(verdict.reason, "conflicting_decisions");
    assert.equal(verdict.conflictingDecisions?.length, 1);
  }
});

test("blocks confirming an already-resolved decision", () => {
  const verdict = evaluateDecisionConfirmation({
    decision: decision({ status: "DISMISSED" }),
    currentStatus: "MEASURING",
    currentRecommendation: "KILL",
    otherPendingDecisions: [],
    canTransition: true,
    nextStatus: "KILLED",
  });
  assert.equal(verdict.ok, false);
  if (!verdict.ok) assert.equal(verdict.reason, "already_resolved");
});

test("decision types with no engine-produced counterpart (e.g. approve_validation) skip the staleness check", () => {
  const verdict = evaluateDecisionConfirmation({
    decision: decision({ decision_type: "approve_validation", recommendation: "APPROVE" }),
    currentStatus: "SCORED",
    currentRecommendation: null,
    otherPendingDecisions: [],
    canTransition: true,
    nextStatus: "VALIDATING",
  });
  assert.equal(verdict.ok, true);
});

test("exact-match is strict: ITERATE decision is blocked even when things improved to SCALE (conservative by design)", () => {
  const verdict = evaluateDecisionConfirmation({
    decision: decision({ decision_type: "iterate", recommendation: "ITERATE" }),
    currentStatus: "MEASURING",
    currentRecommendation: "SCALE",
    otherPendingDecisions: [],
    canTransition: true,
    nextStatus: "ITERATING",
  });
  assert.equal(verdict.ok, false);
  if (!verdict.ok) assert.equal(verdict.reason, "stale_recommendation");
});
