import { z } from "zod";

import { dollarsToCents } from "@/lib/money";

const optionalText = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.string().optional(),
);

const optionalUuid = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.string().uuid().optional(),
);

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().optional(),
);

const optionalScore = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().int().min(1).max(5).optional(),
);

export const ideaSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: optionalText,
  category_id: optionalUuid,
  target_customer: optionalText,
  problem: optionalText,
  solution: optionalText,
  source_id: optionalUuid,
  source_url: optionalText,
  founder_notes: optionalText,

  existing_alternatives: optionalText,
  main_competitor: optionalText,
  competitor_url: optionalText,
  competitor_pricing: optionalText,
  competitor_reviews: optionalText,
  market_size_estimate: optionalText,
  search_intent_notes: optionalText,
  evidence_of_demand: optionalText,

  mvp_complexity: optionalText,
  estimated_build_hours: optionalNumber,
  required_integrations: optionalText,
  technical_risks: optionalText,
  distribution_channel: optionalText,
  potential_moat: optionalText,
  monetization_model: optionalText,
  expected_price_dollars: optionalNumber,

  score_pain: optionalScore,
  score_frequency: optionalScore,
  score_willingness_to_pay: optionalScore,
  score_search_intent: optionalScore,
  score_buildability: optionalScore,
  score_distribution: optionalScore,

  evidence_confidence: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().int().min(0).max(5).optional(),
  ),
});

export type IdeaFormValues = z.infer<typeof ideaSchema>;

export function parseIdeaFormData(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = ideaSchema.safeParse(raw);
  if (!parsed.success) return parsed;

  const { expected_price_dollars, ...rest } = parsed.data;
  return {
    success: true as const,
    data: {
      ...rest,
      expected_price_cents: dollarsToCents(expected_price_dollars),
    },
  };
}
