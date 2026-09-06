import { createClient } from "@/lib/supabase/server";
import { computeProductPnl } from "@/lib/domain/pnl";
import { generateTodaysActions } from "@/lib/domain/todays-actions";
import type {
  Expense,
  Idea,
  Metric,
  Product,
  TimeEntry,
  ValidationExperiment,
} from "@/lib/supabase/types";

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday-start week
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function getCommandCenterData() {
  const supabase = await createClient();

  const [
    { data: ideas },
    { data: products },
    { data: experiments },
    { data: pendingDecisions },
    { data: metrics },
    { data: expenses },
    { data: timeEntries },
  ] = await Promise.all([
    supabase.from("ideas").select("*"),
    supabase.from("products").select("*"),
    supabase.from("validation_experiments").select("*"),
    supabase.from("decisions").select("*").eq("status", "PENDING"),
    supabase.from("metrics").select("*"),
    supabase.from("expenses").select("*"),
    supabase.from("time_entries").select("*"),
  ]);

  const ideaRows = (ideas ?? []) as Idea[];
  const productRows = (products ?? []) as Product[];
  const experimentRows = (experiments ?? []) as ValidationExperiment[];
  const metricRows = (metrics ?? []) as Metric[];
  const expenseRows = (expenses ?? []) as Expense[];
  const timeEntryRows = (timeEntries ?? []) as TimeEntry[];

  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const ideasThisWeek = ideaRows.filter(
    (i) => new Date(i.created_at) >= weekStart,
  ).length;
  const ideasValidated = ideaRows.filter(
    (i) => (i.evidence_confidence ?? 0) >= 3,
  ).length;
  const mvpsLaunched = productRows.filter((p) => p.launch_date).length;
  const activeProducts = productRows.filter((p) =>
    ["LAUNCHED", "MEASURING", "ITERATING", "SCALE", "WINNER"].includes(p.status),
  ).length;
  const winners = productRows.filter((p) => p.status === "WINNER").length;
  const killedProducts = productRows.filter((p) => p.status === "KILLED").length;

  const totalRevenueCents = metricRows.reduce(
    (s, m) => s + m.revenue_cents - m.refunds_cents,
    0,
  );
  const revenueThisMonthCents = metricRows
    .filter((m) => new Date(m.date) >= monthStart)
    .reduce((s, m) => s + m.revenue_cents - m.refunds_cents, 0);

  const mrrCents = productRows.reduce((sum, p) => {
    const productMetrics = metricRows.filter((m) => m.product_id === p.id);
    const productExpenses = expenseRows.filter((e) => e.product_id === p.id);
    const productTime = timeEntryRows.filter((t) => t.product_id === p.id);
    const pnl = computeProductPnl(productMetrics, productExpenses, productTime);
    return sum + pnl.mrrCents;
  }, 0);

  const totalHours = timeEntryRows.reduce((s, t) => s + Number(t.hours), 0);
  const productsWithHours = new Set(timeEntryRows.map((t) => t.product_id)).size;
  const avgHoursPerProduct = productsWithHours > 0 ? totalHours / productsWithHours : null;
  const revenuePerHourCents = totalHours > 0 ? totalRevenueCents / totalHours : null;

  const totalActivated = metricRows.reduce((s, m) => s + m.activated_users, 0);
  const totalPurchases = metricRows.reduce((s, m) => s + m.purchases, 0);
  const conversionRate = totalActivated > 0 ? totalPurchases / totalActivated : null;

  const experimentsRunning = experimentRows.filter((e) => e.status === "RUNNING").length;

  const pipeline = {
    IDEA: ideaRows.filter((i) => i.status === "IDEA").length,
    RESEARCHING: ideaRows.filter((i) => i.status === "RESEARCHING").length,
    SCORED: ideaRows.filter((i) => i.status === "SCORED").length,
    VALIDATING: ideaRows.filter((i) => i.status === "VALIDATING").length,
    BUILDING: productRows.filter((p) => p.status === "BUILDING").length,
    LIVE: productRows.filter((p) =>
      ["LAUNCHED", "MEASURING", "ITERATING"].includes(p.status),
    ).length,
    WINNER: winners,
  };

  const todaysActions = generateTodaysActions({
    ideas: ideaRows,
    products: productRows,
    experiments: experimentRows,
    pendingDecisions: pendingDecisions ?? [],
  });

  const learnings = experimentRows
    .filter((e) => e.learnings)
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 5);

  return {
    kpis: {
      totalIdeas: ideaRows.length,
      ideasThisWeek,
      ideasValidated,
      mvpsLaunched,
      activeProducts,
      winners,
      killedProducts,
      totalRevenueCents,
      mrrCents,
      revenueThisMonthCents,
      avgHoursPerProduct,
      revenuePerHourCents,
      conversionRate,
      experimentsRunning,
    },
    pipeline,
    todaysActions,
    pendingDecisionsCount: pendingDecisions?.length ?? 0,
    products: productRows,
    metrics: metricRows,
    expenses: expenseRows,
    timeEntries: timeEntryRows,
    learnings,
  };
}
