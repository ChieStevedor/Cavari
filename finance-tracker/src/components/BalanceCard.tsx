import { useState } from 'react';
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency, round2 } from '../format';
import { monthRange } from '../time';
import MonthNavigator from './MonthNavigator';
import type { Transaction } from '../types';

interface BalanceCardProps {
  currentBalance: number;
  transactions: Transaction[];
  balanceSnapshots: Record<string, number>;
}

export default function BalanceCard({
  currentBalance,
  transactions,
  balanceSnapshots,
}: BalanceCardProps) {
  const { min: minYearMonth, max: maxYearMonth } = monthRange(transactions.map((t) => t.date));
  const [selectedMonth, setSelectedMonth] = useState(maxYearMonth);
  const isCurrentMonth = selectedMonth === maxYearMonth;

  const monthIncome = round2(
    transactions
      .filter((t) => t.type === 'income' && t.date.slice(0, 7) === selectedMonth)
      .reduce((sum, t) => round2(sum + t.amount), 0),
  );
  const monthExpense = round2(
    transactions
      .filter((t) => t.type === 'expense' && t.date.slice(0, 7) === selectedMonth)
      .reduce((sum, t) => round2(sum + t.amount), 0),
  );

  const displayedBalance = isCurrentMonth ? currentBalance : balanceSnapshots[selectedMonth] ?? null;

  return (
    <div className="rounded-2xl bg-[#2B2620] p-5 text-white">
      <div className="mb-3 rounded-xl bg-white/10 p-1">
        <MonthNavigator
          minYearMonth={minYearMonth}
          maxYearMonth={maxYearMonth}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
        />
      </div>

      <div className="flex items-center gap-2 text-sm text-white/60">
        <Wallet size={16} />
        <span>Total balance</span>
      </div>
      {displayedBalance === null ? (
        <>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-white/40">—</div>
          <div className="mt-1 text-xs text-white/40">No snapshot recorded for this month</div>
        </>
      ) : (
        <div className="mt-2 text-3xl font-semibold tracking-tight">
          {formatCurrency(displayedBalance)}
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <div className="flex-1 rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-1.5 text-xs text-[#7FBF8F]">
            <TrendingUp size={14} />
            <span>Income</span>
          </div>
          <div className="mt-1 text-lg font-medium text-[#7FBF8F]">
            {formatCurrency(monthIncome)}
          </div>
        </div>
        <div className="flex-1 rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-1.5 text-xs text-[#E08D6D]">
            <TrendingDown size={14} />
            <span>Expenses</span>
          </div>
          <div className="mt-1 text-lg font-medium text-[#E08D6D]">
            {formatCurrency(monthExpense)}
          </div>
        </div>
      </div>
    </div>
  );
}
