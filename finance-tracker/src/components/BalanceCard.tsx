import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { formatCurrency } from '../format';

interface BalanceCardProps {
  totalIncome: number;
  totalExpense: number;
}

export default function BalanceCard({ totalIncome, totalExpense }: BalanceCardProps) {
  const balance = totalIncome - totalExpense;

  return (
    <div className="rounded-2xl bg-[#2B2620] p-5 text-white">
      <div className="flex items-center gap-2 text-sm text-white/60">
        <Wallet size={16} />
        <span>Total balance</span>
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{formatCurrency(balance)}</div>

      <div className="mt-4 flex gap-3">
        <div className="flex-1 rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-1.5 text-xs text-[#7FBF8F]">
            <TrendingUp size={14} />
            <span>Income</span>
          </div>
          <div className="mt-1 text-lg font-medium text-[#7FBF8F]">
            {formatCurrency(totalIncome)}
          </div>
        </div>
        <div className="flex-1 rounded-xl bg-white/5 p-3">
          <div className="flex items-center gap-1.5 text-xs text-[#E08D6D]">
            <TrendingDown size={14} />
            <span>Expenses</span>
          </div>
          <div className="mt-1 text-lg font-medium text-[#E08D6D]">
            {formatCurrency(totalExpense)}
          </div>
        </div>
      </div>
    </div>
  );
}
