// Factory Efficiency Score (§43) — an internal management metric, not a
// universal business metric. Configurable weights so it can be tuned from
// Settings later without changing this formula's shape.

export const EFFICIENCY_WEIGHTS = {
  revenuePerHour: 1,
  validatedHypothesis: 50,
  winner: 200,
};

export interface EfficiencyInputs {
  totalRevenueCents: number;
  totalHours: number;
  experimentsRun: number;
  hypothesesValidated: number;
  winners: number;
}

export interface EfficiencyResult {
  score: number;
  revenuePerHourCents: number | null;
  insufficientData: boolean;
}

export function computeFactoryEfficiencyScore(
  inputs: EfficiencyInputs,
): EfficiencyResult {
  if (inputs.totalHours === 0) {
    return { score: 0, revenuePerHourCents: null, insufficientData: true };
  }

  const revenuePerHourCents = inputs.totalRevenueCents / inputs.totalHours;

  const score =
    (revenuePerHourCents / 100) * EFFICIENCY_WEIGHTS.revenuePerHour +
    inputs.hypothesesValidated * EFFICIENCY_WEIGHTS.validatedHypothesis +
    inputs.winners * EFFICIENCY_WEIGHTS.winner;

  return {
    score: Math.round(score),
    revenuePerHourCents,
    insufficientData: false,
  };
}
