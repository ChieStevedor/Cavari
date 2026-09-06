"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { parseIdeaFormData } from "@/lib/validation/idea-schema";
import { canTransitionIdea } from "@/lib/domain/statuses";
import type { IdeaStatus, ResearchItemType } from "@/lib/supabase/types";

export interface ActionResult {
  error?: string;
}

export async function createIdea(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseIdeaFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideas")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/ideas");
  redirect(`/ideas/${data.id}`);
}

export async function updateIdea(
  ideaId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseIdeaFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ideas")
    .update(parsed.data)
    .eq("id", ideaId);

  if (error) return { error: error.message };

  revalidatePath("/ideas");
  revalidatePath(`/ideas/${ideaId}`);
  redirect(`/ideas/${ideaId}`);
}

export async function updateIdeaStatus(
  ideaId: string,
  currentStatus: IdeaStatus,
  nextStatus: IdeaStatus,
) {
  if (!canTransitionIdea(currentStatus, nextStatus)) {
    throw new Error(`Cannot move idea from ${currentStatus} to ${nextStatus}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("ideas")
    .update({ status: nextStatus })
    .eq("id", ideaId);
  if (error) throw new Error(error.message);

  revalidatePath("/ideas");
  revalidatePath(`/ideas/${ideaId}`);
}

export async function addResearchItem(
  ideaId: string,
  input: {
    type: ResearchItemType;
    url?: string;
    title?: string;
    notes?: string;
    evidence_strength?: number;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("research_items").insert({
    idea_id: ideaId,
    type: input.type,
    url: input.url || null,
    title: input.title || null,
    notes: input.notes || null,
    evidence_strength: input.evidence_strength ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/ideas/${ideaId}`);
}

export async function deleteResearchItem(ideaId: string, researchItemId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("research_items")
    .delete()
    .eq("id", researchItemId);
  if (error) throw new Error(error.message);
  revalidatePath(`/ideas/${ideaId}`);
}
