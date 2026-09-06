import { Clock } from 'lucide-react';
import type { ModuleDef } from '../types';
import ModuleCard from './ModuleCard';
import ReminderToggle from './ReminderToggle';

interface Props {
  modules: ModuleDef[];
  isDoneToday: (moduleId: ModuleDef['id']) => boolean;
  streakFor: (moduleId: ModuleDef['id']) => number;
  onOpen: (moduleId: ModuleDef['id']) => void;
  onToggleToday: (moduleId: ModuleDef['id']) => void;
}

export default function MorningPracticeGroup({
  modules,
  isDoneToday,
  streakFor,
  onOpen,
  onToggleToday,
}: Props) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#5B3A9E]/30 p-3">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="flex items-center gap-1 rounded-full bg-[#5B3A9E]/10 px-2.5 py-1 text-xs font-semibold text-[#5B3A9E]">
          <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
          6:30
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#241C35]/50">
          Ранкова практика — робити одразу одне за одним
        </span>
        <ReminderToggle />
      </div>
      <div className="flex flex-col gap-3">
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            doneToday={isDoneToday(module.id)}
            streak={streakFor(module.id)}
            onOpen={() => onOpen(module.id)}
            onToggleToday={() => onToggleToday(module.id)}
          />
        ))}
      </div>
    </div>
  );
}
