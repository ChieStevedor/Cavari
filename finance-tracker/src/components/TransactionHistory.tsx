import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { CATEGORY_COLORS, TRANSFER_COLOR } from '../data';
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
  const [isOpen, setIsOpen] = useState(false);
  const sorted = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="rounded-2xl border border-[#E8E3D9] bg-white p-4">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8A8478]">
          History{sorted.length > 0 ? ` (${sorted.length})` : ''}
        </h2>
        {isOpen ? (
          <ChevronUp size={18} className="text-[#8A8478]" />
        ) : (
          <ChevronDown size={18} className="text-[#8A8478]" />
        )}
      </button>

      {isOpen &&
        (sorted.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#8A8478]">
            No entries yet — add your first one above.
          </p>
        ) : (
          <div className="mt-3 flex flex-col divide-y divide-[#E8E3D9]">
            {sorted.map((t) => {
              const isTransfer = t.type === 'transfer';
              const color = isTransfer
                ? TRANSFER_COLOR
                : (CATEGORY_COLORS[t.category ?? ''] ?? '#8A8478');
              const title = isTransfer ? 'Transfer' : t.category;
              const hasSplit = t.dailyAmount !== undefined && t.vaultAmount !== undefined;
              const detailLine = isTransfer
                ? `${t.date} · ${accounts[t.fromAccount!]?.label ?? t.fromAccount} → ${accounts[t.toAccount!]?.label ?? t.toAccount}`
                : hasSplit
                  ? `${t.date} · Uber ${formatCurrency(t.dailyAmount!)} + Vault ${formatCurrency(t.vaultAmount!)}`
                  : `${t.date} · ${accounts[t.account!]?.label ?? t.account}`;

              return (
                <div key={t.id} className="flex items-center gap-3 py-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{title}</div>
                    {t.note && <div className="truncate text-xs text-[#8A8478]">{t.note}</div>}
                    <div className="text-xs text-[#8A8478]">{detailLine}</div>
                  </div>
                  <div
                    className="shrink-0 text-sm font-semibold"
                    style={{
                      color: isTransfer
                        ? TRANSFER_COLOR
                        : t.type === 'income'
                          ? '#7FBF8F'
                          : '#E08D6D',
                    }}
                  >
                    {isTransfer ? '' : t.type === 'income' ? '+' : '-'}
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
        ))}
    </div>
  );
}
