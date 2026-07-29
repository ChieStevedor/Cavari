import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Linking, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionCenterCard } from "@/components/job/ActionCenterCard";
import { StageStepper } from "@/components/job/StageStepper";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { color } from "@/constants/theme";
import { WHITE_GLOVE_TASK_LABELS } from "@/domain/checklists";
import { useLocalSearchParams } from "expo-router";
import { useShipmentStore } from "@/stores/shipmentStore";
import type { Address } from "@/types/shipment";

function SectionLabel({ children }: { children: string }) {
  return <Text className="text-text-secondary text-[13px] font-bold uppercase tracking-wide mb-3">{children}</Text>;
}

function AddressBlock({ title, address, windowStart, windowEnd, isHard }: {
  title: string;
  address: Address;
  windowStart: string;
  windowEnd: string;
  isHard: boolean;
}) {
  const fmt = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <Card className="mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-text-primary text-[15px] font-bold">{title}</Text>
        <StatusPill label={isHard ? "Hard Appointment" : "Flexible Window"} color={isHard ? "attention" : "info"} size="sm" />
      </View>
      <Text className="text-text-primary text-[16px] font-semibold">{address.label}</Text>
      <Text className="text-text-secondary text-[14px] mt-0.5">
        {address.line1}{address.line2 ? `, ${address.line2}` : ""}
      </Text>
      <Text className="text-text-secondary text-[14px]">{address.city}, {address.state} {address.zip}</Text>

      <View className="flex-row items-center mt-2">
        <Ionicons name="time-outline" size={14} color={color.textSecondary} />
        <Text className="text-text-secondary text-[13px] ml-1.5">
          {fmt(windowStart)} – {fmt(windowEnd)}
        </Text>
      </View>

      {address.accessNotes ? (
        <View className="flex-row items-start mt-2 bg-bg-elevated-2 rounded-md p-2.5">
          <Ionicons name="information-circle-outline" size={16} color={color.info} />
          <Text className="text-text-secondary text-[13px] ml-1.5 flex-1">{address.accessNotes}</Text>
        </View>
      ) : null}

      <View className="flex-row gap-2 mt-3">
        {address.contactPhone ? (
          <Button
            label="Call"
            variant="secondary"
            icon={<Ionicons name="call-outline" size={16} color={color.textPrimary} />}
            onPress={() => Linking.openURL(`tel:${address.contactPhone}`)}
          />
        ) : null}
      </View>
    </Card>
  );
}

