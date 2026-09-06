import type { ProductHealth } from "@/lib/domain/health-score";
import { Progress } from "@/components/ui/progress";

export function HealthScorecard({ health }: { health: ProductHealth }) {
  if (health.insufficientData) {
    return (
      <p className="text-sm text-muted-foreground">
        INSUFFICIENT DATA — log at least a few days of metrics to see a health score.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold">{health.score}</span>
        <span className="text-sm text-muted-foreground">/ 100</span>
      </div>
      <div className="flex flex-col gap-2">
        {Object.values(health.components).map((c) => (
          <div key={c.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-muted-foreground">{c.label}</span>
            {c.insufficientData || c.value === null ? (
              <span className="text-xs text-muted-foreground">INSUFFICIENT DATA</span>
            ) : (
              <>
                <Progress value={c.value * 100} className="flex-1" />
                <span className="w-10 shrink-0 text-right text-xs font-medium">
                  {Math.round(c.value * 100)}%
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
