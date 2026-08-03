import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { CATEGORY_COLORS } from '../data';
import { formatCurrency, round2 } from '../format';
import { shiftYearMonth, vancouverYearMonth } from '../time';
import NumberField from './NumberField';
import type { Transaction } from '../types';

interface MonthlyOverviewProps {
  transactions: Transaction[];
  incomePlanByMonth: Record<string, number>;
  onUpdateIncomePlan: (yearMonth: string, value: number) => void;
}

const INCOME_COLOR = CATEGORY_COLORS['Uber Eats income'];
const INCOME_KEY = '__income__';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function sortNewestFirst(a: Transaction, b: Transaction) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return b.createdAt - a.createdAt;
}

function parseYearMonth(yearMonth: string): [number, number] {
  const [year, month] = yearMonth.split('-').map(Number);
  return [year, month];
}

function buildYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export default function MonthlyOverview({
  transactions,
  incomePlanByMonth,
  onUpdateIncomePlan,
}: MonthlyOverviewProps) {
  const currentYearMonth = vancouverYearMonth();
  const monthsWithData = transactions.map((t) => t.date.slice(0, 7));
  const minYearMonth =
    monthsWithData.length > 0 ? monthsWithData.reduce((a, b) => (a < b ? a : b)) : currentYearMonth;
  const maxYearMonth = currentYearMonth;

  const [selectedMonth, setSelectedMonth] = useState(maxYearMonth);
  const [expanded, setExpanded] = useState<string | null>(null);

  const canGoPrev = selectedMonth > minYearMonth;
  const canGoNext = selectedMonth < maxYearMonth;

  const [selectedYear, selectedMonthNum] = parseYearMonth(selectedMonth);
  const [minYear, minMonthNum] = parseYearMonth(minYearMonth);
  const [maxYear, maxMonthNum] = parseYearMonth(maxYearMonth);

  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);

  const monthLoBound = selectedYear === minYear ? minMonthNum : 1;
  const monthHiBound = selectedYear === maxYear ? maxMonthNum : 12;
  const monthOptions: number[] = [];
  for (let m = monthLoBound; m <= monthHiBound; m++) monthOptions.push(m);

  function handleYearChange(newYear: number) {
    const lo = newYear === minYear ? minMonthNum : 1;
    const hi = newYear === maxYear ? maxMonthNum : 12;
    const clampedMonth = Math.min(hi, Math.max(lo, selectedMonthNum));
    setSelectedMonth(buildYearMonth(newYear, clampedMonth));
  }

  function handleMonthChange(newMonth: number) {
    setSelectedMonth(buildYearMonth(selectedYear, newMonth));
  }

  const incomePlanValue = incomePlanByMonth[selectedMonth] ?? null;
  const incomePlan = incomePlanValue ?? 0;

  const incomeItems = transactions
    .filter((t) => t.type === 'income' && t.date.slice(0, 7) === selectedMonth)
    .sort(sortNewestFirst);
  const incomeTotal = round2(incomeItems.reduce((sum, t) => round2(sum + t.amount), 0));
  const planProgress = incomePlan > 0 ? round2((incomeTotal / incomePlan) * 100) : 0;
  const isIncomeExpanded = expanded === INCOME_KEY;

  const expenseTotals = new Map<string, number>();
  const expenseItemsByCategory = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.type !== 'expense' || !t.category || t.date.slice(0, 7) !== selectedMonth) continue;
    expenseTotals.set(t.category, round2((expenseTotals.get(t.category) ?? 0) + t.amount));
    const list = expenseItemsByCategory.get(t.category) ?? [];
    list.push(t);
    expenseItemsByCategory.set(t.category, list);
  }
  const expenseRows = Array.from(expenseTotals.entries()).sort((a, b) => b[1] - a[1]);
  const maxExpenseTotal = expenseRows.length > 0 ? expenseRows[0][1] : 0;

  const selectClass =
    'rounded-lg border border-[#E8E3D9] bg-white px-2 py-1 text-sm outline-none focus:border-[#C97B4A]';

  return (
    <div className="rounded-2xl border border-[#E8E3D9] bg-white p-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#8A8478]">
        Monthly overview
      </h2>

      <div className="mb-4 flex items-center justify-between gap-1">
        <button
          type="button"
          aria-label="Previous month"
          disabled={!canGoPrev}
          onClick={() => setSelectedMonth((m) => shiftYearMonth(m, -1))}
          className="shrink-0 rounded-lg p-1.5 text-[#8A8478] transition hover:bg-[#F5F2EC] disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
          <select
            aria-label="Month"
            value={selectedMonthNum}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            className={selectClass}
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {MONTH_NAMES[m - 1]}
              </option>
            ))}
          </select>
          <select
            aria-label="Year"
            value={selectedYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className={selectClass}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          aria-label="Next month"
          disabled={!canGoNext}
          onClick={() => setSelectedMonth((m) => shiftYearMonth(m, 1))}
          className="shrink-0 rounded-lg p-1.5 text-[#8A8478] transition hover:bg-[#F5F2EC] disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8A8478]">Income</h3>
      <button
        type="button"
        onClick={() => setExpanded(isIncomeExpanded ? null : INCOME_KEY)}
        className="block w-full text-left"
      >
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 font-medium">
            Uber Eats income
            {isIncomeExpanded ? (
              <ChevronUp size={14} className="text-[#8A8478]" />
            ) : (
              <ChevronDown size={14} className="text-[#8A8478]" />
            )}
          </span>
          <span className="text-[#8A8478]">{formatCurrency(incomeTotal)}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#F0ECE3]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, Math.max(0, planProgress))}%`,
              backgroundColor: INCOME_COLOR,
            }}
          />
        </div>
      </button>

      {isIncomeExpanded && (
        <div className="mt-2 flex flex-col gap-1.5 border-l-2 pl-3" style={{ borderColor: INCOME_COLOR }}>
          {incomeItems.length === 0 ? (
            <p className="text-xs text-[#8A8478]">No income this month.</p>
          ) : (
            incomeItems.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-xs">
                <span className="text-[#8A8478]">
                  {t.date}
                  {t.note ? ` · ${t.note}` : ''}
                </span>
                <span className="shrink-0 font-medium" style={{ color: INCOME_COLOR }}>
                  {formatCurrency(t.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-1">
        <NumberField
          key={selectedMonth}
          label="Monthly plan"
          value={incomePlanValue}
          onChange={(value) => onUpdateIncomePlan(selectedMonth, value)}
          color={INCOME_COLOR}
        />
        <div
          className={`text-xs ${planProgress >= 100 ? 'font-bold' : ''}`}
          style={{ color: INCOME_COLOR }}
        >
          {incomePlan > 0 ? `${planProgress.toFixed(0)}% of plan` : 'Set a plan to track progress'}
        </div>
      </div>

      <div className="my-4 border-t border-[#E8E3D9]" />

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8A8478]">
        Expenses by category
      </h3>
      {expenseRows.length === 0 ? (
        <p className="text-xs text-[#8A8478]">No expenses this month.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {expenseRows.map(([category, total]) => {
            const color = CATEGORY_COLORS[category] ?? '#8A8478';
            const width = maxExpenseTotal > 0 ? (total / maxExpenseTotal) * 100 : 0;
            const isExpanded = expanded === category;
            const items = [...(expenseItemsByCategory.get(category) ?? [])].sort(sortNewestFirst);

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
                  <div className="mt-2 flex flex-col gap-1.5 border-l-2 pl-3" style={{ borderColor: color }}>
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
      )}
    </div>
  );
}
