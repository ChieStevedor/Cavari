import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import webpush from 'web-push';

const redis = Redis.fromEnv();

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? 'mailto:noreply@example.com',
  process.env.VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? '',
);

const REMINDER_PAYLOAD = JSON.stringify({
  title: 'Час на ранкову практику 🌅',
  body: 'Візуалізація + Засів думок — 5–10 хвилин, поки день ще не почався.',
});

function isGoneError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    (error.statusCode === 404 || error.statusCode === 410)
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const subscriptions = await redis.hgetall<Record<string, webpush.PushSubscription>>(
    'push-subscriptions',
  );

  if (!subscriptions) {
    res.status(200).json({ sent: 0, removed: 0 });
    return;
  }

  let sent = 0;
  const removed: string[] = [];

  await Promise.all(
    Object.entries(subscriptions).map(async ([endpoint, subscription]) => {
      try {
        await webpush.sendNotification(subscription, REMINDER_PAYLOAD);
        sent++;
      } catch (error) {
        if (isGoneError(error)) removed.push(endpoint);
      }
    }),
  );

  if (removed.length > 0) {
    await redis.hdel('push-subscriptions', ...removed);
  }

  res.status(200).json({ sent, removed: removed.length });
}
