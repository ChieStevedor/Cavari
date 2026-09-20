import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { toCsv } from '../src/csv';
import type { BackupPayload } from '../src/backupTypes';

const redis = Redis.fromEnv();
const BACKUP_KEY = 'journal-backup';

const MODULE_TITLES: Record<string, string> = {
  visualization: 'Візуалізація',
  seedSowing: 'Засів думок',
  affirmations: 'Афірмації',
  intentions: 'Наміри',
  limitingBeliefs: 'Обмежуючі переконання',
  selfImage: 'Самообраз',
  intuition: 'Інтуїція та сновидіння',
  gratitude: 'Вдячність',
};

function buildCsv(backup: BackupPayload): string {
  const rows: string[][] = [['Дата', 'Модуль', 'Запис']];
  for (const [moduleId, entries] of Object.entries(backup.notes)) {
    const title = MODULE_TITLES[moduleId] ?? moduleId;
    const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt);
    for (const entry of sorted) {
      rows.push([entry.date, title, entry.text]);
    }
  }
  return toCsv(rows);
}

function toBase64(text: string): string {
  return Buffer.from(text, 'utf8').toString('base64');
}

function isAuthorized(req: VercelRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  if (req.headers.authorization === `Bearer ${secret}`) return true;
  return req.query.secret === secret;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const to = process.env.BACKUP_EMAIL_TO;
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!to || !resendApiKey) {
    res.status(500).json({
      sent: false,
      error: 'Email backup is not configured: set BACKUP_EMAIL_TO and RESEND_API_KEY.',
    });
    return;
  }

  const backup = await redis.get<BackupPayload>(BACKUP_KEY);
  if (!backup) {
    res.status(200).json({ sent: false, reason: 'No backup found yet' });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const csv = buildCsv(backup);
  const json = JSON.stringify(backup, null, 2);

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.BACKUP_EMAIL_FROM ?? 'onboarding@resend.dev',
      to,
      subject: `Тижневий бекап «Підсвідомість у дії» — ${today}`,
      html: '<p>Автоматичний тижневий бекап твоїх записів.</p><p>У вкладенні: CSV (відкривається в Excel / Google Таблицях) і JSON (для відновлення через кнопку «Імпорт» у застосунку).</p>',
      attachments: [
        { filename: `pidsvidomist-zapysy-${today}.csv`, content: toBase64(csv) },
        { filename: `pidsvidomist-backup-${today}.json`, content: toBase64(json) },
      ],
    }),
  });

  if (!emailRes.ok) {
    const errorText = await emailRes.text();
    res.status(502).json({ sent: false, error: errorText });
    return;
  }

  res.status(200).json({ sent: true });
}
