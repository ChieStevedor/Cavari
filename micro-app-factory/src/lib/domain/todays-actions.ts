// Today's Actions (§29) — a prioritized, reasoned action list meant to
// reduce analysis paralysis. Every entry names *why* it's here so it never
// reads as a generic reminder.

import { isAssumptionHeavy } from "@/lib/domain/scoring";
import {
  RECOMMENDATION_TO_DECISION_TYPE,
  type Recommendation,
  type RecommendationResult,
} from "@/lib/domain/decision-engine";
import { ACTIVE_PRODUCT_STATUSES } from "@/lib/domain/statuses";
import type { Decision, Idea, Product, ProductStatus, ValidationExperiment } from "@/lib/supabase/types";

export type ActionPriority = "HIGH" | "MEDIUM" | "LOW";

/** The product status a recommendation is telling you to move *to*. Used
 * only to suppress a "Review X for SCALE"-type action once the product has
 * already reached that exact target state (confirmed bug: this used to fire
 * indefinitely post-promotion, since a still-strong SCALE product keeps
 * recommending SCALE forever). Deliberately local to Today's Actions rather
 * than a canonical status mapping: nothing else needs "what status does
 * this recommendation imply", and the recommendation is recomputed fresh
 * from live metrics on every call, so if new evidence later changes it to
 * something else, this stops applying and a fresh review action can fire
 * again on its own — no extra state to track. */
const RECOMMENDATION_TARGET_STATUS: Partial<Record<Recommendation, ProductStatus>> = {
  KILL: "KILLED",
  SCALE: "SCALE",
};

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
  /** The product's current recommendation, computed by the caller (which
   * already has its metrics/expenses/time entries loaded) — see P1.4
   * remediation: this is what lets Today's Actions surface a KILL/SCALE
   * candidate proactively, instead of only reacting to a decision someone
   * already sent to the queue by hand. Keyed by product id. */
  productRecommendations?: Map<string, RecommendationResult>;
}): TodaysAction[] {
  const actions: TodaysAction[] = [];
  const now = new Date();

  // Subject+type pairs already represented by a pending decision — used to
  // avoid surfacing the same KILL/SCALE signal twice (once as "resolve this
  // decision", once as "review this product") for the same underlying fact.
  const pendingSubjectTypes = new Set(
    input.pendingDecisions.map(
      (d) => `${d.idea_id ?? d.product_id}:${d.decision_type}`,
    ),
  );

  // Products that already have a *visible* KILL/SCALE-related action on the
  // list below (a "Resolve decision" item, or a proactive "Review X for Y")
  // — used only to keep the generic weekly launch-review (P2.9) from being
  // redundant with one of those, never to suppress it outright just because
  // the recommendation happens to be KILL/SCALE (see RECOMMENDATION_TARGET_STATUS:
  // once a product is already at its recommended target state, the specific
  // action is suppressed, and the generic weekly review must still be able
  // to fire — otherwise an already-scaled product with an ongoing SCALE
  // recommendation would stop being reviewed at all).
  const productsWithVisibleKillOrScaleAction = new Set<string>();

  for (const decision of input.pendingDecisions) {
    const subjectId = decision.idea_id ?? decision.product_id;
    const href = decision.idea_id
      ? `/ideas/${decision.idea_id}`
      : `/products/${decision.product_id}`;
    if (decision.product_id && (decision.recommendation === "KILL" || decision.recommendation === "SCALE")) {
      productsWithVisibleKillOrScaleAction.add(decision.product_id);
    }
    actions.push({
      priority: decision.recommendation === "KILL" ? "HIGH" : "MEDIUM",
      title: `Resolve decision: ${decision.recommendation.replace("_", " ")}`,
      reason: decision.reason,
      href: subjectId ? href : "/decisions",
    });
  }

  // P1.4: proactively surface KILL/SCALE candidates among live products,
  // rather than only reacting to decisions a human already created.
  if (input.productRecommendations) {
    for (const product of input.products) {
      if (!ACTIVE_PRODUCT_STATUSES.includes(product.status)) continue;
      const recommendation = input.productRecommendations.get(product.id);
      if (!recommendation) continue;
      if (recommendation.recommendation !== "KILL" && recommendation.recommendation !== "SCALE") {
        continue;
      }

      if (RECOMMENDATION_TARGET_STATUS[recommendation.recommendation] === product.status) {
        continue; // already in the recommended target state -- nothing left to promote to
      }

      const decisionType = RECOMMENDATION_TO_DECISION_TYPE[recommendation.recommendation];
      if (decisionType && pendingSubjectTypes.has(`${product.id}:${decisionType}`)) {
        continue; // already represented above as a pending decision to resolve
      }

      productsWithVisibleKillOrScaleAction.add(product.id);
      actions.push({
        priority: recommendation.recommendation === "KILL" ? "HIGH" : "MEDIUM",
        title: `Review ${product.name} for ${recommendation.recommendation}`,
        reason: recommendation.reasons[0] ?? "",
        href: `/products/${product.id}`,
      });
    }
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
    // P2.9 fix (landed here since it's the same per-product loop this
    // remediation was already touching for P1.4): these two checks used to
    // share one `if (status !== "BUILDING" ...) continue` guard, which made
    // the "review after launch" check below completely unreachable for any
    // product that had actually launched — status is never "BUILDING" once
    // live. They're independent checks now.
    if (product.status === "BUILDING" && product.dev_target_launch) {
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
    }

    if (product.launch_date) {
      const launched = new Date(product.launch_date);
      const daysSince = Math.floor((now.getTime() - launched.getTime()) / 86_400_000);
      // P2.9 fix: was `=== 7` — a founder who doesn't open the app on
      // exactly the 7th day permanently missed this review under the old
      // logic. `>= 7` alone would instead fire every single day forever,
      // which is its own kind of spam, so this repeats on a weekly cadence
      // (day 7, 14, 21, ...) rather than daily — "hasn't been generated
      // for this period yet" without needing new state to track dismissal.
      // Suppressed only when a KILL/SCALE signal is actually *visible*
      // elsewhere on the list, not merely whenever the recommendation is
      // KILL/SCALE — a product already at its recommended target state has
      // no visible signal (see RECOMMENDATION_TARGET_STATUS above) and must
      // still get this generic check-in, or it stops being reviewed at all.
      const alreadyHasKillOrScaleSignal = productsWithVisibleKillOrScaleAction.has(product.id);
      if (daysSince >= 7 && daysSince % 7 === 0 && !alreadyHasKillOrScaleSignal) {
        actions.push({
          priority: "HIGH",
          title: `Review ${product.name}`,
          reason: `${daysSince} days since launch — enough traffic to evaluate.`,
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
