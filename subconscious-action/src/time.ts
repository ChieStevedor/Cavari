/** Local calendar date as "YYYY-MM-DD" (device timezone, not UTC). */
export function todayStr(): string {
  return dateToStr(new Date());
}

function dateToStr(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Shifts a "YYYY-MM-DD" string by `delta` days (negative to go back). */
export function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + delta);
  return dateToStr(date);
}

export function isDoneToday(dates: string[]): boolean {
  return dates.includes(todayStr());
}

/**
 * Consecutive-day streak ending today (or yesterday, if today isn't done
 * yet but the streak is still "alive"). Any gap before that resets to 0.
 */
export function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  const today = todayStr();
  let cursor = set.has(today) ? today : addDays(today, -1);
  if (!set.has(cursor)) return 0;

  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
