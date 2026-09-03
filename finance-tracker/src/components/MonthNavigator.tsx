import { ChevronLeft, ChevronRight } from 'lucide-react';
import { shiftYearMonth } from '../time';

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

function parseYearMonth(yearMonth: string): [number, number] {
  const [year, month] = yearMonth.split('-').map(Number);
  return [year, month];
}

function buildYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

interface MonthNavigatorProps {
  minYearMonth: string;
  maxYearMonth: string;
  selectedMonth: string;
  onSelectMonth: (yearMonth: string) => void;
}

export default function MonthNavigator({
  minYearMonth,
  maxYearMonth,
  selectedMonth,
  onSelectMonth,
}: MonthNavigatorProps) {
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
    onSelectMonth(buildYearMonth(newYear, clampedMonth));
  }

  function handleMonthChange(newMonth: number) {
    onSelectMonth(buildYearMonth(selectedYear, newMonth));
  }

  const selectClass =
    'rounded-lg border border-[#E8E3D9] bg-white px-2 py-1 text-sm outline-none focus:border-[#C97B4A]';

  return (
    <div className="flex items-center justify-between gap-1">
      <button
        type="button"
        aria-label="Previous month"
        disabled={!canGoPrev}
        onClick={() => onSelectMonth(shiftYearMonth(selectedMonth, -1))}
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
        onClick={() => onSelectMonth(shiftYearMonth(selectedMonth, 1))}
        className="shrink-0 rounded-lg p-1.5 text-[#8A8478] transition hover:bg-[#F5F2EC] disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
