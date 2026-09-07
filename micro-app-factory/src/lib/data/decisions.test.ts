import { test } from "node:test";
import assert from "node:assert/strict";

import { findConflictingPendingGroups, type DecisionWithSubject } from "./decisions";

function decision(overrides: Partial<DecisionWithSubject>): DecisionWithSubject {
  return {
    id: "d1",
    owner_id: "o1",
    idea_id: null,
    product_id: null,
    decision_type: "kill",
    recommendation: "KILL",
    reason: "test",
    evidence: {},
    status: "PENDING",
    created_at: "2026-08-10T00:00:00Z",
    resolved_at: null,
    idea: null,
    product: null,
    ...overrides,
  };
}

test("findConflictingPendingGroups: flags a stale KILL sitting next to a fresh SCALE for the same product", () => {
  const pending = [
    decision({
      id: "stale-kill",
      product_id: "teampulse",
      decision_type: "kill",
      recommendation: "KILL",
      created_at: "2026-07-14T00:00:00Z",
      product: { id: "teampulse", name: "TeamPulse" },
    }),
    decision({
      id: "fresh-scale",
      product_id: "teampulse",
      decision_type: "scale",
      recommendation: "SCALE",
      created_at: "2026-09-07T00:00:00Z",
      product: { id: "teampulse", name: "TeamPulse" },
    }),
  ];

  const conflicts = findConflictingPendingGroups(pending);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].subjectName, "TeamPulse");
  assert.equal(conflicts[0].decisions.length, 2);
});

test("findConflictingPendingGroups: two decisions of the SAME type is not a conflict (the DB index prevents it anyway)", () => {
  const pending = [
    decision({ id: "a", product_id: "p1", decision_type: "kill" }),
  ];
  assert.equal(findConflictingPendingGroups(pending).length, 0);
});

test("findConflictingPendingGroups: different subjects never conflict with each other", () => {
  const pending = [
    decision({ id: "a", product_id: "p1", decision_type: "kill", product: { id: "p1", name: "A" } }),
    decision({ id: "b", product_id: "p2", decision_type: "scale", product: { id: "p2", name: "B" } }),
  ];
  assert.equal(findConflictingPendingGroups(pending).length, 0);
});
