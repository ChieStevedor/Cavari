import { Trash2 } from 'lucide-react';
import { CATEGORY_COLORS } from '../data';
import { formatCurrency } from '../format';
import type { Accounts, Transaction } from '../types';

interface TransactionHistoryProps {
  transactions: Transaction[];
  accounts: Accounts;
  onDelete: (id: string) => void;
}

export default function TransactionHistory({
  transactions,
  accounts,
  onDelete,
}: TransactionHistoryProps) {
  const sorted = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="rounded-2xl border border-[#E8E3D9] bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#8A8478]">
        History
      </h2>

      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#8A8478]">
          No entries yet — add your first one above.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-[#E8E3D9]">
          {sorted.map((t) => {
            const color = CATEGORY_COLORS[t.category] ?? '#8A8478';
            const accountLabel = accounts[t.account]?.label ?? t.account;
            return (
              <div key={t.id} className="flex items-center gap-3 py-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.category}</div>
                  {t.note && <div className="truncate text-xs text-[#8A8478]">{t.note}</div>}
                  <div className="text-xs text-[#8A8478]">
                    {t.date} · {accountLabel}
                  </div>
                </div>
                <div
                  className="shrink-0 text-sm font-semibold"
                  style={{ color: t.type === 'income' ? '#7FBF8F' : '#E08D6D' }}
                >
                  {t.type === 'income' ? '+' : '-'}
                  {formatCurrency(t.amount)}
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(t.id)}
                  aria-label="Delete entry"
                  className="shrink-0 rounded-lg p-1.5 text-[#8A8478] transition hover:bg-[#F5F2EC] hover:text-[#C9694A]"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
