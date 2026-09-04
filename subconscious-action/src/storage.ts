import { MODULES } from './modules';
import type { Completions, DraftsByModule, ModuleId, NotesByModule } from './types';

const COMPLETIONS_KEY = 'cavari-subconscious-completions';
const NOTES_KEY = 'cavari-subconscious-notes';
const DRAFTS_KEY = 'cavari-subconscious-drafts';
const CUSTOM_AFFIRMATIONS_KEY = 'cavari-subconscious-custom-affirmations';
const ACTIVE_MODULE_KEY = 'cavari-subconscious-active-module';

function emptyByModule<T>(fill: () => T): Record<ModuleId, T> {
  return Object.fromEntries(MODULES.map((m) => [m.id, fill()])) as Record<ModuleId, T>;
}

export function loadCompletions(): Completions {
  try {
    const raw = localStorage.getItem(COMPLETIONS_KEY);
    if (!raw) return emptyByModule<string[]>(() => []);
    const parsed = JSON.parse(raw) as Partial<Completions>;
    return { ...emptyByModule<string[]>(() => []), ...parsed };
  } catch {
    return emptyByModule<string[]>(() => []);
  }
}

export function saveCompletions(completions: Completions): void {
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions));
}

export function loadNotes(): NotesByModule {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return emptyByModule(() => []);
    const parsed = JSON.parse(raw) as Partial<NotesByModule>;
    return { ...emptyByModule(() => []), ...parsed };
  } catch {
    return emptyByModule(() => []);
  }
}

export function saveNotes(notes: NotesByModule): void {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function loadDrafts(): DraftsByModule {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return emptyByModule(() => '');
    const parsed = JSON.parse(raw) as Partial<DraftsByModule>;
    return { ...emptyByModule(() => ''), ...parsed };
  } catch {
    return emptyByModule(() => '');
  }
}

export function saveDrafts(drafts: DraftsByModule): void {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

export function loadCustomAffirmations(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_AFFIRMATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function saveCustomAffirmations(items: string[]): void {
  localStorage.setItem(CUSTOM_AFFIRMATIONS_KEY, JSON.stringify(items));
}

export function loadActiveModule(): ModuleId | null {
  const raw = localStorage.getItem(ACTIVE_MODULE_KEY);
  if (!raw) return null;
  return MODULES.some((m) => m.id === raw) ? (raw as ModuleId) : null;
}

export function saveActiveModule(id: ModuleId | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_MODULE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_MODULE_KEY);
  }
}
