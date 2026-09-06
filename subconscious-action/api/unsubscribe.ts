import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const endpoint = req.body?.endpoint;
  if (!endpoint) {
    res.status(400).json({ error: 'Missing endpoint' });
    return;
  }

  await redis.hdel('push-subscriptions', endpoint);
  res.status(200).json({ ok: true });
}
