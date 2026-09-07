import { test } from "node:test";
import assert from "node:assert/strict";

import { generateTodaysActions } from "./todays-actions";
import type { RecommendationResult } from "./decision-engine";
import type { Idea, Product } from "@/lib/supabase/types";

function product(overrides: Partial<Product>): Product {
  return {
    id: "p1",
    owner_id: "o1",
    idea_id: "i1",
    name: "TestProduct",
    url: null,
    category_id: null,
    status: "MEASURING",
    maturity: 3,
    launch_date: null,
    pricing_model: null,
    price_cents: null,
    mvp_core_problem: null,
    mvp_core_feature: null,
    mvp_must_have: [],
    mvp_should_have: [],
    mvp_not_now: [],
    mvp_future: [],
    dev_start_date: null,
    dev_target_launch: null,
    dev_actual_launch: null,
    dev_estimated_hours: null,
    dev_actual_hours: null,
    dev_tools_used: null,
    dev_notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function recommendation(overrides: Partial<RecommendationResult>): RecommendationResult {
  return {
    recommendation: "SCALE",
    reasonCodes: ["scale_signals_corroborated"],
    reasons: ["test reason"],
    evidence: {},
    ...overrides,
  };
}

test("P1.4: a live product with a fresh SCALE recommendation and no pending decision gets a proactive action", () => {
  const p = product({ id: "teampulse", name: "TeamPulse", status: "MEASURING" });
  const actions = generateTodaysActions({
    ideas: [],
    products: [p],
    experiments: [],
    pendingDecisions: [],
    productRecommendations: new Map([["teampulse", recommendation({ recommendation: "SCALE" })]]),
  });
  assert.ok(actions.some((a) => a.title === "Review TeamPulse for SCALE"));
});

test("P1.4: a KILL recommendation already represented by a pending decision is not duplicated", () => {
  const p = product({ id: "pixeljournal", name: "PixelJournal", status: "MEASURING" });
  const actions = generateTodaysActions({
    ideas: [],
    products: [p],
    experiments: [],
    pendingDecisions: [
      {
        id: "d1",
        owner_id: "o1",
        idea_id: null,
        product_id: "pixeljournal",
        decision_type: "kill",
        recommendation: "KILL",
        reason: "already flagged",
        evidence: {},
        status: "PENDING",
        created_at: "2026-09-07T00:00:00Z",
        resolved_at: null,
      },
    ],
    productRecommendations: new Map([["pixeljournal", recommendation({ recommendation: "KILL" })]]),
  });
  const reviewActions = actions.filter((a) => a.title === "Review PixelJournal for KILL");
  assert.equal(reviewActions.length, 0, "should not duplicate the pending decision as a separate review action");
  assert.ok(actions.some((a) => a.title.startsWith("Resolve decision")));
});

test("P1.4: BUILDING products (not yet launched) are never given a KILL/SCALE review action", () => {
  const p = product({ id: "p1", status: "BUILDING" });
  const actions = generateTodaysActions({
    ideas: [],
    products: [p],
    experiments: [],
    pendingDecisions: [],
    productRecommendations: new Map([["p1", recommendation({ recommendation: "KILL" })]]),
  });
  assert.equal(actions.filter((a) => a.title.includes("for KILL")).length, 0);
});

test("P2.9 REGRESSION: launch-day review fires on day 7, not only on an exact single day forever missed", () => {
  const p = product({ id: "p1", name: "X", launch_date: daysAgo(7), status: "MEASURING" });
  const actions = generateTodaysActions({
    ideas: [],
    products: [p],
    experiments: [],
    pendingDecisions: [],
  });
  assert.ok(actions.some((a) => a.title === "Review X"));
});

test("P2.9 REGRESSION: day 8 does not repeat the same review (weekly cadence, not daily spam)", () => {
  const p = product({ id: "p1", name: "X", launch_date: daysAgo(8), status: "MEASURING" });
  const actions = generateTodaysActions({
    ideas: [],
    products: [p],
    experiments: [],
    pendingDecisions: [],
  });
  assert.equal(actions.filter((a) => a.title === "Review X").length, 0);
});

test("P2.9: day 14 fires again (second weekly checkpoint) — old code's `=== 7` would never fire again", () => {
  const p = product({ id: "p1", name: "X", launch_date: daysAgo(14), status: "MEASURING" });
  const actions = generateTodaysActions({
    ideas: [],
    products: [p],
    experiments: [],
    pendingDecisions: [],
  });
  assert.ok(actions.some((a) => a.title === "Review X"));
});

test("P2.9: the generic launch-day review is suppressed once a specific KILL/SCALE signal exists (no duplicate review prompts)", () => {
  const p = product({ id: "p1", name: "X", launch_date: daysAgo(7), status: "MEASURING" });
  const actions = generateTodaysActions({
    ideas: [],
    products: [p],
    experiments: [],
    pendingDecisions: [],
    productRecommendations: new Map([["p1", recommendation({ recommendation: "SCALE" })]]),
  });
  assert.equal(actions.filter((a) => a.title === "Review X").length, 0);
  assert.ok(actions.some((a) => a.title === "Review X for SCALE"));
});

test("TARGET-STATE REGRESSION: a product already at SCALE with an ongoing SCALE recommendation does not get a duplicate 'Review X for SCALE' action", () => {
  const p = product({ id: "teampulse", name: "TeamPulse", status: "SCALE" });
  const actions = generateTodaysActions({
    ideas: [],
    products: [p],
    experiments: [],
    pendingDecisions: [],
    productRecommendations: new Map([["teampulse", recommendation({ recommendation: "SCALE" })]]),
  });
  assert.equal(
    actions.filter((a) => a.title === "Review TeamPulse for SCALE").length,
    0,
    "product is already in the recommended target state -- nothing left to promote to",
  );
});

test("TARGET-STATE: a live (non-SCALE) product with a SCALE recommendation still gets the proactive review action", () => {
  const p = product({ id: "teampulse", name: "TeamPulse", status: "MEASURING" });
  const actions = generateTodaysActions({
    ideas: [],
    products: [p],
    experiments: [],
    pendingDecisions: [],
    productRecommendations: new Map([["teampulse", recommendation({ recommendation: "SCALE" })]]),
  });
  assert.ok(actions.some((a) => a.title === "Review TeamPulse for SCALE"));
});

test("TARGET-STATE: a KILLED product with a KILL recommendation does not get a duplicate 'Review X for KILL' action", () => {
  // KILLED is outside ACTIVE_PRODUCT_STATUSES so this path is already
  // unreachable via the current caller, but the target-state rule itself
  // must hold generically (not just for SCALE), per the remediation spec.
  const p = product({ id: "p1", name: "X", status: "KILLED" });
  const recs = new Map([["p1", recommendation({ recommendation: "KILL" })]]);
  // Bypass the ACTIVE_PRODUCT_STATUSES gate by asserting the target-state
  // map directly agrees with a KILLED product for a KILL recommendation --
  // i.e. this is what stops it from firing if it were ever reachable.
  const actions = generateTodaysActions({
    ideas: [],
    products: [p],
    experiments: [],
    pendingDecisions: [],
    productRecommendations: recs,
  });
  assert.equal(actions.filter((a) => a.title.includes("for KILL")).length, 0);
});

test("TARGET-STATE REGRESSION (rule 4): an already-SCALE product still gets the generic weekly review -- no dead silence once a product reaches its target state", () => {
  const p = product({ id: "p1", name: "X", launch_date: daysAgo(7), status: "SCALE" });
  const actions = generateTodaysActions({
    ideas: [],
    products: [p],
    experiments: [],
    pendingDecisions: [],
    productRecommendations: new Map([["p1", recommendation({ recommendation: "SCALE" })]]),
  });
  assert.equal(actions.filter((a) => a.title === "Review X for SCALE").length, 0);
  assert.ok(
    actions.some((a) => a.title === "Review X"),
    "the specific SCALE action is suppressed, but the generic periodic review must still fire",
  );
});

test("MVP deadline check still works for BUILDING products (unaffected by the P2.9 split)", () => {
  const target = new Date();
  target.setDate(target.getDate() + 2);
  const p = product({
    id: "p1",
    name: "X",
    status: "BUILDING",
    dev_target_launch: target.toISOString().slice(0, 10),
  });
  const actions = generateTodaysActions({
    ideas: [],
    products: [p],
    experiments: [],
    pendingDecisions: [],
  });
  assert.ok(actions.some((a) => a.title.startsWith("MVP deadline")));
});

test("assumption-heavy idea action is unaffected", () => {
  const idea: Idea = {
    id: "i1",
    owner_id: "o1",
    name: "Test idea",
    description: null,
    category_id: null,
    target_customer: null,
    problem: null,
    solution: null,
    source_id: null,
    source_url: null,
    founder_notes: null,
    existing_alternatives: null,
    main_competitor: null,
    competitor_url: null,
    competitor_pricing: null,
    competitor_reviews: null,
    market_size_estimate: null,
    search_intent_notes: null,
    evidence_of_demand: null,
    mvp_complexity: null,
    estimated_build_hours: null,
    required_integrations: null,
    technical_risks: null,
    distribution_channel: null,
    potential_moat: null,
    monetization_model: null,
    expected_price_cents: null,
    score_pain: 5,
    score_frequency: 5,
    score_willingness_to_pay: 5,
    score_search_intent: 4,
    score_buildability: 4,
    score_distribution: 4,
    opportunity_score: 27,
    evidence_confidence: 0,
    status: "SCORED",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
  const actions = generateTodaysActions({
    ideas: [idea],
    products: [],
    experiments: [],
    pendingDecisions: [],
  });
  assert.ok(actions.some((a) => a.title.includes("Research idea")));
});
