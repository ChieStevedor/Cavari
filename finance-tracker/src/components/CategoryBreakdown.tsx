import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CATEGORY_COLORS } from '../data';
import { formatCurrency, round2 } from '../format';
import type { Transaction } from '../types';

interface CategoryBreakdownProps {
  transactions: Transaction[];
}

export default function CategoryBreakdown({ transactions }: CategoryBreakdownProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const totals = new Map<string, number>();
  const itemsByCategory = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.type !== 'expense' || !t.category) continue;
    totals.set(t.category, round2((totals.get(t.category) ?? 0) + t.amount));
    const list = itemsByCategory.get(t.category) ?? [];
    list.push(t);
    itemsByCategory.set(t.category, list);
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
          const isExpanded = expanded === category;
          const items = [...(itemsByCategory.get(category) ?? [])].sort((a, b) => {
            if (a.date !== b.date) return a.date < b.date ? 1 : -1;
            return b.createdAt - a.createdAt;
          });

          return (
            <div key={category}>
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : category)}
                className="block w-full text-left"
              >
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 font-medium">
                    {category}
                    {isExpanded ? (
                      <ChevronUp size={14} className="text-[#8A8478]" />
                    ) : (
                      <ChevronDown size={14} className="text-[#8A8478]" />
                    )}
                  </span>
                  <span className="text-[#8A8478]">{formatCurrency(total)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0ECE3]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${width}%`, backgroundColor: color }}
                  />
                </div>
              </button>

              {isExpanded && (
                <div
                  className="mt-2 flex flex-col gap-1.5 border-l-2 pl-3"
                  style={{ borderColor: color }}
                >
                  {items.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-xs">
                      <span className="text-[#8A8478]">
                        {t.date}
                        {t.note ? ` · ${t.note}` : ''}
                      </span>
                      <span className="shrink-0 font-medium" style={{ color }}>
                        {formatCurrency(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
