import {
  VALIDATION_LADDER_STAGES,
  ladderStageCount,
  type ValidationTotals,
} from "@/lib/domain/validation-metrics";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const STAGE_LABELS: Record<string, string> = {
  CLICK: "Click",
  VISIT: "Visit",
  SIGNUP: "Signup",
  ACTIVATION: "Activation",
  RETURN: "Return",
  CHECKOUT: "Checkout",
  PAYMENT: "Payment",
};

export function ValidationLadder({ totals }: { totals: ValidationTotals }) {
  // CLICK and VISIT share the same underlying number (visitors) — collapse
  // them into one rendered step so the ladder doesn't imply data we don't
  // separately track.
  const stages = VALIDATION_LADDER_STAGES.filter((s) => s !== "CLICK");

  return (
    <div className="flex flex-col gap-1">
      {stages.map((stage, i) => {
        const count = ladderStageCount(stage, totals);
        const isPayment = stage === "PAYMENT";
        return (
          <div key={stage} className="flex items-center gap-3">
            <div className="w-24 shrink-0 text-xs font-medium text-muted-foreground">
              {STAGE_LABELS[stage]}
            </div>
            <div className="h-6 flex-1 rounded bg-muted">
              <div
                className={cn(
                  "h-full rounded",
                  isPayment ? "bg-success" : "bg-info",
                )}
                style={{
                  width: `${totals.visitors > 0 ? Math.max((count / totals.visitors) * 100, count > 0 ? 2 : 0) : 0}%`,
                }}
              />
            </div>
            <div className="w-14 shrink-0 text-right text-sm font-medium">
              {formatNumber(count)}
            </div>
            {i === stages.length - 1 && (
              <span className="w-28 shrink-0 text-xs text-muted-foreground">
                strongest signal
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
