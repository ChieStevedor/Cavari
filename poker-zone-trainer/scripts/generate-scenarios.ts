// Scenario generator (content pipeline step 2).
//
// Randomizes around Alex's manually-authored base tables (src/engine/baseTables.ts —
// itself a placeholder pending real content in Supabase `ranges_tables`) to produce
// 150-200 unique scenarios per module. Every scenario's `correctAction` and
// `confidence` come from the deterministic judge engines (step 3), never an LLM.
//
// Output goes to supabase/seed/ as JSON (source of truth) + SQL inserts, ready for
// Alex to review and load into Supabase `scenario_bank`. This script's output is
// content-authoring input, not something bundled into the shipped app.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  MZone,
  M_ZONES,
  ModuleId,
  RANGE_POSITIONS,
  SHOVE_POSITIONS,
  Scenario,
  HAND_BUCKETS,
} from "../src/types/domain";
import { rankedHands } from "../src/engine/handRank";
import { rangesBaseTable, mqBaseTable, postflopBaseTable } from "../src/engine/baseTables";
import { judgeRangesDecision } from "../src/engine/rangesEngine";
import { judgeMqDecision } from "../src/engine/mqEngine";
import { judgePostflopDecision } from "../src/engine/postflopEngine";

const TARGET_MIN = 150;
const TARGET_MAX = 200;
const RANGES_TIMER = 9; // 8-10s per the app flow spec
const MQ_TIMER = 18; // 15-20s per the app flow spec
const POSTFLOP_TIMER = 18; // not explicitly specified upstream; matched to MQ pending Alex confirmation

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

function generateRangesScenarios(): Scenario[] {
  const table = rangesBaseTable();
  const hands = rankedHands();
  const seen = new Set<string>();
  const scenarios: Scenario[] = [];
  const target = TARGET_MIN + Math.floor(Math.random() * (TARGET_MAX - TARGET_MIN));

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

function generateMqScenarios(): Scenario[] {
  const table = mqBaseTable();
  const hands = rankedHands();
  const seen = new Set<string>();
  const scenarios: Scenario[] = [];
  const target = TARGET_MIN + Math.floor(Math.random() * (TARGET_MAX - TARGET_MIN));

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

function generatePostflopScenarios(): Scenario[] {
  const table = postflopBaseTable();
  const streets = ["FLOP", "TURN", "RIVER"] as const;
  const potTypes = ["SRP", "3BET"] as const;
  const positions = ["IP", "OOP"] as const;
  const seen = new Set<string>();
  const scenarios: Scenario[] = [];
  const target = TARGET_MIN + Math.floor(Math.random() * (TARGET_MAX - TARGET_MIN));

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

function toSqlInserts(scenarios: Scenario[]): string {
  const rows = scenarios.map((s) => {
    const zone = s.zone ? `'${s.zone}'` : "NULL";
    return `  ('${s.id}', '${s.module}', '${s.hand}', '${s.context.replace(/'/g, "''")}', ${zone}, '${s.correctAction}', '${s.confidence}', ${s.timerSeconds})`;
  });
  return (
    `insert into scenario_bank (id, module, hand, context, zone, correct_action, confidence, timer_seconds)\nvalues\n` +
    rows.join(",\n") +
    `\non conflict (id) do update set\n` +
    `  correct_action = excluded.correct_action,\n` +
    `  confidence = excluded.confidence,\n` +
    `  context = excluded.context,\n` +
    `  zone = excluded.zone,\n` +
    `  timer_seconds = excluded.timer_seconds;\n`
  );
}

function main() {
  const outDir = join(__dirname, "..", "supabase", "seed");
  mkdirSync(outDir, { recursive: true });

  const byModule: Record<ModuleId, Scenario[]> = {
    ranges: generateRangesScenarios(),
    mq: generateMqScenarios(),
    postflop: generatePostflopScenarios(),
  };

  const all: Scenario[] = [];
  for (const [module, scenarios] of Object.entries(byModule) as [ModuleId, Scenario[]][]) {
    writeFileSync(join(outDir, `scenarios.${module}.json`), JSON.stringify(scenarios, null, 2));
    all.push(...scenarios);
    console.log(`${module}: generated ${scenarios.length} scenarios`);
  }

  writeFileSync(join(outDir, "scenarios.sql"), toSqlInserts(all));
  console.log(`Wrote ${all.length} total scenarios to supabase/seed/`);
}

main();
