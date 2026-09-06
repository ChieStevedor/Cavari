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
