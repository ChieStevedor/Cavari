import { CATEGORY_COLORS } from '../data';
import { formatCurrency } from '../format';
import type { Transaction } from '../types';

interface CategoryBreakdownProps {
  transactions: Transaction[];
}

export default function CategoryBreakdown({ transactions }: CategoryBreakdownProps) {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }

  const rows = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  const max = rows.length > 0 ? rows[0][1] : 0;

  if (rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#E8E3D9] bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#8A8478]">
        By category
      </h2>
      <div className="flex flex-col gap-3">
        {rows.map(([category, total]) => {
          const color = CATEGORY_COLORS[category] ?? '#8A8478';
          const width = max > 0 ? (total / max) * 100 : 0;
          return (
            <div key={category}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{category}</span>
                <span className="text-[#8A8478]">{formatCurrency(total)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0ECE3]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${width}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
