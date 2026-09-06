import { useEffect, useState } from 'react';
import AffirmationsBank from './components/AffirmationsBank';
import Header from './components/Header';
import ModuleCard from './components/ModuleCard';
import ModuleScreen from './components/ModuleScreen';
import MorningPracticeGroup from './components/MorningPracticeGroup';
import { MODULES, MODULES_BY_ID } from './modules';
import {
  loadActiveModule,
  loadCompletions,
  loadCustomAffirmations,
  loadDrafts,
  loadNotes,
  saveActiveModule,
  saveCompletions,
  saveCustomAffirmations,
  saveDrafts,
  saveNotes,
} from './storage';
import { computeStreak, isDoneToday, todayStr } from './time';
import type { Completions, DraftsByModule, ModuleId, NotesByModule } from './types';

function App() {
  const [completions, setCompletions] = useState<Completions>(() => loadCompletions());
  const [notes, setNotes] = useState<NotesByModule>(() => loadNotes());
  const [drafts, setDrafts] = useState<DraftsByModule>(() => loadDrafts());
  const [customAffirmations, setCustomAffirmations] = useState<string[]>(() =>
    loadCustomAffirmations(),
  );
  const [activeModuleId, setActiveModuleId] = useState<ModuleId | null>(() => loadActiveModule());

  useEffect(() => {
    saveCompletions(completions);
  }, [completions]);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  useEffect(() => {
    saveDrafts(drafts);
  }, [drafts]);

  useEffect(() => {
    saveCustomAffirmations(customAffirmations);
  }, [customAffirmations]);

  useEffect(() => {
    saveActiveModule(activeModuleId);
  }, [activeModuleId]);

  function toggleToday(moduleId: ModuleId) {
    const today = todayStr();
    setCompletions((prev) => {
      const dates = prev[moduleId] ?? [];
      const already = dates.includes(today);
      return {
        ...prev,
        [moduleId]: already ? dates.filter((d) => d !== today) : [...dates, today],
      };
    });
  }

  function handleDraftChange(moduleId: ModuleId, text: string) {
    setDrafts((prev) => ({ ...prev, [moduleId]: text }));
  }

  function handleComplete(moduleId: ModuleId) {
    const today = todayStr();
    const text = drafts[moduleId]?.trim() ?? '';

    if (text) {
      setNotes((prev) => {
        const existing = prev[moduleId] ?? [];
        const withoutToday = existing.filter((entry) => entry.date !== today);
        return {
          ...prev,
          [moduleId]: [...withoutToday, { date: today, text, createdAt: Date.now() }],
        };
      });
    }

    setCompletions((prev) => {
      const dates = prev[moduleId] ?? [];
      if (dates.includes(today)) return prev;
      return { ...prev, [moduleId]: [...dates, today] };
    });
  }

  function handlePickAffirmation(text: string) {
    setDrafts((prev) => {
      const current = prev.affirmations ?? '';
      const next = current ? `${current}\n${text}` : text;
      return { ...prev, affirmations: next };
    });
  }

  function handleAddCustomAffirmation(text: string) {
    setCustomAffirmations((prev) => (prev.includes(text) ? prev : [...prev, text]));
  }

  function handleDeleteCustomAffirmation(text: string) {
    setCustomAffirmations((prev) => prev.filter((item) => item !== text));
  }

  const doneCount = MODULES.filter((m) => isDoneToday(completions[m.id] ?? [])).length;
  const morningModules = MODULES.filter((m) => m.id === 'visualization' || m.id === 'seedSowing');
  const restModules = MODULES.filter((m) => m.id !== 'visualization' && m.id !== 'seedSowing');

  return (
    <div className="min-h-screen bg-[#F5F1EA]">
      <div className="mx-auto flex max-w-[480px] flex-col gap-5 px-4 py-6">
        {activeModuleId === null ? (
          <>
            <Header
              title="Підсвідомість у дії"
              subtitle={`Виконано сьогодні: ${doneCount} з ${MODULES.length}`}
            />
            <div className="flex flex-col gap-3">
              <MorningPracticeGroup
                modules={morningModules}
                isDoneToday={(id) => isDoneToday(completions[id] ?? [])}
                streakFor={(id) => computeStreak(completions[id] ?? [])}
                onOpen={setActiveModuleId}
                onToggleToday={toggleToday}
              />
              {restModules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  doneToday={isDoneToday(completions[module.id] ?? [])}
                  streak={computeStreak(completions[module.id] ?? [])}
                  onOpen={() => setActiveModuleId(module.id)}
                  onToggleToday={() => toggleToday(module.id)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <Header title={MODULES_BY_ID[activeModuleId].title} onBack={() => setActiveModuleId(null)} />
            <ModuleScreen
              module={MODULES_BY_ID[activeModuleId]}
              doneToday={isDoneToday(completions[activeModuleId] ?? [])}
              streak={computeStreak(completions[activeModuleId] ?? [])}
              draft={drafts[activeModuleId] ?? ''}
              history={notes[activeModuleId] ?? []}
              onDraftChange={(text) => handleDraftChange(activeModuleId, text)}
              onComplete={() => handleComplete(activeModuleId)}
              extra={
                activeModuleId === 'affirmations' ? (
                  <AffirmationsBank
                    customAffirmations={customAffirmations}
                    onPick={handlePickAffirmation}
                    onAddCustom={handleAddCustomAffirmation}
                    onDeleteCustom={handleDeleteCustomAffirmation}
                  />
                ) : undefined
              }
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
