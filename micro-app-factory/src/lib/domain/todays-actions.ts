// Today's Actions (§29) — a prioritized, reasoned action list meant to
// reduce analysis paralysis. Every entry names *why* it's here so it never
// reads as a generic reminder.

import { isAssumptionHeavy } from "@/lib/domain/scoring";
import type { Decision, Idea, Product, ValidationExperiment } from "@/lib/supabase/types";

export type ActionPriority = "HIGH" | "MEDIUM" | "LOW";

export interface TodaysAction {
  priority: ActionPriority;
  title: string;
  reason: string;
  href: string;
}

const PRIORITY_RANK: Record<ActionPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export function generateTodaysActions(input: {
  ideas: Idea[];
  products: Product[];
  experiments: ValidationExperiment[];
  pendingDecisions: Decision[];
}): TodaysAction[] {
  const actions: TodaysAction[] = [];
  const now = new Date();

  for (const decision of input.pendingDecisions) {
    const subjectId = decision.idea_id ?? decision.product_id;
    const href = decision.idea_id
      ? `/ideas/${decision.idea_id}`
      : `/products/${decision.product_id}`;
    actions.push({
      priority: decision.recommendation === "KILL" ? "HIGH" : "MEDIUM",
      title: `Resolve decision: ${decision.recommendation.replace("_", " ")}`,
      reason: decision.reason,
      href: subjectId ? href : "/decisions",
    });
  }

  for (const experiment of input.experiments) {
    if (experiment.status !== "RUNNING") continue;
    if (!experiment.end_date) continue;
    const end = new Date(experiment.end_date);
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86_400_000);
    if (daysLeft <= 3) {
      actions.push({
        priority: daysLeft < 0 ? "HIGH" : "MEDIUM",
        title: `Validation deadline ${daysLeft < 0 ? "passed" : "approaching"}: ${experiment.name}`,
        reason:
          daysLeft < 0
            ? `End date was ${experiment.end_date} — review and decide.`
            : `Ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
        href: `/ideas/${experiment.idea_id}/validate`,
      });
    }
  }

  for (const product of input.products) {
    if (product.status !== "BUILDING" || !product.dev_target_launch) continue;
    const target = new Date(product.dev_target_launch);
    const daysLeft = Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
    if (daysLeft <= 5) {
      actions.push({
        priority: daysLeft < 0 ? "HIGH" : "MEDIUM",
        title: `MVP deadline ${daysLeft < 0 ? "passed" : "approaching"}: ${product.name}`,
        reason:
          daysLeft < 0
            ? `Target launch was ${product.dev_target_launch}.`
            : `Target launch in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
        href: `/products/${product.id}`,
      });
    }
    if (product.launch_date) {
      const launched = new Date(product.launch_date);
      const daysSince = Math.floor((now.getTime() - launched.getTime()) / 86_400_000);
      if (daysSince === 7) {
        actions.push({
          priority: "HIGH",
          title: `Review ${product.name}`,
          reason: "7 days since launch — enough traffic to evaluate.",
          href: `/products/${product.id}`,
        });
      }
    }
  }

  for (const idea of input.ideas) {
    if (["KILLED", "ARCHIVED", "WINNER"].includes(idea.status)) continue;
    if (isAssumptionHeavy(idea.opportunity_score, idea.evidence_confidence)) {
      actions.push({
        priority: "MEDIUM",
        title: `Research idea: ${idea.name}`,
        reason: `Opportunity Score ${idea.opportunity_score}/30 but Evidence Confidence is only ${idea.evidence_confidence ?? 0}/5 — still mostly assumption.`,
        href: `/ideas/${idea.id}`,
      });
    }
  }

  return actions.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
}
