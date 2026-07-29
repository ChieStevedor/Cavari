import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useShipmentsQuery } from "@/api/queries";
import { JobSummaryCard } from "@/components/job/JobSummaryCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { JobCardSkeleton } from "@/components/ui/Skeleton";
import { selectTodaysShipments } from "@/domain/selectors";
import { useShipmentStore } from "@/stores/shipmentStore";
import type { Shipment } from "@/types/shipment";

type Filter = "all" | "active" | "upcoming" | "completed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
];

function matchesFilter(s: Shipment, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "active") return s.status === "active" || s.status === "exception";
  if (filter === "upcoming") return s.status === "upcoming";
  return s.status === "completed" || s.status === "cancelled";
}

export default function JobsScreen() {
  const insets = useSafeAreaInsets();
  const shipments = useShipmentStore((s) => s.shipments);
  const { isLoading } = useShipmentsQuery();
  const [filter, setFilter] = useState<Filter>("all");

  const todays = useMemo(() => selectTodaysShipments(shipments), [shipments]);
  const filtered = useMemo(() => todays.filter((s) => matchesFilter(s, filter)), [todays, filter]);

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-3 pb-2">
        <Text className="text-text-primary text-[28px] font-bold">Today's Jobs</Text>
        <Text className="text-text-secondary text-[15px] mt-0.5">
          {todays.length} shipment{todays.length === 1 ? "" : "s"} scheduled today
        </Text>
      </View>

      <View className="flex-row gap-2 px-4 pb-3">
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === f.key }}
            onPress={() => setFilter(f.key)}
            className={[
              "px-4 py-2 rounded-full border",
              filter === f.key ? "bg-brand border-brand" : "bg-bg-elevated border-border",
            ].join(" ")}
          >
            <Text className={["text-[13px] font-semibold", filter === f.key ? "text-white" : "text-text-secondary"].join(" ")}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading && todays.length === 0 ? (
        <View className="px-4 gap-3">
          <JobCardSkeleton />
          <JobCardSkeleton />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="calendar-clear-outline"
          title="No jobs here"
          description={
            filter === "all"
              ? "Nothing scheduled for today yet. New assignments will appear here the moment dispatch sends one."
              : `No ${filter} shipments right now.`
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          renderItem={({ item }) => <JobSummaryCard shipment={item} />}
        />
      )}
    </View>
  );
}
