import {
  interpretOpportunityScore,
  interpretEvidenceConfidence,
  isAssumptionHeavy,
  OPPORTUNITY_SCORE_MAX,
} from "@/lib/domain/scoring";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

function opportunityVariant(score: number): "success" | "info" | "warning" | "danger" {
  if (score >= 21) return "success";
  if (score >= 17) return "info";
  if (score >= 13) return "warning";
  return "danger";
}

function evidenceVariant(level: number): "success" | "info" | "warning" | "danger" {
  if (level >= 4) return "success";
  if (level >= 2) return "info";
  if (level >= 1) return "warning";
  return "danger";
}

export function ScoreBadges({
  opportunityScore,
  evidenceConfidence,
}: {
  opportunityScore: number;
  evidenceConfidence: number | null;
}) {
  const assumptionHeavy = isAssumptionHeavy(opportunityScore, evidenceConfidence);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={opportunityVariant(opportunityScore)}>
        Opportunity {opportunityScore}/{OPPORTUNITY_SCORE_MAX} ·{" "}
        {interpretOpportunityScore(opportunityScore)}
      </Badge>
      <Badge
        variant={
          evidenceConfidence === null
            ? "outline"
            : evidenceVariant(evidenceConfidence)
        }
      >
        Evidence {evidenceConfidence ?? "—"}/5 ·{" "}
        {interpretEvidenceConfidence(evidenceConfidence)}
      </Badge>
      {assumptionHeavy && (
        <span
          title="High opportunity score with little to no evidence — this is still an assumption, not proven demand."
          className="inline-flex items-center gap-1 text-xs text-warning-foreground"
        >
          <AlertTriangle className="size-3.5" />
          Assumption, not evidence
        </span>
      )}
    </div>
  );
}
