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

  // §13: "When an idea is approved for development, create an MVP
  // project." P2.10 remediation: the status flip + product insert +
  // checklist insert used to be three separate statements with no shared
  // transaction — a failure partway through could leave the idea stuck in
  // BUILDING with no product and no automatic recovery. create_product_for_idea
  // (see migration 20260101000003) does all three writes inside one
  // Postgres function call, which is atomic: if any statement inside it
  // raises, everything it did rolls back, including the status update.
  if (nextStatus === "BUILDING") {
    const { error } = await supabase.rpc("create_product_for_idea", {
      p_idea_id: ideaId,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/products");
  } else {
    const { error } = await supabase
      .from("ideas")
      .update({ status: nextStatus })
      .eq("id", ideaId);
    if (error) throw new Error(error.message);
  }

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
