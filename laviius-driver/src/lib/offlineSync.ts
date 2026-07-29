import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";

import { useSyncQueueStore } from "@/stores/syncQueueStore";

/**
 * Background sync task. Complements the reconnect-triggered flush in
 * syncQueueStore: even if the app is backgrounded when connectivity
 * returns (e.g. driver walks out of a dead-zone warehouse with the phone
 * in a pocket), the OS wakes this periodically to drain the queue so
 * dispatch never sees stale state for longer than necessary.
 */
const TASK_NAME = "laviius-driver-background-sync";

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const before = useSyncQueueStore.getState().queue.length;
    await useSyncQueueStore.getState().flush();
    const after = useSyncQueueStore.getState().queue.length;
    return after < before ? BackgroundFetch.BackgroundFetchResult.NewData : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync() {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
  if (isRegistered) return;
  await BackgroundFetch.registerTaskAsync(TASK_NAME, {
    minimumInterval: 15 * 60, // OS enforces a floor well above this; best-effort
    stopOnTerminate: false,
    startOnBoot: true,
  });
}
