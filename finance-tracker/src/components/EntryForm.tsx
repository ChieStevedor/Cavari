import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CATEGORY_COLORS, EXPENSE_CATEGORIES, PAY_FROM_ACCOUNTS } from '../data';
import type { Accounts, AccountId, Category, ExpenseCategory, Transaction } from '../types';

interface EntryFormProps {
  accounts: Accounts;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function EntryForm({ accounts, onAddTransaction }: EntryFormProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIso());
  const [category, setCategory] = useState<ExpenseCategory>('Gas');
  const [account, setAccount] = useState<AccountId>('uber');
  const [note, setNote] = useState('');

  const canSubmit = parseFloat(amount) > 0 && date;

  function handleSubmit() {
    const value = parseFloat(amount);
    if (!(value > 0) || !date) return;

    const resolvedCategory: Category = type === 'income' ? 'Uber Eats income' : category;
    const resolvedAccount: AccountId = type === 'income' ? 'uber' : account;

    onAddTransaction({
      type,
      amount: value,
      date,
      category: resolvedCategory,
      account: resolvedAccount,
      note: note.trim(),
    });

    setAmount('');
    setNote('');
    setDate(todayIso());
  }

  return (
    <div className="rounded-2xl border border-[#E8E3D9] bg-white p-4">
      <div className="flex rounded-xl bg-[#F5F2EC] p-1">
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            type === 'income' ? 'bg-white text-[#4F8F6B] shadow-sm' : 'text-[#8A8478]'
          }`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            type === 'expense' ? 'bg-white text-[#C9694A] shadow-sm' : 'text-[#8A8478]'
          }`}
        >
          Expense
        </button>
      </div>

      <div className="mt-4 flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-[#8A8478]">Amount</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-[#E8E3D9] px-3 py-2 outline-none focus:border-[#C97B4A]"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-[#8A8478]">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-[#E8E3D9] px-3 py-2 outline-none focus:border-[#C97B4A]"
          />
        </div>
      </div>

      {type === 'expense' && (
        <>
          <div className="mt-4">
            <label className="mb-1 block text-xs text-[#8A8478]">Category</label>
            <div className="flex flex-wrap gap-2">
              {EXPENSE_CATEGORIES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setCategory(c.name)}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition"
                  style={
                    category === c.name
                      ? { backgroundColor: c.color, borderColor: c.color, color: '#fff' }
                      : { borderColor: '#E8E3D9', color: c.color }
                  }
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-xs text-[#8A8478]">Paid from</label>
            <div className="flex flex-wrap gap-2">
              {PAY_FROM_ACCOUNTS.map((id) => {
                const acc = accounts[id];
                const selected = account === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAccount(id)}
                    className="rounded-full border px-3 py-1.5 text-xs font-medium transition"
                    style={
                      selected
                        ? { backgroundColor: acc.color, borderColor: acc.color, color: '#fff' }
                        : { borderColor: '#E8E3D9', color: acc.color }
                    }
                  >
                    {acc.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {type === 'income' && (
        <div className="mt-4 text-xs text-[#8A8478]">
          Category:{' '}
          <span style={{ color: CATEGORY_COLORS['Uber Eats income'] }}>Uber Eats income</span>
          {' · '}Account: <span style={{ color: accounts.uber.color }}>Uber (daily)</span>
        </div>
      )}

      <div className="mt-4">
        <label className="mb-1 block text-xs text-[#8A8478]">Note (optional)</label>
        <input
          type="text"
          placeholder="Add a note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border border-[#E8E3D9] px-3 py-2 outline-none focus:border-[#C97B4A]"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#C97B4A] py-2.5 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={18} />
        Add entry
      </button>
    </div>
  );
}
