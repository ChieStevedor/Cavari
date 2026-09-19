import type { Action, Scenario } from "../types/domain";
import { postflopBaseTable } from "../engine/baseTables";
import { ZONE_PASSIVE_ACTION } from "../engine/postflopEngine";

const POSTFLOP_TABLE = postflopBaseTable();

/** The two answer choices to present for a scenario. Kept binary across all three
 * modules so the session UI stays simple and fast under the tight timers. */
export function answerOptionsFor(scenario: Scenario): Action[] {
  switch (scenario.module) {
    case "ranges":
      return ["FOLD", "RAISE"];
    case "mq":
      return ["FOLD", "ALL_IN"];
    case "postflop": {
      const entry = POSTFLOP_TABLE.find((row) => row.zone === scenario.zone);
      const passive = scenario.zone ? ZONE_PASSIVE_ACTION[scenario.zone] : "CHECK";
      return [passive, entry?.action ?? "BET"];
    }
  }
}
