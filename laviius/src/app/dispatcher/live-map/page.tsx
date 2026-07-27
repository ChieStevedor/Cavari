"use client";

import { useDispatcher } from "@/lib/dispatcher/store";
import { LiveMap } from "@/components/dispatcher/map/LiveMap";
import { Skeleton } from "@/components/dispatcher/shared/Skeleton";

export default function LiveMapPage() {
  const { status } = useDispatcher();

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
      <h1 className="mb-4 text-lg font-semibold text-navy">Live Map</h1>
      {status === "loading" ? <Skeleton className="aspect-[16/10] w-full rounded-2xl" /> : <LiveMap />}
    </div>
  );
}
