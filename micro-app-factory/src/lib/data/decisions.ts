import { createClient } from "@/lib/supabase/server";
import type { Decision, DecisionType } from "@/lib/supabase/types";

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

/** The PENDING decision of this exact type for this subject, if one
 * exists — used so the UI can show "already pending" instead of letting a
 * duplicate be created (P0.2). */
export async function getPendingDecisionForSubject(
  subject: { ideaId?: string; productId?: string },
  decisionType: DecisionType,
): Promise<Decision | null> {
  const supabase = await createClient();
  let query = supabase
    .from("decisions")
    .select("*")
    .eq("decision_type", decisionType)
    .eq("status", "PENDING");
  query = subject.ideaId
    ? query.eq("idea_id", subject.ideaId)
    : query.eq("product_id", subject.productId as string);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as Decision | null;
}

/** Groups of 2+ PENDING decisions on the same subject with different
 * decision_types — a contradiction that must be surfaced explicitly rather
 * than silently letting one win (P0.2). */
export interface ConflictingDecisionGroup {
  subjectName: string;
  subjectHref: string;
  decisions: DecisionWithSubject[];
}

export function findConflictingPendingGroups(
  pending: DecisionWithSubject[],
): ConflictingDecisionGroup[] {
  const bySubject = new Map<string, DecisionWithSubject[]>();
  for (const d of pending) {
    const key = d.idea_id ? `idea:${d.idea_id}` : `product:${d.product_id}`;
    if (!bySubject.has(key)) bySubject.set(key, []);
    bySubject.get(key)!.push(d);
  }

  const conflicts: ConflictingDecisionGroup[] = [];
  for (const decisions of bySubject.values()) {
    const distinctTypes = new Set(decisions.map((d) => d.decision_type));
    if (distinctTypes.size < 2) continue;
    const first = decisions[0];
    const subject = first.idea ?? first.product;
    conflicts.push({
      subjectName: subject?.name ?? "Unknown",
      subjectHref: first.idea_id ? `/ideas/${first.idea_id}` : `/products/${first.product_id}`,
      decisions,
    });
  }
  return conflicts;
}
