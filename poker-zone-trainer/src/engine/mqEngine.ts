// Module 2 judge: M/Q-ratio push/fold decisions. Deterministic, formula-driven — no LLM.
//
// M = effective stack / (SB + BB + total antes).
// Q = M adjusted for how many players still have to act behind (a shove into 3 live
// players behind is riskier than a shove on the button with only the blinds behind),
// used here as a mild tightening/loosening adjustment on top of the M-zone base range.

import { Action, BaseRangeTableEntry, ConfidenceLabel, DecisionResult, MZone, mZoneForM } from "../types/domain";
import { handPercentile, PREMIUM_HANDS } from "./handRank";

const BORDERLINE_BAND = 0.03;

export interface MqInput {
  handCode: string;
  position: string;
  m: number;
  playersLeftToAct: number;
}

/** Q-ratio adjustment: more players behind -> tighten effective threshold slightly. */
function qAdjustment(playersLeftToAct: number): number {
  const clamped = Math.max(0, Math.min(6, playersLeftToAct));
  return 1 - clamped * 0.03; // up to -18% at 6 players behind
}

export function judgeMqDecision(input: MqInput, table: BaseRangeTableEntry[]): DecisionResult {
  const zone: MZone = mZoneForM(input.m);
  const entry = table.find((row) => row.module === "mq" && row.context === input.position && row.zone === zone);
  if (!entry) throw new Error(`No mq base table entry for ${input.position}/${zone}`);

  if (PREMIUM_HANDS.includes(input.handCode)) {
    return { action: entry.action, confidence: "verified" };
  }

  const adjustedFraction = Math.min(1, entry.openFraction * qAdjustment(input.playersLeftToAct));
  const percentile = handPercentile(input.handCode);
  const shoves = percentile < adjustedFraction;
  const isNearThreshold = Math.abs(percentile - adjustedFraction) <= BORDERLINE_BAND;

  const action: Action = shoves ? entry.action : "FOLD";
  const confidence: ConfidenceLabel = isNearThreshold ? "borderline" : "verified";
  return { action, confidence };
}
