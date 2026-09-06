// Opportunity Score (§8) and Evidence Confidence (§9). These are
// deliberately kept as two separate, never-merged concepts: a high score
// built purely on assumptions must never be allowed to look like proven
// demand.

export const SCORE_FACTOR_KEYS = [
  "score_pain",
  "score_frequency",
  "score_willingness_to_pay",
  "score_search_intent",
  "score_buildability",
  "score_distribution",
] as const;

export type ScoreFactorKey = (typeof SCORE_FACTOR_KEYS)[number];

export const SCORE_FACTOR_LABELS: Record<ScoreFactorKey, string> = {
  score_pain: "Pain",
  score_frequency: "Frequency",
  score_willingness_to_pay: "Willingness to Pay",
  score_search_intent: "Search Intent",
  score_buildability: "Buildability",
  score_distribution: "Distribution Potential",
};

export const OPPORTUNITY_SCORE_MAX = 30;

export interface OpportunityScoreBand {
  min: number;
  max: number;
  label: string;
}

export const OPPORTUNITY_SCORE_BANDS: OpportunityScoreBand[] = [
  { min: 25, max: 30, label: "Exceptional opportunity" },
  { min: 21, max: 24, label: "Strong" },
  { min: 17, max: 20, label: "Interesting / investigate" },
  { min: 13, max: 16, label: "Weak" },
  { min: 6, max: 12, label: "Reject" },
  { min: 0, max: 5, label: "Reject" },
];

export function interpretOpportunityScore(score: number): string {
  const band = OPPORTUNITY_SCORE_BANDS.find(
    (b) => score >= b.min && score <= b.max,
  );
  return band?.label ?? "Reject";
}

export const EVIDENCE_CONFIDENCE_LABELS: Record<number, string> = {
  0: "Opinion",
  1: "Anecdotal",
  2: "Repeated",
  3: "Market evidence",
  4: "Strong evidence",
  5: "Commercial evidence",
};

export function interpretEvidenceConfidence(
  level: number | null | undefined,
): string {
  if (level === null || level === undefined) return "Not assessed";
  return EVIDENCE_CONFIDENCE_LABELS[level] ?? "Not assessed";
}

/**
 * A high Opportunity Score with low Evidence Confidence is the exact trap
 * §9 exists to prevent — flag it so the UI can surface a warning rather
 * than letting the two numbers imply agreement they don't have.
 */
export function isAssumptionHeavy(
  opportunityScore: number,
  evidenceConfidence: number | null | undefined,
): boolean {
  return opportunityScore >= 21 && (evidenceConfidence ?? 0) <= 1;
}
