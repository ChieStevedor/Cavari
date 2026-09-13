// Module 3 judge: postflop action by stack zone. Deterministic, formula-driven — no LLM.
// Intentionally coarse: this is a zone-driven simplified trainer, not a solver.
//
// Design note: `entry.openFraction` is the minimum hand strength required for the
// zone's aggressive action, and is authored to DECREASE monotonically Green -> Red
// (shorter stacks commit aggressively with weaker hands). The passive action per zone
// is also non-decreasing in aggression Green -> Red. Together this guarantees, by
// construction, that Red's resulting action is never less aggressive than Green's for
// the same hand bucket — see scripts/validate-invariants.ts.

import { Action, ACTION_AGGRESSION, BaseRangeTableEntry, ConfidenceLabel, DecisionResult, HandBucket, MZone } from "../types/domain";

export const BUCKET_STRENGTH: Record<HandBucket, number> = {
  PREMIUM: 0.95,
  STRONG: 0.75,
  MEDIUM: 0.5,
  WEAK: 0.25,
  DRAW: 0.35,
};

export const ZONE_PASSIVE_ACTION: Record<MZone, Action> = {
  GREEN: "CHECK",
  YELLOW: "CHECK",
  ORANGE: "CALL",
  RED: "CALL",
};

const BORDERLINE_BAND = 0.03;

export function judgePostflopDecision(
  bucket: HandBucket,
  zone: MZone,
  table: BaseRangeTableEntry[]
): DecisionResult {
  const entry = table.find((row) => row.module === "postflop" && row.zone === zone);
  if (!entry) throw new Error(`No postflop base table entry for zone ${zone}`);

  const strength = BUCKET_STRENGTH[bucket];
  const isAggressive = strength >= entry.openFraction;
  const isNearThreshold = Math.abs(strength - entry.openFraction) <= BORDERLINE_BAND;

  const action: Action = isAggressive ? entry.action : ZONE_PASSIVE_ACTION[zone];
  const confidence: ConfidenceLabel = isNearThreshold ? "borderline" : "verified";

  // Sanity guard (should be unreachable given authored thresholds/actions — see design
  // note above): never let a passive action outrank the zone's own aggressive action.
  if (ACTION_AGGRESSION[action] > ACTION_AGGRESSION[entry.action]) {
    throw new Error(`Postflop table misconfigured for zone ${zone}: passive action exceeds aggressive action`);
  }

  return { action, confidence };
}
