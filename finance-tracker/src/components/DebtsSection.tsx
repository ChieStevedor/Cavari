import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import NumberField from './NumberField';
import { formatCurrency, round2 } from '../format';
import type { Debt } from '../types';

interface DebtsSectionProps {
  debts: Debt[];
  onAdd: (name: string, amount: number) => void;
  onUpdateAmount: (id: string, amount: number) => void;
  onDelete: (id: string) => void;
}

const DEBT_COLOR = '#C9694A';

export default function DebtsSection({ debts, onAdd, onUpdateAmount, onDelete }: DebtsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  const parsedAmount = parseFloat(amount);
  const canAdd = name.trim().length > 0 && parsedAmount > 0;

  function handleAdd() {
    if (!canAdd) return;
    onAdd(name.trim(), round2(parsedAmount));
    setName('');
    setAmount('');
    setIsAdding(false);
  }

  const total = round2(debts.reduce((sum, d) => round2(sum + d.amount), 0));

  return (
    <div className="rounded-2xl border border-[#E8E3D9] bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8A8478]">
          Debts{debts.length > 0 ? ` (${formatCurrency(total)})` : ''}
        </h2>
        <button
          type="button"
          onClick={() => setIsAdding((v) => !v)}
          aria-label="Add debt"
          className="rounded-lg p-1.5 transition hover:bg-[#F5F2EC]"
          style={{ color: isAdding ? DEBT_COLOR : '#8A8478' }}
        >
          <Plus size={18} />
        </button>
      </div>

      {isAdding && (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-[#E8E3D9] p-3">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-[#E8E3D9] px-3 py-2 text-sm outline-none focus:border-[#C97B4A]"
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-[#E8E3D9] px-3 py-2 text-sm outline-none focus:border-[#C97B4A]"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="rounded-lg bg-[#C97B4A] py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}

      {debts.length === 0 && !isAdding ? (
        <p className="mt-3 text-xs text-[#8A8478]">No debts.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {debts.map((debt) => (
            <div key={debt.id} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{debt.name}</span>
              <NumberField
                value={debt.amount}
                onChange={(v) => onUpdateAmount(debt.id, v)}
                color={DEBT_COLOR}
              />
              <button
                type="button"
                onClick={() => onDelete(debt.id)}
                aria-label={`Delete debt: ${debt.name}`}
                className="shrink-0 rounded-lg p-1.5 text-[#8A8478] transition hover:bg-[#F5F2EC] hover:text-[#C9694A]"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
