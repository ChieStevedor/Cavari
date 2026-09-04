import { Flame } from 'lucide-react';

export default function StreakBadge({ streak }: { streak: number }) {
  if (streak <= 0) {
    return <span className="text-xs font-medium text-[#241C35]/40">Немає стріку</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#C9A24B]/15 px-2.5 py-1 text-xs font-semibold text-[#8A6A1F]">
      <Flame className="h-3.5 w-3.5" strokeWidth={2.5} />
      {streak} {dayWord(streak)} поспіль
    </span>
  );
}

function dayWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'дні';
  return 'днів';
}
