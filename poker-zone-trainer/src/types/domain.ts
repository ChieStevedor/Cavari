// Shared domain types. These mirror the Supabase schema 1:1 (see supabase/migrations)
// so the client, the generator script, and the validator script all agree on shape.

export type ModuleId = "ranges" | "mq" | "postflop";

export const MODULE_IDS: ModuleId[] = ["ranges", "mq", "postflop"];

/** Positions used by the opening-range module (module 1). Ordered narrowest -> widest. */
export type RangePosition = "UTG" | "MP" | "CO" | "BTN";
export const RANGE_POSITIONS: RangePosition[] = ["UTG", "MP", "CO", "BTN"];

/** Positions used by the push/fold M/Q module (module 2). Ordered narrowest -> widest. */
export type ShovePosition = "UTG" | "MP" | "CO" | "BTN" | "SB" | "BB";
export const SHOVE_POSITIONS: ShovePosition[] = ["UTG", "MP", "CO", "BTN", "SB", "BB"];

/**
 * Stack-depth "M-ratio" zones, ordered deepest -> shortest.
 * M = effective stack / (small blind + big blind + total antes).
 * Zone naming (Green/Yellow/Orange/Red) is our own terminology for stack-depth
 * buckets and is not attributed to any named external methodology in-app.
 */
export type MZone = "GREEN" | "YELLOW" | "ORANGE" | "RED";
export const M_ZONES: MZone[] = ["GREEN", "YELLOW", "ORANGE", "RED"];
export const M_ZONE_THRESHOLDS: Record<MZone, { min: number; max: number }> = {
  GREEN: { min: 20, max: Infinity },
  YELLOW: { min: 10, max: 20 },
  ORANGE: { min: 6, max: 10 },
  RED: { min: 0, max: 6 },
};

export function mZoneForM(m: number): MZone {
  if (m >= M_ZONE_THRESHOLDS.GREEN.min) return "GREEN";
  if (m >= M_ZONE_THRESHOLDS.YELLOW.min) return "YELLOW";
  if (m >= M_ZONE_THRESHOLDS.ORANGE.min) return "ORANGE";
  return "RED";
}

/** Postflop hand-strength buckets used by module 3 (kept coarse on purpose — this is a
 * zone-driven simplified trainer, not a solver). */
export type HandBucket = "PREMIUM" | "STRONG" | "MEDIUM" | "WEAK" | "DRAW";
export const HAND_BUCKETS: HandBucket[] = ["PREMIUM", "STRONG", "MEDIUM", "WEAK", "DRAW"];

export type Action =
  | "FOLD"
  | "CALL"
  | "RAISE"
  | "ALL_IN"
  | "CHECK"
  | "BET";

/** Relative aggression ordering, used by the invariant validator to compare actions
 * (e.g. "Red zone must be at least as aggressive as Green for the same hand"). */
export const ACTION_AGGRESSION: Record<Action, number> = {
  FOLD: 0,
  CHECK: 1,
  CALL: 2,
  BET: 3,
  RAISE: 4,
  ALL_IN: 5,
};

export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // 11=J .. 14=A

export interface StartingHand {
  /** Canonical form, e.g. "AKs", "TT", "72o". Pairs have no suffix. */
  code: string;
  high: Rank;
  low: Rank;
  suited: boolean;
  isPair: boolean;
}

export type ConfidenceLabel = "verified" | "borderline";

/** A row of a base range table, as authored manually by Alex (content pipeline step 1).
 * Lives in Supabase (ranges_tables), never hardcoded in the shipped app bundle. */
export interface BaseRangeTableEntry {
  module: ModuleId;
  /** Position for 'ranges'/'mq', or hand bucket context key for 'postflop'. */
  context: string;
  /** M-zone, only meaningful for 'mq' and 'postflop'. */
  zone?: MZone;
  /** Fraction [0,1] of the 169-hand grid (by strength score) that takes the aggressive
   * action in this context, e.g. 0.12 = top 12% opens. */
  openFraction: number;
  action: Action;
}

export interface Scenario {
  id: string;
  module: ModuleId;
  hand: string; // StartingHand.code, or postflop bucket-derived hand label
  context: string;
  zone?: MZone;
  correctAction: Action;
  confidence: ConfidenceLabel;
  timerSeconds: number;
}

export interface DecisionResult {
  action: Action;
  confidence: ConfidenceLabel;
}
