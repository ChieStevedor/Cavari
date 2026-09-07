import { z } from "zod";

import { dollarsToCents } from "@/lib/money";

const optionalText = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.string().optional(),
);

const optionalDate = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.string().optional(),
);

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().optional(),
);

const optionalInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().optional(),
);

export const experimentSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  hypothesis: z.string().min(1, "Hypothesis is required"),
  target_customer_who: optionalText,
  target_customer_problem: optionalText,
  current_solution: optionalText,
  dissatisfaction_reason: optionalText,
  purchase_trigger: optionalText,
  reach_channel: optionalText,
  channel: optionalText,
  start_date: optionalDate,
  end_date: optionalDate,
  budget_dollars: optionalNumber,
  time_budget_hours: optionalNumber,
  traffic_target: optionalInt,
  signup_target: optionalInt,
  revenue_target_dollars: optionalNumber,
});

export function parseExperimentFormData(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = experimentSchema.safeParse(raw);
  if (!parsed.success) return parsed;

  const { budget_dollars, revenue_target_dollars, ...rest } = parsed.data;
  return {
    success: true as const,
    data: {
      ...rest,
      budget_cents: dollarsToCents(budget_dollars),
      revenue_target_cents: dollarsToCents(revenue_target_dollars),
    },
  };
}

export const validationMetricSchema = z.object({
  date: z.string().min(1, "Date is required"),
  visitors: z.coerce.number().int().min(0).default(0),
  signups: z.coerce.number().int().min(0).default(0),
  activated_users: z.coerce.number().int().min(0).default(0),
  returning_users: z.coerce.number().int().min(0).default(0),
  checkout_starts: z.coerce.number().int().min(0).default(0),
  purchases: z.coerce.number().int().min(0).default(0),
  revenue_dollars: z.coerce.number().min(0).default(0),
  cost_dollars: z.coerce.number().min(0).default(0),
  hours: z.coerce.number().min(0).default(0),
});

export function parseValidationMetricFormData(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = validationMetricSchema.safeParse(raw);
  if (!parsed.success) return parsed;

  const { revenue_dollars, cost_dollars, ...rest } = parsed.data;
  return {
    success: true as const,
    data: {
      ...rest,
      revenue_cents: dollarsToCents(revenue_dollars),
      cost_cents: dollarsToCents(cost_dollars),
    },
  };
}
