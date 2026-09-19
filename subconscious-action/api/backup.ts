import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const BACKUP_KEY = 'journal-backup';

function isAuthorized(req: VercelRequest): boolean {
  const secret = process.env.BACKUP_SECRET;
  if (!secret) return true;
  return req.headers['x-backup-secret'] === secret;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method === 'GET') {
    const backup = await redis.get(BACKUP_KEY);
    res.status(200).json({ backup: backup ?? null });
    return;
  }

  if (req.method === 'POST') {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }
    await redis.set(BACKUP_KEY, { ...payload, savedAt: Date.now() });
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
