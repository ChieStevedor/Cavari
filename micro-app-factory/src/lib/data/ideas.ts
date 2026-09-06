import { createClient } from "@/lib/supabase/server";
import type { Idea, IdeaStatus, ResearchItem } from "@/lib/supabase/types";

export interface IdeaWithLookups extends Idea {
  category: { id: string; name: string } | null;
  source: { id: string; name: string } | null;
}

export interface IdeaListFilters {
  status?: IdeaStatus;
  categoryId?: string;
  search?: string;
}

export async function getIdeas(
  filters: IdeaListFilters = {},
): Promise<IdeaWithLookups[]> {
  const supabase = await createClient();
  let query = supabase
    .from("ideas")
    .select("*, category:categories(id, name), source:idea_sources(id, name)")
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as IdeaWithLookups[];
}

export async function getIdeaById(id: string): Promise<IdeaWithLookups | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideas")
    .select("*, category:categories(id, name), source:idea_sources(id, name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as IdeaWithLookups | null;
}

export async function getResearchItemsForIdea(
  ideaId: string,
): Promise<ResearchItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("research_items")
    .select("*")
    .eq("idea_id", ideaId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ResearchItem[];
}

export async function getIdeaCountsByStatus(): Promise<
  Record<IdeaStatus, number>
> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ideas").select("status");
  if (error) throw error;
  const counts = {} as Record<IdeaStatus, number>;
  for (const row of data as { status: IdeaStatus }[]) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }
  return counts;
}
