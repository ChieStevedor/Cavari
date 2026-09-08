import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import type { ModuleDef, NoteEntry } from '../types';
import PracticeTimer from './PracticeTimer';
import StreakBadge from './StreakBadge';

interface Props {
  module: ModuleDef;
  doneToday: boolean;
  streak: number;
  draft: string;
  history: NoteEntry[];
  onDraftChange: (text: string) => void;
  onComplete: () => void;
  extra?: ReactNode;
}

export default function ModuleScreen({
  module,
  doneToday,
  streak,
  draft,
  history,
  onDraftChange,
  onComplete,
  extra,
}: Props) {
  const Icon = module.icon;
  const pastEntries = history
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#241C35]/5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#241C35]/5 text-[#5B3A9E]">
          <Icon className="h-6 w-6" strokeWidth={2} />
        </span>
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-[#241C35]">{module.tagline}</span>
          <StreakBadge streak={streak} />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#241C35]/5">
        <h2 className="mb-2 text-sm font-semibold text-[#241C35]/80">Вправа</h2>
        <p className="text-sm leading-relaxed text-[#241C35]/80">{module.instruction}</p>
      </div>

      {module.defaultDurationMinutes && <PracticeTimer defaultMinutes={module.defaultDurationMinutes} />}

      {extra}

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#241C35]/5">
        <label htmlFor="module-note" className="mb-2 block text-sm font-semibold text-[#241C35]/80">
          {module.prompt}
        </label>
        <textarea
          id="module-note"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          rows={5}
          placeholder="Напиши тут свою нотатку чи відповідь…"
          className="w-full resize-none rounded-xl border border-[#241C35]/10 bg-[#F5F1EA] p-3 text-sm text-[#241C35] outline-none focus:border-[#5B3A9E]/50"
        />
        <button
          type="button"
          onClick={onComplete}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors ${
            doneToday
              ? 'bg-[#5B3A9E]/10 text-[#5B3A9E]'
              : 'bg-[#5B3A9E] text-white hover:bg-[#4A2F82]'
          }`}
        >
          <Check className="h-4 w-4" strokeWidth={3} />
          {doneToday ? 'Оновити нотатку' : 'Завершити'}
        </button>
      </div>

      {pastEntries.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#241C35]/5">
          <h2 className="mb-3 text-sm font-semibold text-[#241C35]/80">Останні записи</h2>
          <ul className="flex flex-col gap-3">
            {pastEntries.map((entry) => (
              <li key={entry.createdAt} className="border-l-2 border-[#C9A24B]/60 pl-3">
                <p className="text-xs font-medium text-[#241C35]/50">{entry.date}</p>
                <p className="whitespace-pre-wrap text-sm text-[#241C35]/80">{entry.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
