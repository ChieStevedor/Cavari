import { ActionFeedSkeleton, KpiRowSkeleton, QueueSkeleton } from "@/components/dispatcher/shared/Skeleton";

export default function DispatcherLoading() {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 p-4 sm:p-6">
      <KpiRowSkeleton />
      <ActionFeedSkeleton />
      <QueueSkeleton />
    </div>
  );
}
