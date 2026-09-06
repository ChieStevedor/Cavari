import { createClient } from "@/lib/supabase/server";
import { computeFactoryEfficiencyScore } from "@/lib/domain/efficiency-score";
import type { Idea, Metric, Product, TimeEntry } from "@/lib/supabase/types";

export interface SourcePerformance {
  sourceName: string;
  ideas: number;
  winners: number;
}

export interface CategoryPerformance {
  categoryName: string;
  ideas: number;
  mvps: number;
  winners: number;
  revenueCents: number;
}

export async function getAnalyticsData() {
  const supabase = await createClient();

  const [
    { data: ideas },
    { data: products },
    { data: metrics },
    { data: timeEntries },
    { data: sources },
    { data: categories },
    { data: experiments },
  ] = await Promise.all([
    supabase.from("ideas").select("*"),
    supabase.from("products").select("*"),
    supabase.from("metrics").select("*"),
    supabase.from("time_entries").select("*"),
    supabase.from("idea_sources").select("*"),
    supabase.from("categories").select("*"),
    supabase.from("validation_experiments").select("*"),
  ]);

  const ideaRows = (ideas ?? []) as Idea[];
  const productRows = (products ?? []) as Product[];
  const metricRows = (metrics ?? []) as Metric[];
  const timeEntryRows = (timeEntries ?? []) as TimeEntry[];
  const sourceRows = (sources ?? []) as { id: string; name: string }[];
  const categoryRows = (categories ?? []) as { id: string; name: string }[];

  const winnerIdeaIds = new Set(
    productRows.filter((p) => p.status === "WINNER").map((p) => p.idea_id),
  );

  const bySource: SourcePerformance[] = sourceRows
    .map((source) => {
      const sourceIdeas = ideaRows.filter((i) => i.source_id === source.id);
      return {
        sourceName: source.name,
        ideas: sourceIdeas.length,
        winners: sourceIdeas.filter((i) => winnerIdeaIds.has(i.id)).length,
      };
    })
    .filter((s) => s.ideas > 0)
    .sort((a, b) => b.ideas - a.ideas);

  const revenueByProductId = new Map<string, number>();
  for (const m of metricRows) {
    revenueByProductId.set(
      m.product_id,
      (revenueByProductId.get(m.product_id) ?? 0) + m.revenue_cents - m.refunds_cents,
    );
  }

  const byCategory: CategoryPerformance[] = categoryRows
    .map((category) => {
      const categoryIdeas = ideaRows.filter((i) => i.category_id === category.id);
      const categoryProducts = productRows.filter((p) => p.category_id === category.id);
      const revenueCents = categoryProducts.reduce(
        (s, p) => s + (revenueByProductId.get(p.id) ?? 0),
        0,
      );
      return {
        categoryName: category.name,
        ideas: categoryIdeas.length,
        mvps: categoryProducts.filter((p) => p.maturity >= 2).length,
        winners: categoryProducts.filter((p) => p.status === "WINNER").length,
        revenueCents,
      };
    })
    .filter((c) => c.ideas > 0)
    .sort((a, b) => b.revenueCents - a.revenueCents);

  const totalRevenueCents = metricRows.reduce(
    (s, m) => s + m.revenue_cents - m.refunds_cents,
    0,
  );
  const totalHours = timeEntryRows.reduce((s, t) => s + Number(t.hours), 0);
  const hypothesesValidated = (experiments ?? []).filter(
    (e) => e.status === "SUCCESSFUL",
  ).length;
  const winners = productRows.filter((p) => p.status === "WINNER").length;

  const efficiency = computeFactoryEfficiencyScore({
    totalRevenueCents,
    totalHours,
    experimentsRun: (experiments ?? []).length,
    hypothesesValidated,
    winners,
  });

  return { bySource, byCategory, efficiency };
}
