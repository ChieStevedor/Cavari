// Deterministic 169-hand starting-hand ranking.
//
// This heuristic score is a scaffolding placeholder, NOT vetted poker strategy.
// Per the content pipeline, Alex authors the real base range tables manually in
// Supabase; this function only needs to be a stable, monotonic ordering so the
// generator/validator have *something* consistent to derive percentile thresholds
// from during development and testing. Replace with Alex-authored thresholds
// before shipping real content.

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

/** Higher score = stronger starting hand. */
export function handScore(hand: StartingHand): number {
  let score = hand.high * 1.2 + hand.low * 0.8;
  if (hand.isPair) {
    score += 22 + hand.high * 2.2;
  } else {
    const gap = hand.high - hand.low;
    score += Math.max(0, 5 - gap) * 1.3;
    if (hand.suited) score += 3.2;
    if (hand.high === 14) score += 2.5; // ace-high dominance bonus
  }
  return score;
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
