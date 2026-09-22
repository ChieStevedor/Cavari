import type { Completions, NotesByModule } from './types';

export interface BackupPayload {
  completions: Completions;
  notes: NotesByModule;
  customAffirmations: string[];
  savedAt?: number;
}
