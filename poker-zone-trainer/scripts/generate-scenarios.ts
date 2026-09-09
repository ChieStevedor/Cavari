// Scenario generator (content pipeline step 2) — CLI entry point.
//
// Randomizes around Alex's manually-authored base tables (src/engine/baseTables.ts —
// itself a placeholder pending real content in Supabase `ranges_tables`) to produce
// 150-200 unique scenarios per module. Every scenario's `correctAction` and
// `confidence` come from the deterministic judge engines (step 3), never an LLM.
// The generation logic itself lives in src/engine/scenarioGenerator.ts, shared with
// the in-app mock backend (src/lib/mock/mockBackend.ts) used for local preview.
//
// Output goes to supabase/seed/ as JSON (source of truth) + SQL inserts, ready for
// Alex to review and load into Supabase `scenario_bank`. This script's output is
// content-authoring input, not something bundled into the shipped app.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ModuleId, Scenario } from "../src/types/domain";
import {
  generateRangesScenarios,
  generateMqScenarios,
  generatePostflopScenarios,
} from "../src/engine/scenarioGenerator";

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
