import { formatCents, formatPercent } from "@/lib/format";
import type { ValidationRatios } from "@/lib/domain/validation-metrics";

const ROWS: { key: keyof ValidationRatios; label: string; money?: boolean }[] = [
  { key: "landingConversion", label: "Landing Conversion (Signups / Visitors)" },
  { key: "activationRate", label: "Activation Rate (Activated / Signups)" },
  { key: "retentionProxy", label: "Retention Proxy (Returning / Activated)" },
  { key: "paidConversion", label: "Paid Conversion (Purchases / Activated)" },
  { key: "revenuePerVisitorCents", label: "Revenue per Visitor", money: true },
  { key: "revenuePerHourCents", label: "Revenue per Hour", money: true },
];

export function ConversionStats({ ratios }: { ratios: ValidationRatios }) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {ROWS.map((row) => (
        <div key={row.key} className="flex items-center justify-between rounded-md border px-3 py-2">
          <dt className="text-xs text-muted-foreground">{row.label}</dt>
          <dd className="text-sm font-medium">
            {row.money
              ? formatCents(ratios[row.key])
              : formatPercent(ratios[row.key])}
          </dd>
        </div>
      ))}
    </dl>
  );
}
