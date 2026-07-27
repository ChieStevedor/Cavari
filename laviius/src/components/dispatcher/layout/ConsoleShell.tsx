"use client";

import { useRouter } from "next/navigation";
import { useDispatcher } from "@/lib/dispatcher/store";
import { useKeyboardShortcuts } from "@/lib/dispatcher/useKeyboardShortcuts";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { ShipmentDrawer } from "@/components/dispatcher/drawer/ShipmentDrawer";
import { GlobalSearch } from "@/components/dispatcher/search/GlobalSearch";
import { ToastStack } from "@/components/dispatcher/shared/ToastStack";

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { shipments, selectedShipmentId, openShipment, setDrawerTab, closeDrawer, searchOpen, closeSearch, openSearch, pushToast } =
    useDispatcher();

  useKeyboardShortcuts({
    onSearch: openSearch,
    onNewShipment: () => router.push("/book"),
    onAssignCarrier: () => {
      if (selectedShipmentId) {
        setDrawerTab("carrier");
        return;
      }
      const next = shipments.find((s) => s.status === "waiting_assignment");
      if (next) {
        openShipment(next.id, "carrier");
      } else {
        pushToast("No shipments are currently waiting on carrier assignment.", "info");
      }
    },
    onOpenMap: () => router.push("/dispatcher/live-map"),
    onOpenTimeline: () => {
      if (selectedShipmentId) setDrawerTab("timeline");
    },
    onEscape: () => {
      if (searchOpen) closeSearch();
      else closeDrawer();
    },
  });

  return (
    <div className="flex h-dvh flex-col bg-slate-50">
      <TopNav />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
      <ShipmentDrawer />
      <GlobalSearch />
      <ToastStack />
    </div>
  );
}
