import { useState } from 'react';
import { Plus } from 'lucide-react';
import { EXPENSE_CATEGORIES, PAY_FROM_ACCOUNTS } from '../data';
import { round2 } from '../format';
import { today } from '../time';
import type { Accounts, AccountId, ExpenseCategory, Transaction, TransactionType } from '../types';

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
  const [date, setDate] = useState(today());
  const [category, setCategory] = useState<ExpenseCategory>('Еда');
  const [account, setAccount] = useState<AccountId>('privatPension');
  const [fromAccount, setFromAccount] = useState<AccountId | null>('privatPension');
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
    } else if (type === 'income') {
      onAddTransaction({
        type: 'income',
        amount: value,
        date,
        category: 'Доход',
        account,
        note: note.trim(),
      });
    } else {
      onAddTransaction({
        type: 'expense',
        amount: value,
        date,
        category,
        account,
        note: note.trim(),
      });
    }

    setAmount('');
    setNote('');
    setDate(today());
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
          Доход
        </button>
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            type === 'expense' ? 'bg-white text-[#C9694A] shadow-sm' : 'text-[#8A8478]'
          }`}
        >
          Расход
        </button>
        <button
          type="button"
          onClick={() => setType('transfer')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            type === 'transfer' ? 'bg-white text-[#6E8AA3] shadow-sm' : 'text-[#8A8478]'
          }`}
        >
          Перевод
        </button>
      </div>

      <div className="mt-4 flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-[#8A8478]">Сумма</label>
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
          <label className="mb-1 block text-xs text-[#8A8478]">Дата</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-[#E8E3D9] px-3 py-2 outline-none focus:border-[#C97B4A]"
          />
        </div>
      </div>

      {type === 'expense' && (
        <div className="mt-4">
          <label className="mb-1 block text-xs text-[#8A8478]">Категория</label>
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
      )}

      {(type === 'expense' || type === 'income') && (
        <div className="mt-4">
          <label className="mb-1 block text-xs text-[#8A8478]">
            {type === 'income' ? 'На счёт' : 'Со счёта'}
          </label>
          <AccountChips accounts={accounts} selected={account} onSelect={setAccount} />
        </div>
      )}

      {type === 'transfer' && (
        <>
          <div className="mt-4">
            <label className="mb-1 block text-xs text-[#8A8478]">Откуда</label>
            <AccountChips accounts={accounts} selected={fromAccount} onSelect={setFromAccount} />
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-xs text-[#8A8478]">Куда</label>
            <AccountChips accounts={accounts} selected={toAccount} onSelect={setToAccount} />
          </div>
          {fromAccount && toAccount && fromAccount === toAccount && (
            <p className="mt-2 text-xs text-[#C9694A]">Счета "Откуда" и "Куда" должны отличаться.</p>
          )}
        </>
      )}

      <div className="mt-4">
        <label className="mb-1 block text-xs text-[#8A8478]">Заметка (необязательно)</label>
        <input
          type="text"
          placeholder="Добавить заметку..."
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
        Добавить запись
      </button>
    </div>
  );
}
