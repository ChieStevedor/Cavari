// Explicit status transition maps (§6: "Status transitions should be
// explicit. Do not allow arbitrary statuses."). The database CHECK
// constraints enforce the closed set of values; this module enforces which
// moves are legal from a given status, so the UI never offers a jump the
// business process doesn't allow.

import type {
  ExperimentStatus,
  IdeaStatus,
  ProductStatus,
} from "@/lib/supabase/types";

export const IDEA_STATUS_ORDER: IdeaStatus[] = [
  "IDEA",
  "RESEARCHING",
  "SCORED",
  "VALIDATING",
  "APPROVED_TO_BUILD",
  "BUILDING",
  "LAUNCHED",
  "MEASURING",
  "ITERATING",
  "SCALE",
  "WINNER",
];

const IDEA_TRANSITIONS: Record<IdeaStatus, IdeaStatus[]> = {
  IDEA: ["RESEARCHING", "KILLED", "ARCHIVED"],
  RESEARCHING: ["SCORED", "KILLED", "ARCHIVED"],
  SCORED: ["VALIDATING", "KILLED", "ARCHIVED"],
  VALIDATING: ["APPROVED_TO_BUILD", "KILLED", "ARCHIVED"],
  APPROVED_TO_BUILD: ["BUILDING", "KILLED", "ARCHIVED"],
  BUILDING: ["LAUNCHED", "KILLED", "ARCHIVED"],
  LAUNCHED: ["MEASURING", "KILLED", "ARCHIVED"],
  MEASURING: ["ITERATING", "SCALE", "WINNER", "KILLED", "ARCHIVED"],
  ITERATING: ["MEASURING", "SCALE", "WINNER", "KILLED", "ARCHIVED"],
  SCALE: ["WINNER", "ITERATING", "KILLED", "ARCHIVED"],
  WINNER: ["SCALE", "ITERATING", "ARCHIVED"],
  KILLED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function allowedIdeaTransitions(current: IdeaStatus): IdeaStatus[] {
  return IDEA_TRANSITIONS[current] ?? [];
}

export function canTransitionIdea(
  from: IdeaStatus,
  to: IdeaStatus,
): boolean {
  return allowedIdeaTransitions(from).includes(to);
}

const PRODUCT_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  BUILDING: ["LAUNCHED", "KILLED", "ARCHIVED"],
  LAUNCHED: ["MEASURING", "KILLED", "ARCHIVED"],
  MEASURING: ["ITERATING", "SCALE", "WINNER", "KILLED", "ARCHIVED"],
  ITERATING: ["MEASURING", "SCALE", "WINNER", "KILLED", "ARCHIVED"],
  SCALE: ["WINNER", "ITERATING", "KILLED", "ARCHIVED"],
  WINNER: ["SCALE", "ITERATING", "ARCHIVED"],
  KILLED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function allowedProductTransitions(
  current: ProductStatus,
): ProductStatus[] {
  return PRODUCT_TRANSITIONS[current] ?? [];
}

export function canTransitionProduct(
  from: ProductStatus,
  to: ProductStatus,
): boolean {
  return allowedProductTransitions(from).includes(to);
}

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  IDEA: "Idea",
  RESEARCHING: "Researching",
  SCORED: "Scored",
  VALIDATING: "Validating",
  APPROVED_TO_BUILD: "Approved to Build",
  BUILDING: "Building",
  LAUNCHED: "Launched",
  MEASURING: "Measuring",
  ITERATING: "Iterating",
  SCALE: "Scale",
  WINNER: "Winner",
  KILLED: "Killed",
  ARCHIVED: "Archived",
};

const EXPERIMENT_TRANSITIONS: Record<ExperimentStatus, ExperimentStatus[]> = {
  PLANNED: ["RUNNING", "FAILED"],
  RUNNING: ["COMPLETED", "FAILED", "SUCCESSFUL"],
  COMPLETED: ["SUCCESSFUL", "FAILED"],
  FAILED: [],
  SUCCESSFUL: [],
};

export function allowedExperimentTransitions(
  current: ExperimentStatus,
): ExperimentStatus[] {
  return EXPERIMENT_TRANSITIONS[current] ?? [];
}

export const EXPERIMENT_STATUS_LABELS: Record<ExperimentStatus, string> = {
  PLANNED: "Planned",
  RUNNING: "Running",
  COMPLETED: "Completed",
  FAILED: "Failed",
  SUCCESSFUL: "Successful",
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  BUILDING: "Building",
  LAUNCHED: "Launched",
  MEASURING: "Measuring",
  ITERATING: "Iterating",
  SCALE: "Scale",
  WINNER: "Winner",
  KILLED: "Killed",
  ARCHIVED: "Archived",
};

// ---------------------------------------------------------------------------
// Canonical status groupings + maturity mapping (single source of truth so
// the Command Center pipeline, Portfolio, and Analytics can never disagree
// with each other or with the status enum — see P0.3 remediation).
// ---------------------------------------------------------------------------

/** Statuses where LAUNCHED/MEASURING/ITERATING are one undifferentiated
 * "live" family — the status model has no finer-grained stage between
 * launch and SCALE/WINNER, so nothing downstream should invent one. */
export const LIVE_PRODUCT_STATUSES: ProductStatus[] = [
  "LAUNCHED",
  "MEASURING",
  "ITERATING",
];

/** "Currently active" for portfolio/KPI purposes: live + the two upper
 * stages. Excludes BUILDING (not yet shipped) and KILLED/ARCHIVED (exited). */
export const ACTIVE_PRODUCT_STATUSES: ProductStatus[] = [
  ...LIVE_PRODUCT_STATUSES,
  "SCALE",
  "WINNER",
];

/**
 * Product maturity (§24), derived from status rather than stored
 * independently — this is what stops it from drifting: a product's
 * maturity can only ever be what its current status implies.
 *
 * Deviates from a literal 0-6 idea-through-scale scale in two ways,
 * both documented at the point of use (lib/domain/statuses.ts P0.3
 * remediation notes): ideas have no maturity column in this schema (0/1
 * would be idea-stage values with nothing to attach them to), and
 * LAUNCHED/MEASURING/ITERATING collapse to one "Live" value (3) because
 * the status enum has no separate "Traction" status to justify a 4th
 * value without inventing an undocumented threshold.
 *
 * KILLED/ARCHIVED are intentionally absent: maturity is left as-is on
 * exit (how far a product got before it died is more useful than
 * resetting to 0), so callers must only apply this when it returns a
 * defined number.
 */
export const MATURITY_BY_STATUS: Partial<Record<ProductStatus, number>> = {
  BUILDING: 2, // MVP
  LAUNCHED: 3, // Live
  MEASURING: 3, // Live
  ITERATING: 3, // Live
  WINNER: 5, // Winner
  SCALE: 6, // Scale (matches the original spec's own 5=Winner/6=Scale ordering)
};

export function maturityForStatus(status: ProductStatus): number | undefined {
  return MATURITY_BY_STATUS[status];
}

export type PipelineBucket = "BUILDING" | "LIVE" | "SCALE" | "WINNER";

/** Which Factory Pipeline column a product status belongs in. KILLED and
 * ARCHIVED are intentionally excluded — they live in the separate Archive,
 * not the pipeline (§19: "preserve killed products... in Archive", not in
 * the active funnel). */
export const PRODUCT_PIPELINE_BUCKET: Partial<Record<ProductStatus, PipelineBucket>> = {
  BUILDING: "BUILDING",
  LAUNCHED: "LIVE",
  MEASURING: "LIVE",
  ITERATING: "LIVE",
  SCALE: "SCALE",
  WINNER: "WINNER",
};
