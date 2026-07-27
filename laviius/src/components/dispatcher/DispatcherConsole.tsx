"use client";

import { useEffect, useRef } from "react";
import { useDispatcher } from "@/lib/dispatcher/store";
import { ActionFeed } from "@/components/dispatcher/feed/ActionFeed";
import { KpiRow } from "@/components/dispatcher/kpi/KpiRow";
import { ShipmentQueue } from "@/components/dispatcher/queue/ShipmentQueue";
import { ActionFeedSkeleton, KpiRowSkeleton, QueueSkeleton } from "@/components/dispatcher/shared/Skeleton";

export function DispatcherConsole({ initialFocus = "feed" }: { initialFocus?: "feed" | "queue" }) {
  const { status } = useDispatcher();
  const queueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "ready" && initialFocus === "queue") {
      queueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status, initialFocus]);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 p-4 sm:p-6">
      {status === "loading" ? (
        <>
          <KpiRowSkeleton />
          <ActionFeedSkeleton />
          <QueueSkeleton />
        </>
      ) : (
        <>
          <KpiRow />
          <ActionFeed />
          <div ref={queueRef} className={initialFocus === "queue" ? "scroll-mt-4" : undefined}>
            <ShipmentQueue />
          </div>
        </>
      )}
    </div>
  );
}
