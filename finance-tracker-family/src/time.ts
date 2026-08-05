function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Today's date in the device's local timezone, as "YYYY-MM-DD". */
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function currentYearMonth(): string {
  return today().slice(0, 7);
}

/** Shifts a "YYYY-MM" string by `delta` months (negative to go back). */
export function shiftYearMonth(yearMonth: string, delta: number): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}`;
}

const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Formats a "YYYY-MM" string as e.g. "август 2026". */
export function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  return MONTH_YEAR_FORMATTER.format(new Date(Date.UTC(year, month - 1, 1)));
}
