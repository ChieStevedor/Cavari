// Hand-written to match supabase/migrations/*.sql. If the schema changes,
// update this file and the migration together — there is no live project to
// run `supabase gen types` against yet.

export type IdeaStatus =
  | "IDEA"
  | "RESEARCHING"
  | "SCORED"
  | "VALIDATING"
  | "APPROVED_TO_BUILD"
  | "BUILDING"
  | "LAUNCHED"
  | "MEASURING"
  | "ITERATING"
  | "SCALE"
  | "WINNER"
  | "KILLED"
  | "ARCHIVED";

export type ProductStatus =
  | "BUILDING"
  | "LAUNCHED"
  | "MEASURING"
  | "ITERATING"
  | "SCALE"
  | "WINNER"
  | "KILLED"
  | "ARCHIVED";

export type ExperimentStatus =
  | "PLANNED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "SUCCESSFUL";

export type DecisionType =
  | "approve_validation"
  | "approve_build"
  | "continue_validating"
  | "launch"
  | "iterate"
  | "kill"
  | "scale"
  | "change_pricing"
  | "increase_marketing_budget";

export type DecisionStatus = "PENDING" | "CONFIRMED" | "DISMISSED";

export type ResearchItemType =
  | "reddit"
  | "app_store"
  | "google_play"
  | "google_search"
  | "competitor_site"
  | "product_hunt"
  | "forum"
  | "screenshot"
  | "document"
  | "note";

export type ExpenseCategory =
  | "hosting"
  | "apis"
  | "ai_usage"
  | "saas"
  | "advertising"
  | "domains"
  | "other";

export type TimeCategory =
  | "research"
  | "coding"
  | "design"
  | "marketing"
  | "support"
  | "admin";

export type NotificationType =
  | "validation_deadline"
  | "mvp_deadline"
  | "ready_for_review"
  | "revenue_milestone"
  | "spend_threshold"
  | "experiment_failed"
  | "scale_review"
  | "kill_review";

export interface IdeaSource {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface Category {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface ScoringRule {
  id: string;
  owner_id: string;
  factor_key:
    | "pain"
    | "frequency"
    | "willingness_to_pay"
    | "search_intent"
    | "buildability"
    | "distribution_potential";
  label: string;
  weight: number;
  active: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface Idea {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  target_customer: string | null;
  problem: string | null;
  solution: string | null;
  source_id: string | null;
  source_url: string | null;
  founder_notes: string | null;
  existing_alternatives: string | null;
  main_competitor: string | null;
  competitor_url: string | null;
  competitor_pricing: string | null;
  competitor_reviews: string | null;
  market_size_estimate: string | null;
  search_intent_notes: string | null;
  evidence_of_demand: string | null;
  mvp_complexity: string | null;
  estimated_build_hours: number | null;
  required_integrations: string | null;
  technical_risks: string | null;
  distribution_channel: string | null;
  potential_moat: string | null;
  monetization_model: string | null;
  expected_price_cents: number | null;
  score_pain: number | null;
  score_frequency: number | null;
  score_willingness_to_pay: number | null;
  score_search_intent: number | null;
  score_buildability: number | null;
  score_distribution: number | null;
  opportunity_score: number;
  evidence_confidence: number | null;
  status: IdeaStatus;
  created_at: string;
  updated_at: string;
}

export interface ResearchItem {
  id: string;
  owner_id: string;
  idea_id: string;
  type: ResearchItemType;
  url: string | null;
  title: string | null;
  notes: string | null;
  evidence_strength: number | null;
  created_at: string;
}

export interface ValidationExperiment {
  id: string;
  owner_id: string;
  idea_id: string;
  name: string;
  hypothesis: string;
  target_customer_who: string | null;
  target_customer_problem: string | null;
  current_solution: string | null;
  dissatisfaction_reason: string | null;
  purchase_trigger: string | null;
  reach_channel: string | null;
  channel: string | null;
  start_date: string | null;
  end_date: string | null;
  budget_cents: number | null;
  time_budget_hours: number | null;
  traffic_target: number | null;
  signup_target: number | null;
  revenue_target_cents: number | null;
  status: ExperimentStatus;
  result: string | null;
  learnings: string | null;
  created_at: string;
  updated_at: string;
}

export interface ValidationMetric {
  id: string;
  owner_id: string;
  experiment_id: string;
  date: string;
  visitors: number;
  signups: number;
  activated_users: number;
  returning_users: number;
  checkout_starts: number;
  purchases: number;
  revenue_cents: number;
  cost_cents: number;
  hours: number;
  created_at: string;
}

export interface Product {
  id: string;
  owner_id: string;
  idea_id: string;
  name: string;
  url: string | null;
  category_id: string | null;
  status: ProductStatus;
  maturity: number;
  launch_date: string | null;
  pricing_model: string | null;
  price_cents: number | null;
  mvp_core_problem: string | null;
  mvp_core_feature: string | null;
  mvp_must_have: string[];
  mvp_should_have: string[];
  mvp_not_now: string[];
  mvp_future: string[];
  dev_start_date: string | null;
  dev_target_launch: string | null;
  dev_actual_launch: string | null;
  dev_estimated_hours: number | null;
  dev_actual_hours: number | null;
  dev_tools_used: string | null;
  dev_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Metric {
  id: string;
  owner_id: string;
  product_id: string;
  date: string;
  visitors: number;
  users: number;
  activated_users: number;
  returning_users: number;
  checkout_starts: number;
  purchases: number;
  revenue_cents: number;
  refunds_cents: number;
  created_at: string;
}

export interface Expense {
  id: string;
  owner_id: string;
  product_id: string;
  date: string;
  category: ExpenseCategory;
  amount_cents: number;
  description: string | null;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  owner_id: string;
  product_id: string;
  date: string;
  category: TimeCategory;
  hours: number;
  description: string | null;
  created_at: string;
}

export interface LaunchChecklistItem {
  id: string;
  owner_id: string;
  product_id: string;
  label: string;
  is_default: boolean;
  completed: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface GrowthExperiment {
  id: string;
  owner_id: string;
  product_id: string;
  hypothesis: string;
  channel: string | null;
  budget_cents: number | null;
  hours: number | null;
  start_date: string | null;
  end_date: string | null;
  expected_result: string | null;
  actual_result: string | null;
  status: ExperimentStatus;
  outcome: string | null;
  learnings: string | null;
  created_at: string;
  updated_at: string;
}

export interface Decision {
  id: string;
  owner_id: string;
  idea_id: string | null;
  product_id: string | null;
  decision_type: DecisionType;
  recommendation: string;
  reason: string;
  evidence: Record<string, unknown>;
  status: DecisionStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface Notification {
  id: string;
  owner_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  related_idea_id: string | null;
  related_product_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface WeeklyReview {
  id: string;
  owner_id: string;
  week_start: string;
  week_end: string;
  ideas_generated: number;
  ideas_researched: number;
  ideas_validated: number;
  mvps_built: number;
  products_launched: number;
  products_killed: number;
  revenue_cents: number;
  new_customers: number;
  what_worked: string | null;
  what_failed: string | null;
  what_we_learned: string | null;
  next_week_changes: string | null;
  notes: string | null;
  created_at: string;
}
