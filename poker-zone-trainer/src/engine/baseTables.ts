// Placeholder base range tables — the structure Alex will author manually and store
// in Supabase's `ranges_tables` (content pipeline step 1). This module exists so the
// generator/validator/UI have something concrete to run against in development. It is
// NOT vetted poker strategy and must be replaced with Alex-authored values, sourced
// from Supabase, before shipping real content to users.

import { Action, BaseRangeTableEntry, MZone, M_ZONES, RANGE_POSITIONS, SHOVE_POSITIONS } from "../types/domain";

// Module 1 — opening ranges by position. Monotonically widening UTG -> BTN.
const RANGES_OPEN_FRACTION: Record<(typeof RANGE_POSITIONS)[number], number> = {
  UTG: 0.10,
  MP: 0.16,
  CO: 0.26,
  BTN: 0.42,
};

// Module 2 — push/fold shove ranges by position and M-zone. Widens both as position
// gets later AND as M-zone gets shorter (GREEN -> RED).
const MQ_ZONE_MULTIPLIER: Record<MZone, number> = {
  GREEN: 0.55,
  YELLOW: 0.8,
  ORANGE: 1.15,
  RED: 1.6,
};
const MQ_BASE_FRACTION: Record<(typeof SHOVE_POSITIONS)[number], number> = {
  UTG: 0.08,
  MP: 0.12,
  CO: 0.18,
  BTN: 0.28,
  SB: 0.35,
  BB: 0.40,
};

// Module 3 — postflop action by stack zone. `openFraction` here is the minimum hand
// strength (0..1) required to take the zone's aggressive action; it must be
// monotonically DECREASING Green -> Red (shorter stacks need a weaker hand to commit
// aggressively). The paired aggressive action also escalates Green -> Red. Only
// GREEN/RED are invariant-checked (Rule: Red is always at least as aggressive as
// Green for the same hand bucket), but all four zones are populated for real content.
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
