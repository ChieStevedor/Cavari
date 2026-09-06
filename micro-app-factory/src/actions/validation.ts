"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  parseExperimentFormData,
  parseValidationMetricFormData,
} from "@/lib/validation/experiment-schema";
import type { ActionResult } from "@/actions/ideas";
import type { ExperimentStatus } from "@/lib/supabase/types";

export async function createExperiment(
  ideaId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseExperimentFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("validation_experiments")
    .insert({ ...parsed.data, idea_id: ideaId });

  if (error) return { error: error.message };

  revalidatePath(`/ideas/${ideaId}/validate`);
  revalidatePath("/validation");
  return {};
}

export async function updateExperimentStatus(
  experimentId: string,
  ideaId: string,
  status: ExperimentStatus,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("validation_experiments")
    .update({ status })
    .eq("id", experimentId);
  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/validate`);
  revalidatePath("/validation");
}

export async function updateExperimentLearnings(
  experimentId: string,
  ideaId: string,
  input: { result?: string; learnings?: string },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("validation_experiments")
    .update({
      result: input.result || null,
      learnings: input.learnings || null,
    })
    .eq("id", experimentId);
  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/validate`);
}

export async function addValidationMetric(
  experimentId: string,
  ideaId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseValidationMetricFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("validation_metrics")
    .upsert(
      { ...parsed.data, experiment_id: experimentId },
      { onConflict: "experiment_id,date" },
    );

  if (error) return { error: error.message };

  revalidatePath(`/ideas/${ideaId}/validate`);
  return {};
}
