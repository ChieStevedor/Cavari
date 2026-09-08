export type ModuleId =
  | 'visualization'
  | 'seedSowing'
  | 'affirmations'
  | 'intentions'
  | 'limitingBeliefs'
  | 'selfImage'
  | 'intuition'
  | 'gratitude';

export interface ModuleDef {
  id: ModuleId;
  title: string;
  tagline: string;
  instruction: string;
  prompt: string;
  icon: import('lucide-react').LucideIcon;
  /** Suggested practice length in minutes; when set, shows a countdown timer on the module screen. */
  defaultDurationMinutes?: number;
}

export interface NoteEntry {
  date: string;
  text: string;
  createdAt: number;
}

export type Completions = Record<ModuleId, string[]>;
export type NotesByModule = Record<ModuleId, NoteEntry[]>;
export type DraftsByModule = Record<ModuleId, string>;
