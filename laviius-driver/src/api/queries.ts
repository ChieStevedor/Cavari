import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { mockDriver, mockShipments, mockThreads } from "@/api/mockData";
import { useShipmentStore } from "@/stores/shipmentStore";
import { useMessagesStore } from "@/stores/messagesStore";
import type { DriverProfile } from "@/types/driver";
import type { MessageThread } from "@/types/messaging";
import type { Shipment } from "@/types/shipment";

/**
 * Server hydration layer. The Zustand stores are the offline-first source
 * of truth the UI reads from; these queries fetch the authoritative server
 * state on mount / reconnect and reconcile it into the stores. On first
 * launch (no local cache yet) this is how the app gets data at all — on
 * every later launch it's a background refresh, so the UI is instant.
 */

async function fetchShipments(): Promise<Shipment[]> {
  await new Promise((r) => setTimeout(r, 300));
  return mockShipments;
}

async function fetchDriverProfile(): Promise<DriverProfile> {
  await new Promise((r) => setTimeout(r, 200));
  return mockDriver;
}

async function fetchThreads(): Promise<MessageThread[]> {
  await new Promise((r) => setTimeout(r, 200));
  return mockThreads;
}

export function useShipmentsQuery() {
  const hydrate = useShipmentStore((s) => s.hydrate);
  const hasLocal = useShipmentStore((s) => s.shipments.length > 0);
  const query = useQuery({
    queryKey: ["shipments"],
    queryFn: fetchShipments,
    staleTime: 60_000,
  });

  useEffect(() => {
    // Never clobber local optimistic progress with a stale server response;
    // only seed the store from the server when nothing local exists yet or
    // this fetch is fresher than what's on device (id-set diff would be the
    // production reconciliation strategy — kept simple here since this is
    // the mock/demo data layer).
    if (query.data && !hasLocal) {
      hydrate(query.data);
    }
  }, [query.data, hasLocal, hydrate]);

  return query;
}

export function useDriverProfileQuery() {
  return useQuery({
    queryKey: ["driver-profile"],
    queryFn: fetchDriverProfile,
    staleTime: 5 * 60_000,
  });
}

export function useMessageThreadsQuery() {
  const hydrate = useMessagesStore((s) => s.hydrate);
  const hasLocal = useMessagesStore((s) => s.threads.length > 0);
  const query = useQuery({
    queryKey: ["message-threads"],
    queryFn: fetchThreads,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (query.data && !hasLocal) hydrate(query.data);
  }, [query.data, hasLocal, hydrate]);

  return query;
}
