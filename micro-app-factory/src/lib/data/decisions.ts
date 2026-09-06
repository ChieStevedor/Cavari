import { createClient } from "@/lib/supabase/server";
import type { Decision } from "@/lib/supabase/types";

export interface DecisionWithSubject extends Decision {
  idea: { id: string; name: string } | null;
  product: { id: string; name: string } | null;
}

export async function getDecisions(
  status?: "PENDING" | "CONFIRMED" | "DISMISSED",
): Promise<DecisionWithSubject[]> {
  const supabase = await createClient();
  let query = supabase
    .from("decisions")
    .select("*, idea:ideas(id, name), product:products(id, name)")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as DecisionWithSubject[];
}
