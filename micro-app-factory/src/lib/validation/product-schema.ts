import { z } from "zod";

import { dollarsToCents } from "@/lib/money";

const optionalText = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.string().optional(),
);

const optionalDate = optionalText;

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().optional(),
);

export const productOverviewSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  url: optionalText,
  pricing_model: optionalText,
  price_dollars: optionalNumber,
  launch_date: optionalDate,
  dev_target_launch: optionalDate,
  dev_actual_launch: optionalDate,
  dev_estimated_hours: optionalNumber,
  dev_actual_hours: optionalNumber,
  dev_tools_used: optionalText,
  dev_notes: optionalText,
});

export function parseProductOverviewFormData(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = productOverviewSchema.safeParse(raw);
  if (!parsed.success) return parsed;
  const { price_dollars, ...rest } = parsed.data;
  return {
    success: true as const,
    data: {
      ...rest,
      price_cents: dollarsToCents(price_dollars),
    },
  };
}

function linesToArray(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const mvpScopeSchema = z.object({
  mvp_core_problem: optionalText,
  mvp_core_feature: optionalText,
  mvp_must_have: z.preprocess(linesToArray, z.array(z.string())),
  mvp_should_have: z.preprocess(linesToArray, z.array(z.string())),
  mvp_not_now: z.preprocess(linesToArray, z.array(z.string())),
  mvp_future: z.preprocess(linesToArray, z.array(z.string())),
});

export function parseMvpScopeFormData(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return mvpScopeSchema.safeParse(raw);
}

export const metricSchema = z.object({
  date: z.string().min(1),
  visitors: z.coerce.number().int().min(0).default(0),
  users: z.coerce.number().int().min(0).default(0),
  activated_users: z.coerce.number().int().min(0).default(0),
  returning_users: z.coerce.number().int().min(0).default(0),
  checkout_starts: z.coerce.number().int().min(0).default(0),
  purchases: z.coerce.number().int().min(0).default(0),
  revenue_dollars: z.coerce.number().min(0).default(0),
  refunds_dollars: z.coerce.number().min(0).default(0),
});

export function parseMetricFormData(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = metricSchema.safeParse(raw);
  if (!parsed.success) return parsed;
  const { revenue_dollars, refunds_dollars, ...rest } = parsed.data;
  return {
    success: true as const,
    data: {
      ...rest,
      revenue_cents: dollarsToCents(revenue_dollars),
      refunds_cents: dollarsToCents(refunds_dollars),
    },
  };
}

export const expenseSchema = z.object({
  date: z.string().min(1),
  category: z.enum([
    "hosting",
    "apis",
    "ai_usage",
    "saas",
    "advertising",
    "domains",
    "other",
  ]),
  amount_dollars: z.coerce.number().min(0),
  description: optionalText,
});

export function parseExpenseFormData(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) return parsed;
  const { amount_dollars, ...rest } = parsed.data;
  return {
    success: true as const,
    data: { ...rest, amount_cents: dollarsToCents(amount_dollars) },
  };
}

export const timeEntrySchema = z.object({
  date: z.string().min(1),
  category: z.enum([
    "research",
    "coding",
    "design",
    "marketing",
    "support",
    "admin",
  ]),
  hours: z.coerce.number().positive(),
  description: optionalText,
});

export function parseTimeEntryFormData(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return timeEntrySchema.safeParse(raw);
}
