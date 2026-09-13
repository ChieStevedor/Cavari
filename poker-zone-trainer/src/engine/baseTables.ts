// Base range tables — the actual training content, encoded directly here per
// Alex's decision (2026-09-13) rather than waiting on manual authoring in Supabase's
// `ranges_tables` (content pipeline step 1 still applies for future edits/review,
// it's just that the *starting* values ship in code instead of being blank).
//
// Modules 1 and 2 (opening ranges, push/fold shove ranges) are sized to match
// widely-published full-ring tournament ranges and Dan Harrington's M-ratio zone
// system — see BUILD_PROMPT.md for why the app never names that system in-app.
// These are informed approximations of commonly-cited percentages, not a literal
// reproduction of any book's per-hand chart. Module 3 (postflop by zone) has no
// equivalent published chart to approximate — short-stack zones in that system are
// mostly "shove preflop, no postflop decision to make" — so its thresholds are the
// app's own zone-aggression heuristic by design, not a stand-in for missing content.

import { Action, BaseRangeTableEntry, MZone, M_ZONES, RANGE_POSITIONS, SHOVE_POSITIONS } from "../types/domain";

// Module 1 — opening ranges (raise-first-in) by position, full 9-handed table minus
// blinds. Monotonically widening UTG -> BTN, matching commonly-cited full-ring RFI%.
const RANGES_OPEN_FRACTION: Record<(typeof RANGE_POSITIONS)[number], number> = {
  UTG: 0.1,
  UTG1: 0.12,
  MP1: 0.15,
  MP2: 0.18,
  HJ: 0.22,
  CO: 0.28,
  BTN: 0.42,
};

// Module 2 — push/fold shove ranges by position and M-zone. Widens both as position
// gets later AND as M-zone gets shorter (GREEN -> RED), per the Zone/M-ratio system:
// Green-zone shoves are rare (normal play, not push/fold, so only very strong hands
// shove first-in); Red-zone shoves get wide, especially from the blinds.
const MQ_ZONE_MULTIPLIER: Record<MZone, number> = {
  GREEN: 0.4,
  YELLOW: 0.75,
  ORANGE: 1.2,
  RED: 1.8,
};
const MQ_BASE_FRACTION: Record<(typeof SHOVE_POSITIONS)[number], number> = {
  UTG: 0.06,
  UTG1: 0.08,
  MP1: 0.1,
  MP2: 0.13,
  HJ: 0.16,
  CO: 0.2,
  BTN: 0.3,
  SB: 0.38,
  BB: 0.45,
};

// Module 3 — postflop action by stack zone. `openFraction` here is the minimum hand
// strength (0..1) required to take the zone's aggressive action, and is authored to
// DECREASE monotonically Green -> Red (shorter stacks commit aggressively with
// weaker hands). The passive action per zone is also non-decreasing in aggression
// Green -> Red. Together this guarantees, by construction, that Red's resulting
// action is never less aggressive than Green's for the same hand bucket — see
// scripts/validate-invariants.ts.
const POSTFLOP_AGGRESSION_THRESHOLD: Record<MZone, number> = {
  GREEN: 0.72,
  YELLOW: 0.55,
  ORANGE: 0.38,
  RED: 0.18,
};
const POSTFLOP_AGGRESSIVE_ACTION: Record<MZone, Action> = {
  GREEN: "BET",
  YELLOW: "BET",
  ORANGE: "RAISE",
  RED: "ALL_IN",
};

export function rangesBaseTable(): BaseRangeTableEntry[] {
  return RANGE_POSITIONS.map((position) => ({
    module: "ranges",
    context: position,
    openFraction: RANGES_OPEN_FRACTION[position],
    action: "RAISE",
  }));
}

export function mqBaseTable(): BaseRangeTableEntry[] {
  const rows: BaseRangeTableEntry[] = [];
  for (const position of SHOVE_POSITIONS) {
    for (const zone of M_ZONES) {
      const fraction = Math.min(1, MQ_BASE_FRACTION[position] * MQ_ZONE_MULTIPLIER[zone]);
      rows.push({ module: "mq", context: position, zone, openFraction: fraction, action: "ALL_IN" });
    }
  }
  return rows;
}

export function postflopBaseTable(): BaseRangeTableEntry[] {
  return M_ZONES.map((zone) => ({
    module: "postflop",
    context: "postflop",
    zone,
    openFraction: POSTFLOP_AGGRESSION_THRESHOLD[zone],
    action: POSTFLOP_AGGRESSIVE_ACTION[zone],
  }));
}

export function allBaseTables(): BaseRangeTableEntry[] {
  return [...rangesBaseTable(), ...mqBaseTable(), ...postflopBaseTable()];
}
