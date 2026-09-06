"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { canTransitionProduct } from "@/lib/domain/statuses";
import {
  parseProductOverviewFormData,
  parseMvpScopeFormData,
  parseMetricFormData,
  parseExpenseFormData,
  parseTimeEntryFormData,
} from "@/lib/validation/product-schema";
import type { ActionResult } from "@/actions/ideas";
import type { ProductStatus } from "@/lib/supabase/types";

export async function updateProductStatus(
  productId: string,
  currentStatus: ProductStatus,
  nextStatus: ProductStatus,
) {
  if (!canTransitionProduct(currentStatus, nextStatus)) {
    throw new Error(`Cannot move product from ${currentStatus} to ${nextStatus}`);
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ status: nextStatus })
    .eq("id", productId);
  if (error) throw new Error(error.message);

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
}

export async function updateProductOverview(
  productId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseProductOverviewFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update(parsed.data)
    .eq("id", productId);
  if (error) return { error: error.message };

  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");
  return {};
}

export async function updateMvpScope(
  productId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseMvpScopeFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update(parsed.data)
    .eq("id", productId);
  if (error) return { error: error.message };

  revalidatePath(`/products/${productId}`);
  return {};
}

export async function addMetric(
  productId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseMetricFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("metrics")
    .upsert({ ...parsed.data, product_id: productId }, { onConflict: "product_id,date" });
  if (error) return { error: error.message };

  revalidatePath(`/products/${productId}`);
  return {};
}

export async function addExpense(
  productId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseExpenseFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("expenses")
    .insert({ ...parsed.data, product_id: productId });
  if (error) return { error: error.message };

  revalidatePath(`/products/${productId}`);
  return {};
}

export async function addTimeEntry(
  productId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = parseTimeEntryFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("time_entries")
    .insert({ ...parsed.data, product_id: productId });
  if (error) return { error: error.message };

  revalidatePath(`/products/${productId}`);
  return {};
}

export async function toggleChecklistItem(
  productId: string,
  itemId: string,
  completed: boolean,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("launch_checklist_items")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", itemId);
  if (error) throw new Error(error.message);

  revalidatePath(`/products/${productId}`);
}

export async function addChecklistItem(productId: string, label: string) {
  if (!label.trim()) return;
  const supabase = await createClient();
  const { count } = await supabase
    .from("launch_checklist_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  const { error } = await supabase.from("launch_checklist_items").insert({
    product_id: productId,
    label: label.trim(),
    is_default: false,
    sort_order: count ?? 0,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/products/${productId}`);
}
