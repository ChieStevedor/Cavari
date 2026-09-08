import { useEffect, useRef, useState } from 'react';
import AffirmationsBank from './components/AffirmationsBank';
import DataBackupControls from './components/DataBackupControls';
import Header from './components/Header';
import ModuleCard from './components/ModuleCard';
import ModuleScreen from './components/ModuleScreen';
import MorningPracticeGroup from './components/MorningPracticeGroup';
import { MODULES, MODULES_BY_ID } from './modules';
import { isBackupEmpty, pullBackup, pushBackup } from './backup';
import {
  loadActiveModule,
  loadCompletions,
  loadCustomAffirmations,
  loadDrafts,
  loadNotes,
  normalizeCompletions,
  normalizeDrafts,
  normalizeNotes,
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
  const [hydrated, setHydrated] = useState(false);
  const [restoredNotice, setRestoredNotice] = useState<string | null>(null);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // On first load, if local data looks empty (fresh install, or storage got wiped),
  // try to recover the last known state from the server backup.
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (isBackupEmpty({ completions, notes, customAffirmations })) {
        const backup = await pullBackup();
        if (!cancelled && backup && !isBackupEmpty(backup)) {
          setCompletions(normalizeCompletions(backup.completions));
          setNotes(normalizeNotes(backup.notes));
          setCustomAffirmations(backup.customAffirmations ?? []);
          setRestoredNotice(
            backup.savedAt ? new Date(backup.savedAt).toLocaleString('uk-UA') : 'попередньої сесії',
          );
        }
      }
      if (!cancelled) setHydrated(true);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
    // Only ever run once, against the state loaded at mount time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the server backup in sync, debounced, once initial hydration settled.
  useEffect(() => {
    if (!hydrated) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      void pushBackup({ completions, notes, customAffirmations });
    }, 1500);
    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
  }, [hydrated, completions, notes, customAffirmations]);

  function handleExport() {
    const payload = { completions, notes, drafts, customAffirmations, exportedAt: Date.now() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pidsvidomist-backup-${todayStr()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    let parsed: {
      completions?: Partial<Completions>;
      notes?: Partial<NotesByModule>;
      drafts?: Partial<DraftsByModule>;
      customAffirmations?: string[];
    };
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      window.alert('Не вдалося прочитати файл — перевір, що це саме файл експорту цього застосунку.');
      return;
    }

    if (!window.confirm('Це замінить поточні дані застосунку даними з файлу. Продовжити?')) return;

    setCompletions(normalizeCompletions(parsed.completions));
    setNotes(normalizeNotes(parsed.notes));
    setDrafts(normalizeDrafts(parsed.drafts));
    setCustomAffirmations(Array.isArray(parsed.customAffirmations) ? parsed.customAffirmations : []);
    setRestoredNotice(null);
  }

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
            <DataBackupControls onExport={handleExport} onImport={handleImport} />
            {restoredNotice && (
              <div className="rounded-xl bg-[#C9A24B]/15 px-3 py-2 text-xs text-[#8A6A1F]">
                Дані відновлено з резервної копії ({restoredNotice}).
                <button
                  type="button"
                  onClick={() => setRestoredNotice(null)}
                  className="ml-2 font-semibold underline"
                >
                  Гаразд
                </button>
              </div>
            )}
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
