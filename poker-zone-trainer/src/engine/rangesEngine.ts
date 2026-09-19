// Module 1 judge: positional opening ranges. Deterministic, formula-driven — no LLM.

import { Action, BaseRangeTableEntry, ConfidenceLabel, DecisionResult } from "../types/domain";
import { handPercentile, PREMIUM_HANDS } from "./handRank";

const BORDERLINE_BAND = 0.03; // hands within +/-3 percentile points of the threshold are "borderline"

export function judgeRangesDecision(
  handCode: string,
  position: string,
  table: BaseRangeTableEntry[]
): DecisionResult {
  const entry = table.find((row) => row.module === "ranges" && row.context === position);
  if (!entry) throw new Error(`No ranges base table entry for position ${position}`);

  if (PREMIUM_HANDS.includes(handCode)) {
    return { action: entry.action, confidence: "verified" };
  }

  const percentile = handPercentile(handCode);
  const isOpen = percentile < entry.openFraction;
  const isNearThreshold = Math.abs(percentile - entry.openFraction) <= BORDERLINE_BAND;

  const action: Action = isOpen ? entry.action : "FOLD";
  const confidence: ConfidenceLabel = isNearThreshold ? "borderline" : "verified";
  return { action, confidence };
}
