"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getExperimentsForIdea, getMetricsForExperiment } from "@/lib/data/validation";
import {
  getMetricsForProduct,
  getExpensesForProduct,
  getTimeEntriesForProduct,
} from "@/lib/data/products";
import { sumValidationMetrics } from "@/lib/domain/validation-metrics";
import { computeProductPnl, sumProductMetrics } from "@/lib/domain/pnl";
import { recommendForProduct, recommendForValidation } from "@/lib/domain/decision-engine";
import {
  evaluateDecisionConfirmation,
  type ConfirmBlockedResult,
  type ConflictingDecisionSummary,
} from "@/lib/domain/decision-validation";
import { canTransitionIdea, canTransitionProduct, maturityForStatus } from "@/lib/domain/statuses";
import type {
  Decision,
  DecisionType,
  IdeaStatus,
  ProductStatus,
} from "@/lib/supabase/types";

const POSTGRES_UNIQUE_VIOLATION = "23505";

export interface CreateDecisionResult {
  decision: Decision;
  /** True if an existing PENDING decision of this type was found and
   * returned instead of creating a new one (P0.2: dedup). */
  alreadyExisted: boolean;
}

/**
 * Creates a PENDING decision, but never a second one for the same
 * subject+type while one is still open (P0.2). The database's partial
 * unique index (see migration 20260101000002) is the real guarantee here;
 * the pre-check just avoids a round-trip error in the common case, and the
 * catch below handles the race where two requests pass the pre-check at
 * once.
 */
export async function createDecision(input: {
  ideaId?: string;
  productId?: string;
  decisionType: DecisionType;
  recommendation: string;
  reason: string;
  evidence: Record<string, unknown>;
}): Promise<CreateDecisionResult> {
  const supabase = await createClient();

  let existingQuery = supabase
    .from("decisions")
    .select("*")
    .eq("decision_type", input.decisionType)
    .eq("status", "PENDING");
  existingQuery = input.ideaId
    ? existingQuery.eq("idea_id", input.ideaId)
    : existingQuery.eq("product_id", input.productId as string);
  const { data: existing } = await existingQuery.maybeSingle();
  if (existing) {
    return { decision: existing as Decision, alreadyExisted: true };
  }

  const { data, error } = await supabase
    .from("decisions")
    .insert({
      idea_id: input.ideaId ?? null,
      product_id: input.productId ?? null,
      decision_type: input.decisionType,
      recommendation: input.recommendation,
      reason: input.reason,
      evidence: input.evidence,
      status: "PENDING",
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === POSTGRES_UNIQUE_VIOLATION) {
      // Lost the race to a concurrent create — fetch and return the winner.
      let raceQuery = supabase
        .from("decisions")
        .select("*")
        .eq("decision_type", input.decisionType)
        .eq("status", "PENDING");
      raceQuery = input.ideaId
        ? raceQuery.eq("idea_id", input.ideaId)
        : raceQuery.eq("product_id", input.productId as string);
      const { data: winner, error: refetchError } = await raceQuery.single();
      if (refetchError) throw new Error(refetchError.message);
      return { decision: winner as Decision, alreadyExisted: true };
    }
    throw new Error(error.message);
  }

  revalidatePath("/decisions");
  revalidatePath("/");
  return { decision: data as Decision, alreadyExisted: false };
}

const DECISION_TYPE_TO_IDEA_STATUS: Partial<Record<DecisionType, IdeaStatus>> = {
  kill: "KILLED",
  approve_validation: "VALIDATING",
  approve_build: "APPROVED_TO_BUILD",
  launch: "LAUNCHED",
};

const DECISION_TYPE_TO_PRODUCT_STATUS: Partial<Record<DecisionType, ProductStatus>> = {
  kill: "KILLED",
  scale: "SCALE",
  iterate: "ITERATING",
  launch: "LAUNCHED",
};

async function fetchOtherPendingDecisions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  subject: { ideaId: string | null; productId: string | null },
  excludeId: string,
): Promise<ConflictingDecisionSummary[]> {
  let query = supabase
    .from("decisions")
    .select("id, decision_type, recommendation, created_at")
    .eq("status", "PENDING")
    .neq("id", excludeId);
  query = subject.ideaId
    ? query.eq("idea_id", subject.ideaId)
    : query.eq("product_id", subject.productId as string);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ConflictingDecisionSummary[];
}

/**
 * Confirming a decision is the one moment a recommendation is allowed to
 * take effect (§18/§19: "recommendations require manual confirmation").
 *
 * P0.1 remediation: before that effect is applied, this re-fetches the
 * subject and its current metrics, re-runs the *same* recommendation
 * engine used everywhere else, and blocks (rather than executes) when the
 * requested decision no longer matches reality, when the transition is no
 * longer legal from the subject's current status, or when another
 * conflicting PENDING decision exists for the same subject. Nothing here
 * re-implements the recommendation logic — it calls the existing
 * recommendForProduct/recommendForValidation, so there is exactly one
 * source of truth for what the "right" recommendation is.
 *
 * Returns a structured result instead of throwing for the "blocked" case,
 * so the UI can show the exact reason rather than a generic error.
 */
