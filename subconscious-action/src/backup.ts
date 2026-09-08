import type { Completions, NotesByModule } from './types';

export interface BackupPayload {
  completions: Completions;
  notes: NotesByModule;
  customAffirmations: string[];
  savedAt?: number;
}

const BACKUP_SECRET = import.meta.env.VITE_BACKUP_SECRET as string | undefined;

function authHeaders(): HeadersInit {
  return BACKUP_SECRET ? { 'x-backup-secret': BACKUP_SECRET } : {};
}

export function isBackupEmpty(payload: BackupPayload): boolean {
  const hasCompletions = Object.values(payload.completions).some((dates) => dates.length > 0);
  const hasNotes = Object.values(payload.notes).some((entries) => entries.length > 0);
  return !hasCompletions && !hasNotes && payload.customAffirmations.length === 0;
}

export async function pushBackup(payload: BackupPayload): Promise<void> {
  try {
    await fetch('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    });
  } catch {
    // Best effort — localStorage stays the source of truth either way.
  }
}

export async function pullBackup(): Promise<BackupPayload | null> {
  try {
    const res = await fetch('/api/backup', { headers: authHeaders() });
    if (!res.ok) return null;
    const data = (await res.json()) as { backup: BackupPayload | null };
    return data.backup;
  } catch {
    return null;
  }
}
