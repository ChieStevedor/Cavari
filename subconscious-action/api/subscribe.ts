import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const subscription = req.body;
  if (!subscription?.endpoint) {
    res.status(400).json({ error: 'Invalid subscription' });
    return;
  }

  await redis.hset('push-subscriptions', { [subscription.endpoint]: subscription });
  res.status(200).json({ ok: true });
}
