import { createClient } from "@/lib/supabase/server";
import type { ValidationExperiment, ValidationMetric } from "@/lib/supabase/types";

export interface ExperimentWithIdea extends ValidationExperiment {
  idea: { id: string; name: string; status: string } | null;
}

export async function getAllExperiments(): Promise<ExperimentWithIdea[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("validation_experiments")
    .select("*, idea:ideas(id, name, status)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as ExperimentWithIdea[];
}

export async function getExperimentsForIdea(
  ideaId: string,
): Promise<ValidationExperiment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("validation_experiments")
    .select("*")
    .eq("idea_id", ideaId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ValidationExperiment[];
}

export async function getExperimentById(
  id: string,
): Promise<ExperimentWithIdea | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("validation_experiments")
    .select("*, idea:ideas(id, name, status)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as ExperimentWithIdea | null;
}

export async function getMetricsForExperiment(
  experimentId: string,
): Promise<ValidationMetric[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("validation_metrics")
    .select("*")
    .eq("experiment_id", experimentId)
    .order("date", { ascending: true });
  if (error) throw error;
  return data as ValidationMetric[];
}
