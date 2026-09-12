// Invariant validator (content pipeline step 4). Runs against the base range tables
// on every table update to catch authoring mistakes before they reach scenario_bank.
//
// Checks, per the build spec:
//   1. Range widens monotonically as M-ratio decreases, and at later position.
//   2. Premium hands (AA-QQ, AK) never fold on an opening decision.
//   3. Red zone is always at least as aggressive as Green for the same hand/context.

import { M_ZONES, RANGE_POSITIONS, SHOVE_POSITIONS, ACTION_AGGRESSION, HAND_BUCKETS } from "../src/types/domain";
import { PREMIUM_HANDS } from "../src/engine/handRank";
import { rangesBaseTable, mqBaseTable, postflopBaseTable } from "../src/engine/baseTables";
import { judgeRangesDecision } from "../src/engine/rangesEngine";
import { judgeMqDecision } from "../src/engine/mqEngine";
import { judgePostflopDecision } from "../src/engine/postflopEngine";

const violations: string[] = [];

function checkRangesMonotonicByPosition() {
  const table = rangesBaseTable();
  let prev = -Infinity;
  for (const position of RANGE_POSITIONS) {
    const entry = table.find((r) => r.context === position)!;
    if (entry.openFraction < prev) {
      violations.push(
        `[ranges] openFraction must widen at later position: ${position} (${entry.openFraction}) < previous (${prev})`
      );
    }
    prev = entry.openFraction;
  }
}

function checkMqMonotonicByPosition() {
  const table = mqBaseTable();
  for (const zone of M_ZONES) {
    let prev = -Infinity;
    for (const position of SHOVE_POSITIONS) {
      const entry = table.find((r) => r.context === position && r.zone === zone)!;
      if (entry.openFraction < prev) {
        violations.push(
          `[mq] zone=${zone} openFraction must widen at later position: ${position} (${entry.openFraction}) < previous (${prev})`
        );
      }
      prev = entry.openFraction;
    }
  }
}

function checkMqMonotonicByZone() {
  const table = mqBaseTable();
  // M_ZONES is ordered GREEN -> YELLOW -> ORANGE -> RED, i.e. deepest -> shortest.
  // openFraction must be non-decreasing along that order (range widens as M drops).
  for (const position of SHOVE_POSITIONS) {
    let prev = -Infinity;
    for (const zone of M_ZONES) {
      const entry = table.find((r) => r.context === position && r.zone === zone)!;
      if (entry.openFraction < prev) {
        violations.push(
          `[mq] position=${position} openFraction must widen as M drops: ${zone} (${entry.openFraction}) < previous (${prev})`
        );
      }
      prev = entry.openFraction;
    }
  }
}

function checkPremiumHandsNeverFoldOnOpen() {
  const rangesTable = rangesBaseTable();
  for (const position of RANGE_POSITIONS) {
    for (const hand of PREMIUM_HANDS) {
      const { action } = judgeRangesDecision(hand, position, rangesTable);
      if (action === "FOLD") {
        violations.push(`[ranges] premium hand ${hand} folds at ${position} — must never fold on open`);
      }
    }
  }

  const mqTable = mqBaseTable();
  for (const position of SHOVE_POSITIONS) {
    for (const zone of M_ZONES) {
      for (const hand of PREMIUM_HANDS) {
        const { action } = judgeMqDecision({ handCode: hand, position, m: 15, playersLeftToAct: 3 }, mqTable);
        if (action === "FOLD") {
          violations.push(`[mq] premium hand ${hand} folds at ${position}/${zone} — must never fold on open`);
        }
      }
    }
  }
}

function checkRedAtLeastAsAggressiveAsGreen() {
  const table = postflopBaseTable();
  for (const bucket of HAND_BUCKETS) {
    const green = judgePostflopDecision(bucket, "GREEN", table);
    const red = judgePostflopDecision(bucket, "RED", table);
    if (ACTION_AGGRESSION[red.action] < ACTION_AGGRESSION[green.action]) {
      violations.push(
        `[postflop] hand=${bucket}: Red action (${red.action}) is less aggressive than Green action (${green.action})`
      );
    }
  }
}

function main() {
  checkRangesMonotonicByPosition();
  checkMqMonotonicByPosition();
  checkMqMonotonicByZone();
  checkPremiumHandsNeverFoldOnOpen();
  checkRedAtLeastAsAggressiveAsGreen();

  if (violations.length > 0) {
    console.error(`Invariant validation FAILED with ${violations.length} violation(s):\n`);
    for (const v of violations) console.error(` - ${v}`);
    process.exit(1);
  }

  console.log("All invariants passed.");
}

main();
