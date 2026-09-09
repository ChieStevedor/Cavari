// Pure scenario generation logic (content pipeline step 2), shared by:
//   - scripts/generate-scenarios.ts (Node, writes Supabase seed files)
//   - src/lib/mock/mockBackend.ts (in-app mock, no real Supabase needed)
//
// No fs/node dependencies here on purpose, so this also runs inside the RN bundle.

import {
  MZone,
  M_ZONES,
  RANGE_POSITIONS,
  SHOVE_POSITIONS,
  Scenario,
  HAND_BUCKETS,
} from "../types/domain";
import { rankedHands } from "./handRank";
import { rangesBaseTable, mqBaseTable, postflopBaseTable } from "./baseTables";
import { judgeRangesDecision } from "./rangesEngine";
import { judgeMqDecision } from "./mqEngine";
import { judgePostflopDecision } from "./postflopEngine";

export const RANGES_TIMER = 9; // 8-10s per the app flow spec
export const MQ_TIMER = 18; // 15-20s per the app flow spec
export const POSTFLOP_TIMER = 18; // not explicitly specified upstream; matched to MQ pending Alex confirmation

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomM(zone: MZone): number {
  const zoneRanges: Record<MZone, [number, number]> = {
    GREEN: [20, 60],
    YELLOW: [10, 19.9],
    ORANGE: [6, 9.9],
    RED: [1, 5.9],
  };
  const [min, max] = zoneRanges[zone];
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

/** Picks a random target count in [min, max], or returns `count` if given. */
function resolveTarget(count: number | undefined, min: number, max: number): number {
  return count ?? min + Math.floor(Math.random() * (max - min));
}

export function generateRangesScenarios(count?: number, min = 150, max = 200): Scenario[] {
  const table = rangesBaseTable();
  const hands = rankedHands();
  const seen = new Set<string>();
  const scenarios: Scenario[] = [];
  const target = Math.min(resolveTarget(count, min, max), hands.length * RANGE_POSITIONS.length);

  while (scenarios.length < target) {
    const hand = pick(hands);
    const position = pick(RANGE_POSITIONS);
    const key = `${hand.code}-${position}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const { action, confidence } = judgeRangesDecision(hand.code, position, table);
    scenarios.push({
      id: `ranges-${key}`,
      module: "ranges",
      hand: hand.code,
      context: position,
      correctAction: action,
      confidence,
      timerSeconds: RANGES_TIMER,
    });
  }
  return scenarios;
}

export function generateMqScenarios(count?: number, min = 150, max = 200): Scenario[] {
  const table = mqBaseTable();
  const hands = rankedHands();
  const seen = new Set<string>();
  const scenarios: Scenario[] = [];
  const target = resolveTarget(count, min, max);

  while (scenarios.length < target) {
    const hand = pick(hands);
    const position = pick(SHOVE_POSITIONS);
    const zone = pick(M_ZONES);
    const playersLeftToAct = Math.floor(Math.random() * 6);
    const m = randomM(zone);
    const key = `${hand.code}-${position}-${zone}-${playersLeftToAct}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const { action, confidence } = judgeMqDecision(
      { handCode: hand.code, position, m, playersLeftToAct },
      table
    );
    scenarios.push({
      id: `mq-${key}`,
      module: "mq",
      hand: hand.code,
      context: `${position}|m=${m}|behind=${playersLeftToAct}`,
      zone,
      correctAction: action,
      confidence,
      timerSeconds: MQ_TIMER,
    });
  }
  return scenarios;
}

export function generatePostflopScenarios(count?: number, min = 150, max = 200): Scenario[] {
  const table = postflopBaseTable();
  const streets = ["FLOP", "TURN", "RIVER"] as const;
  const potTypes = ["SRP", "3BET"] as const;
  const positions = ["IP", "OOP"] as const;
  const seen = new Set<string>();
  const scenarios: Scenario[] = [];
  const target = resolveTarget(count, min, max);

  while (scenarios.length < target) {
    const bucket = pick(HAND_BUCKETS);
    const zone = pick(M_ZONES);
    const street = pick(streets);
    const potType = pick(potTypes);
    const position = pick(positions);
    const key = `${bucket}-${zone}-${street}-${potType}-${position}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const { action, confidence } = judgePostflopDecision(bucket, zone, table);
    scenarios.push({
      id: `postflop-${key}`,
      module: "postflop",
      hand: bucket,
      context: `${street}|${potType}|${position}`,
      zone,
      correctAction: action,
      confidence,
      timerSeconds: POSTFLOP_TIMER,
    });
  }
  return scenarios;
}

export function generateAllScenarios(count?: number, min = 150, max = 200): Scenario[] {
  return [
    ...generateRangesScenarios(count, min, max),
    ...generateMqScenarios(count, min, max),
    ...generatePostflopScenarios(count, min, max),
  ];
}
