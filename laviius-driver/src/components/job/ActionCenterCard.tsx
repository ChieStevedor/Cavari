import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { actionColorMap } from "@/constants/theme";
import { getActionCenterEntry } from "@/domain/workflow";
import type { Shipment } from "@/types/shipment";

interface ActionCenterCardProps {
  shipment: Shipment;
}

/**
 * The single most important component in the app. Spec: "The first thing
 * the driver sees is the next required action... never make the driver
 * search for the next task." One card, one color-coded action, huge tap
 * target, no ambiguity.
 */
export function ActionCenterCard({ shipment }: ActionCenterCardProps) {
  const entry = getActionCenterEntry(shipment);
  const c = actionColorMap[entry.color];
  const disabled = !entry.route;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Next action: ${entry.label}`}
      disabled={disabled}
      onPress={() => entry.route && router.push(entry.route as never)}
      className="rounded-2xl overflow-hidden active:opacity-90"
      style={{ backgroundColor: c.bg }}
    >
      <View className="p-5">
        <View className="flex-row items-center mb-3">
          <View className="h-2.5 w-2.5 rounded-full mr-2" style={{ backgroundColor: c.dot }} />
          <Text style={{ color: c.fg }} className="text-[13px] font-bold uppercase tracking-wide">
            Next Action
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-text-primary text-[24px] font-bold leading-8">{entry.label}</Text>
            <Text className="text-text-secondary text-[15px] mt-1">
              {shipment.shipmentNumber} · {shipment.customerName}
            </Text>
          </View>
          {!disabled ? (
            <View
              className="h-14 w-14 rounded-full items-center justify-center"
              style={{ backgroundColor: c.fg }}
            >
              <Ionicons name={entry.icon as never} size={26} color="#0B0F19" />
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