export default function JobDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const shipment = useShipmentStore((s) => s.getById(id));

  if (!shipment) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <Text className="text-text-secondary">Shipment not found.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScreenHeader title={shipment.shipmentNumber} subtitle={shipment.customerName} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <StageStepper shipment={shipment} />

        <View className="mt-5">
          {shipment.status !== "completed" ? (
            <ActionCenterCard shipment={shipment} />
          ) : (
            <Card>
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={22} color={color.go} />
                <Text className="text-text-primary text-[16px] font-semibold ml-2">Shipment completed</Text>
              </View>
            </Card>
          )}
        </View>

        <View className="mt-6">
          <SectionLabel>Route</SectionLabel>
          <AddressBlock
            title="Pickup"
            address={shipment.pickup}
            windowStart={shipment.pickupWindow.start}
            windowEnd={shipment.pickupWindow.end}
            isHard={shipment.pickupWindow.isHardAppointment}
          />
          <AddressBlock
            title="Delivery"
            address={shipment.delivery}
            windowStart={shipment.deliveryWindow.start}
            windowEnd={shipment.deliveryWindow.end}
            isHard={shipment.deliveryWindow.isHardAppointment}
          />
        </View>

        <View className="mt-3">
          <SectionLabel>Cargo</SectionLabel>
          <Card>
            {shipment.cargo.map((item, idx) => (
              <View
                key={item.id}
                className={["py-2.5", idx > 0 ? "border-t border-border-subtle" : ""].join(" ")}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-text-primary text-[15px] font-medium flex-1 pr-2">{item.description}</Text>
                  <Text className="text-text-secondary text-[14px]">×{item.quantity}</Text>
                </View>
                <View className="flex-row items-center mt-1 gap-3">
                  <Text className="text-text-tertiary text-[12px]">{item.weightLbs} lbs</Text>
                  {item.dimensions ? (
                    <Text className="text-text-tertiary text-[12px]">
                      {item.dimensions.lengthIn}×{item.dimensions.widthIn}×{item.dimensions.heightIn} in
                    </Text>
                  ) : null}
                  {item.isFragile ? <Text className="text-attention text-[12px] font-semibold">Fragile</Text> : null}
                  {item.requiresTwoPerson ? (
                    <Text className="text-premium text-[12px] font-semibold">2-Person Lift</Text>
                  ) : null}
                </View>
              </View>
            ))}
            <View className="flex-row justify-between pt-3 mt-1 border-t border-border-subtle">
              <Text className="text-text-secondary text-[13px]">Total Weight</Text>
              <Text className="text-text-primary text-[13px] font-semibold">{shipment.totalWeightLbs} lbs</Text>
            </View>
          </Card>
        </View>

        <View className="mt-3">
          <SectionLabel>Vehicle</SectionLabel>
          <Card className="flex-row items-center justify-between">
            <View>
              <Text className="text-text-primary text-[15px] font-semibold">{shipment.vehicle.label}</Text>
              <Text className="text-text-secondary text-[13px]">{shipment.vehicle.type} · {shipment.vehicle.licensePlate}</Text>
            </View>
            {shipment.vehicle.liftgate ? <StatusPill label="Liftgate" color="info" size="sm" /> : null}
          </Card>
        </View>

        {shipment.isWhiteGlove ? (
          <View className="mt-3">
            <SectionLabel>White Glove Requirements</SectionLabel>
            <Card>
              {shipment.whiteGloveTasks.map((t, idx) => (
                <View
                  key={t.type}
                  className={["flex-row items-center py-2", idx > 0 ? "border-t border-border-subtle" : ""].join(" ")}
                >
                  <Ionicons name="sparkles-outline" size={16} color={color.premium} />
                  <Text className="text-text-primary text-[14px] ml-2 flex-1">
                    {WHITE_GLOVE_TASK_LABELS[t.type]}
                    {t.detail ? ` — ${t.detail}` : ""}
                  </Text>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        {shipment.specialInstructions || shipment.dispatcherNotes || shipment.carrierNotes ? (
          <View className="mt-3">
            <SectionLabel>Notes</SectionLabel>
            <Card className="gap-3">
              {shipment.specialInstructions ? (
                <View>
                  <Text className="text-text-tertiary text-[12px] font-semibold uppercase mb-1">Special Instructions</Text>
                  <Text className="text-text-primary text-[14px]">{shipment.specialInstructions}</Text>
                </View>
              ) : null}
              {shipment.dispatcherNotes ? (
                <View>
                  <Text className="text-text-tertiary text-[12px] font-semibold uppercase mb-1">Dispatcher Notes</Text>
                  <Text className="text-text-primary text-[14px]">{shipment.dispatcherNotes}</Text>
                </View>
              ) : null}
              {shipment.carrierNotes ? (
                <View>
                  <Text className="text-text-tertiary text-[12px] font-semibold uppercase mb-1">Carrier Notes</Text>
                  <Text className="text-text-primary text-[14px]">{shipment.carrierNotes}</Text>
                </View>
              ) : null}
            </Card>
          </View>
        ) : null}

        {shipment.photos.length > 0 ? (
          <View className="mt-3">
            <SectionLabel>Photos</SectionLabel>
            <View className="flex-row flex-wrap gap-2">
              {shipment.photos.map((p) => (
                <Image key={p.id} source={{ uri: p.localUri }} style={{ width: 88, height: 88, borderRadius: 10 }} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
