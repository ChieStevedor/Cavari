// Turns a scenario's raw context string (e.g. "CO|m=15.3|behind=2") and module
// into a human-readable prompt + context lines for the session screen. Direct
// response to user feedback: the raw context strings and bare position codes
// were unreadable to anyone who didn't already know the abbreviations.

import type { Scenario } from "../types/domain";
import type { GlossaryKey } from "./glossary";

const POSITION_NAMES: Record<string, string> = {
  UTG: "Under the Gun",
  UTG1: "UTG+1",
  MP1: "Middle Position",
  MP2: "Middle Position+1",
  HJ: "Hijack",
  CO: "Cutoff",
  BTN: "Button",
  SB: "Small Blind",
  BB: "Big Blind",
};

export function positionLabel(code: string): string {
  const full = POSITION_NAMES[code];
  return full ? `${full} (${code})` : code;
}

export interface ContextLine {
  text: string;
  glossaryKey?: GlossaryKey;
}

export interface ScenarioDisplay {
  prompt: string;
  contextLines: ContextLine[];
}

const STREET_LABELS: Record<string, string> = { FLOP: "Flop", TURN: "Turn", RIVER: "River" };
const POT_TYPE_LABELS: Record<string, string> = { SRP: "Single-raised pot", "3BET": "3-bet pot" };
const IP_OOP_LABELS: Record<string, string> = { IP: "In position", OOP: "Out of position" };

/** Pulls the position, M-ratio, and players-left-to-act count out of a module 2
 * scenario's context string (e.g. "CO|m=15.3|behind=2"), for the table diagram. */
export function parseMqContext(context: string): { position: string; m: number; playersLeftToAct: number } {
  const [position, mPart, behindPart] = context.split("|");
  return {
    position,
    m: Number(mPart?.replace("m=", "")) || 0,
    playersLeftToAct: Number(behindPart?.replace("behind=", "")) || 0,
  };
}

// Illustrative-only reference blind level used to turn a scenario's dimensionless
// M-ratio into concrete chip amounts for display. M itself (stack / one orbit's
// cost) is what the engine actually judges on — these numbers are a fixed stand-in
// so "M 8.3" isn't just an abstract ratio, not a claim about a specific hand's real
// blind level. No antes, kept simple.
const ILLUSTRATIVE_SB = 50;
const ILLUSTRATIVE_BB = 100;

export function chipsForM(m: number): { sb: number; bb: number; pot: number; stack: number } {
  const orbitCost = ILLUSTRATIVE_SB + ILLUSTRATIVE_BB;
  return {
    sb: ILLUSTRATIVE_SB,
    bb: ILLUSTRATIVE_BB,
    pot: orbitCost,
    stack: Math.round((m * orbitCost) / 10) * 10,
  };
}

export function describeScenario(scenario: Scenario): ScenarioDisplay {
  if (scenario.module === "ranges") {
    return {
      prompt: "No one has entered the pot yet. Raise or fold?",
      contextLines: [{ text: `Position: ${positionLabel(scenario.context)}`, glossaryKey: "POSITION" }],
    };
  }

  if (scenario.module === "mq") {
    const [position, mPart, behindPart] = scenario.context.split("|");
    const m = mPart?.replace("m=", "");
    const behind = behindPart?.replace("behind=", "");
    return {
      prompt: "Everyone before you has folded. All-in or fold?",
      contextLines: [
        { text: `Position: ${positionLabel(position)}`, glossaryKey: "POSITION" },
        { text: `M-ratio: ${m}`, glossaryKey: "M_RATIO" },
        { text: `Players still to act behind you: ${behind}`, glossaryKey: "PLAYERS_BEHIND" },
      ],
    };
  }

  // postflop
  const [street, potType, position] = scenario.context.split("|");
  return {
    prompt: "What's your action?",
    contextLines: [
      { text: `Street: ${STREET_LABELS[street] ?? street}` },
      { text: `Pot type: ${POT_TYPE_LABELS[potType] ?? potType}`, glossaryKey: "POT_TYPE" },
      { text: IP_OOP_LABELS[position] ?? position, glossaryKey: "IP_OOP" },
    ],
  };
}

/** Compact one-line summary for list rows (e.g. the recap screen's miss list),
 * where the full multi-line breakdown from describeScenario() would be too much. */
export function shortContextLabel(scenario: Scenario): string {
  if (scenario.module === "ranges") {
    return positionLabel(scenario.context);
  }
  if (scenario.module === "mq") {
    const [position, mPart] = scenario.context.split("|");
    const m = mPart?.replace("m=", "");
    return `${POSITION_NAMES[position] ?? position} · M ${m}`;
  }
  const [street, , position] = scenario.context.split("|");
  return `${STREET_LABELS[street] ?? street} · ${IP_OOP_LABELS[position] ?? position}`;
}
