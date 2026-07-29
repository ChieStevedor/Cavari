import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useShipmentsQuery } from "@/api/queries";
import { ActionCenterCard } from "@/components/job/ActionCenterCard";
import { JobSummaryCard } from "@/components/job/JobSummaryCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CountdownChip } from "@/components/ui/CountdownChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionCenterSkeleton } from "@/components/ui/Skeleton";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { color } from "@/constants/theme";
import { selectCurrentAssignment, selectNextAssignment } from "@/domain/selectors";
import { useAuthStore } from "@/stores/authStore";
import { useShipmentStore } from "@/stores/shipmentStore";

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="flex-1 items-center py-3 rounded-lg bg-bg-elevated-2 active:opacity-70"
    >
      <Ionicons name={icon} size={22} color={color.textPrimary} />
      <Text className="text-text-primary text-[12px] font-medium mt-1">{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const driver = useAuthStore((s) => s.driver);
  const shipments = useShipmentStore((s) => s.shipments);
  const { isLoading, refetch, isRefetching } = useShipmentsQuery();

  const current = selectCurrentAssignment(shipments);
  const next = selectNextAssignment(shipments, current?.id);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={color.textSecondary} />}
      >
        <View className="mb-5">
          <Text className="text-text-secondary text-[15px]">{greeting},</Text>
          <Text className="text-text-primary text-[28px] font-bold">{driver?.name.split(" ")[0] ?? "Driver"}</Text>
        </View>

        {isLoading && !current ? (
          <ActionCenterSkeleton />
        ) : current ? (
          <>
            <ActionCenterCard shipment={current} />

            <View className="flex-row gap-3 mt-4">
              <CountdownChip targetIso={current.pickupWindow.start} label="Pickup" />
              <CountdownChip targetIso={current.deliveryWindow.start} label="Delivery" />
            </View>

            <View className="flex-row gap-2 mt-4">
              <QuickAction
                icon="call-outline"
                label="Call"
                onPress={() => {
                  const phone = current.pickup.contactPhone ?? current.delivery.contactPhone;
                  if (phone) Linking.openURL(`tel:${phone}`);
                }}
              />
              <QuickAction icon="chatbubble-outline" label="Message" onPress={() => router.push("/(tabs)/messages")} />
              <QuickAction
                icon="document-text-outline"
                label="Job Details"
                onPress={() => router.push(`/job/${current.id}` as never)}
              />
              <QuickAction
                icon="alert-circle-outline"
                label="Report Issue"
                onPress={() => router.push(`/job/${current.id}/report-issue` as never)}
              />
            </View>
          </>
        ) : (
          <EmptyState
            icon="checkmark-done-circle-outline"
            title="Available Today"
            description="You're on duty with no active assignment. Dispatch will notify you the moment a shipment is assigned."
          />
        )}

        {next ? (
          <View className="mt-6">
            <Text className="text-text-secondary text-[13px] font-bold uppercase tracking-wide mb-3">
              Next Assignment
            </Text>
            <JobSummaryCard shipment={next} />
          </View>
        ) : !current ? (
          <Card className="mt-4">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={18} color={color.textSecondary} />
              <Text className="text-text-secondary text-[15px] ml-2 flex-1">Waiting for dispatch to assign your next shipment.</Text>
            </View>
          </Card>
        ) : null}

        <View className="mt-6">
          <Text className="text-text-secondary text-[13px] font-bold uppercase tracking-wide mb-3">Driver Status</Text>
          <Card className="flex-row items-center justify-between">
            <View>
              <Text className="text-text-primary text-[16px] font-semibold capitalize">
                {driver?.status.replace("_", " ") ?? "Off duty"}
              </Text>
              <Text className="text-text-tertiary text-[13px]">{driver?.vehicle?.label ?? "No vehicle assigned"}</Text>
            </View>
            <Button label="Go Off Duty" variant="secondary" onPress={() => {}} />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
