import { Check } from 'lucide-react';
import type { ModuleDef } from '../types';
import StreakBadge from './StreakBadge';

interface Props {
  module: ModuleDef;
  doneToday: boolean;
  streak: number;
  onOpen: () => void;
  onToggleToday: () => void;
}

export default function ModuleCard({ module, doneToday, streak, onOpen, onToggleToday }: Props) {
  const Icon = module.icon;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#241C35]/5">
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 items-center gap-3 text-left"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#241C35]/5 text-[#5B3A9E]">
          <Icon className="h-6 w-6" strokeWidth={2} />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="font-semibold text-[#241C35]">{module.title}</span>
          <span className="truncate text-sm text-[#241C35]/60">{module.tagline}</span>
          <StreakBadge streak={streak} />
        </span>
      </button>

      <button
        type="button"
        onClick={onToggleToday}
        aria-pressed={doneToday}
        aria-label={doneToday ? 'Скасувати виконання сьогодні' : 'Позначити виконаним сьогодні'}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          doneToday
            ? 'border-[#5B3A9E] bg-[#5B3A9E] text-white'
            : 'border-[#241C35]/20 text-transparent hover:border-[#5B3A9E]/50'
        }`}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </button>
    </div>
  );
}