export async function confirmDecision(
  decisionId: string,
): Promise<{ ok: true; warning?: string } | ConfirmBlockedResult> {
  const supabase = await createClient();

  const { data: decisionRow, error: fetchError } = await supabase
    .from("decisions")
    .select("*")
    .eq("id", decisionId)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  const decision = decisionRow as Decision;

  // Already resolved by someone/something else — nothing to do. Short-circuit
  // before fetching metrics; evaluateDecisionConfirmation's own PENDING
  // check below would catch this too, but there's no point re-fetching a
  // subject's full metrics just to report "already resolved."
  if (decision.status !== "PENDING") {
    return {
      ok: false,
      reason: "already_resolved",
      message: `This decision was already ${decision.status.toLowerCase()} — nothing to confirm.`,
      requestedDecisionType: decision.decision_type,
      requestedRecommendation: decision.recommendation,
      decisionCreatedAt: decision.created_at,
      currentStatus: "unknown",
    };
  }

  const otherPendingDecisions = await fetchOtherPendingDecisions(
    supabase,
    { ideaId: decision.idea_id, productId: decision.product_id },
    decision.id,
  );

  let currentStatus = "";
  let currentRecommendation: ReturnType<typeof recommendForProduct>["recommendation"] | null =
    null;
  let canTransition = false;
  let nextStatus: string | undefined;
  let subjectTable: "ideas" | "products" | null = null;

  if (decision.idea_id) {
    subjectTable = "ideas";
    const { data: idea, error } = await supabase
      .from("ideas")
      .select("status")
      .eq("id", decision.idea_id)
      .single();
    if (error) throw new Error(error.message);
    currentStatus = idea.status;
    const ideaNextStatus = DECISION_TYPE_TO_IDEA_STATUS[decision.decision_type];
    nextStatus = ideaNextStatus;
    canTransition = ideaNextStatus
      ? canTransitionIdea(idea.status as IdeaStatus, ideaNextStatus)
      : true;

    const experiments = await getExperimentsForIdea(decision.idea_id);
    const mostRecent = [...experiments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
    if (mostRecent) {
      const metrics = await getMetricsForExperiment(mostRecent.id);
      currentRecommendation = recommendForValidation(
        sumValidationMetrics(metrics),
      ).recommendation;
    }
  } else if (decision.product_id) {
    subjectTable = "products";
    const { data: product, error } = await supabase
      .from("products")
      .select("status")
      .eq("id", decision.product_id)
      .single();
    if (error) throw new Error(error.message);
    currentStatus = product.status;
    const productNextStatus = DECISION_TYPE_TO_PRODUCT_STATUS[decision.decision_type];
    nextStatus = productNextStatus;
    canTransition = productNextStatus
      ? canTransitionProduct(product.status as ProductStatus, productNextStatus)
      : true;

    const [metrics, expenses, timeEntries] = await Promise.all([
      getMetricsForProduct(decision.product_id),
      getExpensesForProduct(decision.product_id),
      getTimeEntriesForProduct(decision.product_id),
    ]);
    const pnl = computeProductPnl(metrics, expenses, timeEntries);
    currentRecommendation = recommendForProduct(
      sumProductMetrics(metrics),
      pnl,
    ).recommendation;
  }

  const verdict = evaluateDecisionConfirmation({
    decision,
    currentStatus,
    currentRecommendation,
    otherPendingDecisions,
    canTransition,
    nextStatus,
  });

  if (!verdict.ok) return verdict;

  // Claim the decision atomically first: only one concurrent confirm can
  // win this compare-and-swap. The loser reports "already resolved"
  // instead of double-applying the status change.
  const { data: claimed, error: claimError } = await supabase
    .from("decisions")
    .update({ status: "CONFIRMED", resolved_at: new Date().toISOString() })
    .eq("id", decisionId)
    .eq("status", "PENDING")
    .select("id")
    .maybeSingle();
  if (claimError) throw new Error(claimError.message);
  if (!claimed) {
    return {
      ok: false,
      reason: "already_resolved",
      message: "This decision was just resolved by another action — nothing to confirm.",
      requestedDecisionType: decision.decision_type,
      requestedRecommendation: decision.recommendation,
      decisionCreatedAt: decision.created_at,
      currentStatus,
    };
  }

  let warning: string | undefined;
  if (verdict.nextStatus && subjectTable) {
    const subjectId = decision.idea_id ?? decision.product_id!;
    const updatePayload: Record<string, unknown> = { status: verdict.nextStatus };
    if (subjectTable === "products") {
      const maturity = maturityForStatus(verdict.nextStatus as ProductStatus);
      if (maturity !== undefined) updatePayload.maturity = maturity;
    }
    const { data: applied, error: applyError } = await supabase
      .from(subjectTable)
      .update(updatePayload)
      .eq("id", subjectId)
      .eq("status", currentStatus)
      .select("id")
      .maybeSingle();
    if (applyError) throw new Error(applyError.message);
    if (!applied) {
      // The decision is already claimed CONFIRMED at this point (see
      // module notes: true cross-table atomicity would need a Postgres
      // function/RPC, which this deliberately doesn't add without a
      // second confirmed bug behind it — see remediation report). Surface
      // the partial state rather than pretending it fully applied.
      warning = `${subjectTable === "ideas" ? "Idea" : "Product"} status changed concurrently and was not updated — re-check its current state.`;
    }
  }

  revalidatePath("/decisions");
  revalidatePath("/");
  revalidatePath("/ideas");
  revalidatePath("/products");
  return warning ? { ok: true, warning } : { ok: true };
}

export async function dismissDecision(decisionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("decisions")
    .update({ status: "DISMISSED", resolved_at: new Date().toISOString() })
    .eq("id", decisionId)
    .eq("status", "PENDING");
  if (error) throw new Error(error.message);

  revalidatePath("/decisions");
  revalidatePath("/");
}
