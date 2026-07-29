import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { StatusPill } from "@/components/ui/StatusPill";
import { actionColorMap, color } from "@/constants/theme";
import { getStageMeta } from "@/domain/workflow";
import type { Shipment } from "@/types/shipment";

const STATUS_LABEL: Record<Shipment["status"], string> = {
  upcoming: "Upcoming",
  active: "In Progress",
  exception: "Needs Attention",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<Shipment["status"], keyof typeof actionColorMap> = {
  upcoming: "info",
  active: "go",
  exception: "danger",
  completed: "go",
  cancelled: "danger",
};

interface JobSummaryCardProps {
  shipment: Shipment;
}

export function JobSummaryCard({ shipment }: JobSummaryCardProps) {
  const stageMeta = getStageMeta(shipment.stage);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${shipment.shipmentNumber}, ${shipment.customerName}, ${STATUS_LABEL[shipment.status]}`}
      onPress={() => router.push(`/job/${shipment.id}` as never)}
      className="rounded-xl bg-bg-elevated border border-border-subtle p-4 active:opacity-80"
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-text-secondary text-[13px] font-semibold">{shipment.shipmentNumber}</Text>
        <StatusPill label={STATUS_LABEL[shipment.status]} color={STATUS_COLOR[shipment.status]} size="sm" />
      </View>
      <Text className="text-text-primary text-[17px] font-bold mb-2">{shipment.customerName}</Text>

      <View className="flex-row items-center mb-1">
        <Ionicons name="arrow-up-circle-outline" size={16} color={color.textSecondary} />
        <Text className="text-text-secondary text-[14px] ml-1.5 flex-1" numberOfLines={1}>
          {shipment.pickup.line1}, {shipment.pickup.city}
        </Text>
      </View>
      <View className="flex-row items-center mb-3">
        <Ionicons name="arrow-down-circle-outline" size={16} color={color.textSecondary} />
        <Text className="text-text-secondary text-[14px] ml-1.5 flex-1" numberOfLines={1}>
          {shipment.delivery.line1}, {shipment.delivery.city}
        </Text>
      </View>

      <View className="flex-row items-center justify-between pt-3 border-t border-border-subtle">
        <View className="flex-row items-center">
          {shipment.isWhiteGlove ? (
            <View className="flex-row items-center mr-3">
              <Ionicons name="sparkles" size={13} color={color.premium} />
              <Text className="text-premium text-[12px] font-semibold ml-1">White Glove</Text>
            </View>
          ) : null}
          <Text className="text-text-tertiary text-[13px]">{shipment.vehicle.label}</Text>
        </View>
        {shipment.status !== "completed" ? (
          <Text className="text-text-tertiary text-[13px] font-medium">{stageMeta.actionLabel}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
