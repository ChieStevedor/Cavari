// Plain-language explanations for the jargon the session screen shows. Tapping the
// (i) next to a context line opens the matching entry — direct response to user
// feedback that terms like "M-ratio" meant nothing without any system knowledge.

export interface GlossaryEntry {
  term: string;
  explanation: string;
}

export const GLOSSARY = {
  POSITION: {
    term: "Position",
    explanation:
      "Your seat relative to the dealer button. Earlier positions (like Under the Gun) act first and still have many players who could enter the pot behind them, so they need stronger hands to play. Later positions (like the Button) act last and can profitably play more hands.",
  },
  M_RATIO: {
    term: "M-ratio",
    explanation:
      "Roughly how many rounds of blinds your stack could survive: your chips divided by the cost of one lap around the table (small blind + big blind + antes). A high M-ratio means you have room to wait for good spots. A low one means you're running out of room and need to commit soon.",
  },
  ZONE: {
    term: "Zone",
    explanation:
      "A color-coded read on how much M-ratio room you have left. Green: plenty of room, play your normal game. Yellow: getting tighter — start looking for good spots to build your stack. Orange: short — you're usually looking to move all-in rather than play a normal hand. Red: critical — almost every decision is shove-or-fold before the flop.",
  },
  PLAYERS_BEHIND: {
    term: "Players left to act",
    explanation:
      "How many players haven't acted yet and could still wake up with a strong hand after you. The more players behind you, the stronger a hand you need to shove profitably.",
  },
  POT_TYPE: {
    term: "Pot type",
    explanation:
      "Single-raised pot: one player raised before the flop and got called — a normal-sized pot. 3-bet pot: someone re-raised before the flop, making the pot bigger — ranges on both sides get tighter and stronger.",
  },
  CHIPS: {
    term: "Stack & pot",
    explanation:
      "Illustrative chip amounts assuming blinds of 50/100 — shown so the M-ratio isn't just an abstract number. The M-ratio itself is what actually determines the correct play here, not this specific blind level; the same M means the same decision no matter what the blinds actually are.",
  },
  IP_OOP: {
    term: "In position / out of position",
    explanation:
      "In position means you act after your opponent on this street and get to see their action first — a real advantage. Out of position means you act first, with less information.",
  },
} as const;

export type GlossaryKey = keyof typeof GLOSSARY;
