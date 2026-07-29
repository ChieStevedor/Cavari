import type { SyncQueueItem } from "@/stores/syncQueueStore";

/**
 * Thin API client. Swap `USE_MOCK` off and point `BASE_URL` at the real
 * Laviius backend to go live — every function below already matches the
 * contract documented in ARCHITECTURE.md § API Endpoints, so screens and
 * stores never need to change.
 */

const USE_MOCK = true;
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.laviius.com/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (USE_MOCK) {
    // Simulate realistic network latency so loading states are exercised.
    await new Promise((r) => setTimeout(r, 250 + Math.random() * 250));
    return {} as T;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

/** POST /shipments/:id/events — replays one queued offline mutation. */
export async function pushShipmentEvent(item: SyncQueueItem): Promise<void> {
  await request(`/shipments/${item.shipmentId}/events`, {
    method: "POST",
    body: JSON.stringify({ type: item.type, payload: item.payload, occurredAt: item.createdAt }),
  });
}

/** POST /photos — uploads a captured photo's binary + returns a remote URL. */
export async function uploadPhoto(localUri: string): Promise<{ remoteUrl: string }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
    return { remoteUrl: localUri };
  }
  const form = new FormData();
  // @ts-expect-error React Native FormData file shape
  form.append("file", { uri: localUri, name: "photo.jpg", type: "image/jpeg" });
  const res = await fetch(`${BASE_URL}/photos`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Photo upload failed");
  return (await res.json()) as { remoteUrl: string };
}

export { request };
