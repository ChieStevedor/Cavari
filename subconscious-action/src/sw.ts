/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

interface ReminderPushPayload {
  title?: string;
  body?: string;
}

self.addEventListener('push', (event: PushEvent) => {
  let payload: ReminderPushPayload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { body: event.data?.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Підсвідомість у дії', {
      body: payload.body ?? 'Час на ранкову практику: візуалізація + засів думок.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'morning-practice-reminder',
    }),
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      const existing = clientsList.find((client) => 'focus' in client);
      if (existing) return (existing as WindowClient).focus();
      return self.clients.openWindow('/');
    }),
  );
});
