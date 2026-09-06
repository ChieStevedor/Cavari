import { createClient } from "@/lib/supabase/server";
import type {
  Expense,
  LaunchChecklistItem,
  Metric,
  Product,
  TimeEntry,
} from "@/lib/supabase/types";

export interface ProductWithLookups extends Product {
  category: { id: string; name: string } | null;
  idea: { id: string; name: string; opportunity_score: number } | null;
}

export interface ProductListFilters {
  status?: string;
  categoryId?: string;
  search?: string;
}

export async function getProducts(
  filters: ProductListFilters = {},
): Promise<ProductWithLookups[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(
      "*, category:categories(id, name), idea:ideas(id, name, opportunity_score)",
    )
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.search) query = query.ilike("name", `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as ProductWithLookups[];
}

export async function getProductById(
  id: string,
): Promise<ProductWithLookups | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(id, name), idea:ideas(id, name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as ProductWithLookups | null;
}

export async function getProductByIdeaId(
  ideaId: string,
): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("idea_id", ideaId)
    .maybeSingle();
  if (error) throw error;
  return data as Product | null;
}

export async function getMetricsForProduct(productId: string): Promise<Metric[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("metrics")
    .select("*")
    .eq("product_id", productId)
    .order("date", { ascending: true });
  if (error) throw error;
  return data as Metric[];
}

export async function getExpensesForProduct(productId: string): Promise<Expense[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("product_id", productId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data as Expense[];
}

export async function getTimeEntriesForProduct(
  productId: string,
): Promise<TimeEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("product_id", productId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data as TimeEntry[];
}

export async function getLaunchChecklistForProduct(
  productId: string,
): Promise<LaunchChecklistItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("launch_checklist_items")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as LaunchChecklistItem[];
}
