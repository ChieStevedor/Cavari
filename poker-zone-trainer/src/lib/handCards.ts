// Parses a canonical two-card hand code (e.g. "AKs", "TT", "72o") into concrete
// cards for visual display. The app never tracks real suits — only whether a hand
// is suited/offsuit/paired matters for the engine — so suit assignment here is
// arbitrary but deterministic (same code always renders the same way): suited
// hands get matching suits, offsuit/paired hands get two different suits.

export interface CardSpec {
  rank: string; // "A","K","Q","J","10","9".."2"
  suit: "♠" | "♥";
  color: "red" | "black";
}

const RANK_DISPLAY: Record<string, string> = { T: "10" };

function displayRank(r: string): string {
  return RANK_DISPLAY[r] ?? r;
}

/** Returns null for non-two-card hand codes (e.g. postflop's strength-bucket
 * labels like "PREMIUM"), which have no concrete cards to draw. */
export function cardsForHandCode(code: string): [CardSpec, CardSpec] | null {
  const pairMatch = code.match(/^([2-9TJQKA])\1$/);
  if (pairMatch) {
    const r = displayRank(pairMatch[1]);
    return [
      { rank: r, suit: "♠", color: "black" },
      { rank: r, suit: "♥", color: "red" },
    ];
  }

  const match = code.match(/^([2-9TJQKA])([2-9TJQKA])(s|o)$/);
  if (!match) return null;
  const [, r1, r2, suited] = match;
  if (suited === "s") {
    return [
      { rank: displayRank(r1), suit: "♠", color: "black" },
      { rank: displayRank(r2), suit: "♠", color: "black" },
    ];
  }
  return [
    { rank: displayRank(r1), suit: "♠", color: "black" },
    { rank: displayRank(r2), suit: "♥", color: "red" },
  ];
}
