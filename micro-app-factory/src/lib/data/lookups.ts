import { createClient } from "@/lib/supabase/server";
import type { Category, IdeaSource, Tag } from "@/lib/supabase/types";

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) throw error;
  return data as Category[];
}

export async function getIdeaSources(): Promise<IdeaSource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("idea_sources")
    .select("*")
    .order("name");
  if (error) throw error;
  return data as IdeaSource[];
}

export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tags").select("*").order("name");
  if (error) throw error;
  return data as Tag[];
}
