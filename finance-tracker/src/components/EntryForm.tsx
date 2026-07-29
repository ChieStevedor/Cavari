import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CATEGORY_COLORS, EXPENSE_CATEGORIES, PAY_FROM_ACCOUNTS } from '../data';
import { round2 } from '../format';
import { vancouverToday } from '../time';
import type { Accounts, AccountId, Category, ExpenseCategory, Transaction, TransactionType } from '../types';

interface EntryFormProps {
  accounts: Accounts;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

function AccountChips({
  accounts,
  selected,
  onSelect,
}: {
  accounts: Accounts;
  selected: AccountId | null;
  onSelect: (id: AccountId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PAY_FROM_ACCOUNTS.map((id) => {
        const acc = accounts[id];
        const isSelected = selected === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className="rounded-full border px-3 py-1.5 text-xs font-medium transition"
            style={
              isSelected
                ? { backgroundColor: acc.color, borderColor: acc.color, color: '#fff' }
                : { borderColor: '#E8E3D9', color: acc.color }
            }
          >
            {acc.label}
          </button>
        );
      })}
    </div>
  );
}

export default function EntryForm({ accounts, onAddTransaction }: EntryFormProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(vancouverToday());
  const [category, setCategory] = useState<ExpenseCategory>('Gas');
  const [account, setAccount] = useState<AccountId>('uber');
  const [fromAccount, setFromAccount] = useState<AccountId | null>('uber');
  const [toAccount, setToAccount] = useState<AccountId | null>(null);
  const [note, setNote] = useState('');

  const parsedAmount = parseFloat(amount);
  const canSubmit =
    parsedAmount > 0 &&
    !!date &&
    (type !== 'transfer' || (!!fromAccount && !!toAccount && fromAccount !== toAccount));

  function handleSubmit() {
    if (!canSubmit) return;
    const value = round2(parsedAmount);

    if (type === 'transfer') {
      onAddTransaction({
        type: 'transfer',
        amount: value,
        date,
        note: note.trim(),
        fromAccount: fromAccount!,
        toAccount: toAccount!,
      });
    } else {
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
    }

    setAmount('');
    setNote('');
    setDate(vancouverToday());
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
        <button
          type="button"
          onClick={() => setType('transfer')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            type === 'transfer' ? 'bg-white text-[#6E8AA3] shadow-sm' : 'text-[#8A8478]'
          }`}
        >
          Transfer
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
            <AccountChips accounts={accounts} selected={account} onSelect={setAccount} />
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

      {type === 'transfer' && (
        <>
          <div className="mt-4">
            <label className="mb-1 block text-xs text-[#8A8478]">From</label>
            <AccountChips accounts={accounts} selected={fromAccount} onSelect={setFromAccount} />
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-xs text-[#8A8478]">To</label>
            <AccountChips accounts={accounts} selected={toAccount} onSelect={setToAccount} />
          </div>
          {fromAccount && toAccount && fromAccount === toAccount && (
            <p className="mt-2 text-xs text-[#C9694A]">From and To must be different accounts.</p>
          )}
        </>
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
