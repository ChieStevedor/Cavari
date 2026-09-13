// Deterministic 169-hand starting-hand ranking, using the Chen Formula (Bill Chen's
// published starting-hand scoring system) as the strength metric.
//
// This is a well-known, publicly documented heuristic — not a solver, and not a
// literal reproduction of any book's per-hand chart — used here to turn the
// hand-count-based open/shove percentages in baseTables.ts into a concrete
// per-hand decision. It replaces an earlier ad hoc scoring function that had no
// named basis and wasn't a fair stand-in for real strategy content.

import { Rank, StartingHand } from "../types/domain";

const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

function rankLabel(r: Rank): string {
  if (r === 14) return "A";
  if (r === 13) return "K";
  if (r === 12) return "Q";
  if (r === 11) return "J";
  return String(r);
}

export function allStartingHands(): StartingHand[] {
  const hands: StartingHand[] = [];
  for (let i = 0; i < RANKS.length; i++) {
    for (let j = i; j < RANKS.length; j++) {
      const high = RANKS[j];
      const low = RANKS[i];
      if (high === low) {
        hands.push({ code: `${rankLabel(high)}${rankLabel(low)}`, high, low, suited: false, isPair: true });
      } else {
        hands.push({ code: `${rankLabel(high)}${rankLabel(low)}s`, high, low, suited: true, isPair: false });
        hands.push({ code: `${rankLabel(high)}${rankLabel(low)}o`, high, low, suited: false, isPair: false });
      }
    }
  }
  return hands;
}

/** Chen Formula high-card points: A=10, K=8, Q=7, J=6, T=5, 2-9 = rank/2. */
function highCardPoints(r: Rank): number {
  if (r === 14) return 10;
  if (r === 13) return 8;
  if (r === 12) return 7;
  if (r === 11) return 6;
  if (r === 10) return 5;
  return r / 2;
}

/** Higher score = stronger starting hand, per the Chen Formula. */
export function handScore(hand: StartingHand): number {
  if (hand.isPair) {
    return Math.max(5, highCardPoints(hand.high) * 2);
  }

  let score = highCardPoints(hand.high);
  if (hand.suited) score += 2;

  const gap = hand.high - hand.low - 1;
  if (gap === 1) score -= 1;
  else if (gap === 2) score -= 2;
  else if (gap === 3) score -= 4;
  else if (gap >= 4) score -= 5;

  // Straight-potential bonus: only connectors/one-gappers below a Queen make the
  // nut straight often enough to earn it.
  if (gap <= 1 && hand.high < 12) score += 1;

  // Round up to the nearest half-point, per the published formula.
  return Math.ceil(score * 2) / 2;
}

const RANKED_CACHE: StartingHand[] = [...allStartingHands()].sort((a, b) => handScore(b) - handScore(a));

/** All 169 hands ordered strongest -> weakest. */
export function rankedHands(): StartingHand[] {
  return RANKED_CACHE;
}

/** True if `code` is within the top `fraction` (0..1) of hands by strength. */
export function isWithinTopFraction(code: string, fraction: number): boolean {
  return handPercentile(code) < fraction;
}

/** Where `code` sits in the strength ordering, as a fraction (0 = strongest, ~1 = weakest). */
export function handPercentile(code: string): number {
  const idx = RANKED_CACHE.findIndex((h) => h.code === code);
  if (idx === -1) throw new Error(`Unknown hand code: ${code}`);
  return idx / RANKED_CACHE.length;
}

export function handByCode(code: string): StartingHand {
  const hand = RANKED_CACHE.find((h) => h.code === code);
  if (!hand) throw new Error(`Unknown hand code: ${code}`);
  return hand;
}

/** Premium hands that must never fold on an opening decision (Rule: premium hands
 * never fold on open). */
export const PREMIUM_HANDS = ["AA", "KK", "QQ", "AKs", "AKo"];
