import type { ProductPnl } from "@/lib/domain/pnl";
import { formatCents, formatHours } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

export function PnlSummary({ pnl }: { pnl: ProductPnl }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Gross revenue" value={formatCents(pnl.grossRevenueCents)} />
      <Stat label="Refunds" value={formatCents(pnl.refundsCents)} />
      <Stat label="Net revenue" value={formatCents(pnl.netRevenueCents)} />
      <Stat label="MRR (30d)" value={formatCents(pnl.mrrCents)} />
      <Stat label="Total costs" value={formatCents(pnl.totalCostCents)} />
      <Stat label="Net profit" value={formatCents(pnl.netProfitCents)} />
      <Stat label="Total hours" value={formatHours(pnl.totalHours)} />
      <Stat label="Revenue / hour" value={formatCents(pnl.revenuePerHourCents)} />
      <Stat label="Profit / hour" value={formatCents(pnl.profitPerHourCents)} />
      <Stat
        label="Monthly operating cost"
        value={formatCents(pnl.monthlyOperatingCostCents)}
      />
      <Stat
        label="Break-even"
        value={
          pnl.breakEvenMonths === null
            ? "INSUFFICIENT DATA"
            : `${pnl.breakEvenMonths.toFixed(1)} mo of current MRR`
        }
      />
    </div>
  );
}
