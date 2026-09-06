"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { DecisionType } from "@/lib/supabase/types";

export async function createDecision(input: {
  ideaId?: string;
  productId?: string;
  decisionType: DecisionType;
  recommendation: string;
  reason: string;
  evidence: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("decisions").insert({
    idea_id: input.ideaId ?? null,
    product_id: input.productId ?? null,
    decision_type: input.decisionType,
    recommendation: input.recommendation,
    reason: input.reason,
    evidence: input.evidence,
    status: "PENDING",
  });
  if (error) throw new Error(error.message);

  revalidatePath("/decisions");
  revalidatePath("/");
}

const DECISION_TYPE_TO_IDEA_STATUS: Partial<Record<DecisionType, string>> = {
  kill: "KILLED",
  approve_validation: "VALIDATING",
  approve_build: "APPROVED_TO_BUILD",
  launch: "LAUNCHED",
};

const DECISION_TYPE_TO_PRODUCT_STATUS: Partial<Record<DecisionType, string>> = {
  kill: "KILLED",
  scale: "SCALE",
  iterate: "ITERATING",
  launch: "LAUNCHED",
};

/**
 * Confirming a decision is the one moment a recommendation is allowed to
 * take effect (§18/§19: "recommendations require manual confirmation").
 * Everything before this point is just computed display — nothing here
 * runs automatically.
 */
export async function confirmDecision(decisionId: string) {
  const supabase = await createClient();
  const { data: decision, error: fetchError } = await supabase
    .from("decisions")
    .select("*")
    .eq("id", decisionId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  if (decision.idea_id) {
    const nextStatus = DECISION_TYPE_TO_IDEA_STATUS[decision.decision_type as DecisionType];
    if (nextStatus) {
      const { error } = await supabase
        .from("ideas")
        .update({ status: nextStatus })
        .eq("id", decision.idea_id);
      if (error) throw new Error(error.message);
    }
  }

  if (decision.product_id) {
    const nextStatus =
      DECISION_TYPE_TO_PRODUCT_STATUS[decision.decision_type as DecisionType];
    if (nextStatus) {
      const { error } = await supabase
        .from("products")
        .update({ status: nextStatus })
        .eq("id", decision.product_id);
      if (error) throw new Error(error.message);
    }
  }

  const { error } = await supabase
    .from("decisions")
    .update({ status: "CONFIRMED", resolved_at: new Date().toISOString() })
    .eq("id", decisionId);
  if (error) throw new Error(error.message);

  revalidatePath("/decisions");
  revalidatePath("/");
  revalidatePath("/ideas");
  revalidatePath("/products");
}

export async function dismissDecision(decisionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("decisions")
    .update({ status: "DISMISSED", resolved_at: new Date().toISOString() })
    .eq("id", decisionId);
  if (error) throw new Error(error.message);

  revalidatePath("/decisions");
  revalidatePath("/");
}
