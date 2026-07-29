import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/ui/Card";
import { PrimaryActionBar } from "@/components/ui/PrimaryActionBar";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { color } from "@/constants/theme";
import { useAdvanceWorkflow } from "@/hooks/useAdvanceWorkflow";
import { getCurrentPosition } from "@/lib/location";
import { useShipmentStore } from "@/stores/shipmentStore";

export default function ArrivalScreen() {
  const { id, leg } = useLocalSearchParams<{ id: string; leg: "pickup" | "delivery" }>();
  const insets = useSafeAreaInsets();
  const shipment = useShipmentStore((s) => s.getById(id));
  const advance = useAdvanceWorkflow(id);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    getCurrentPosition()
      .then(setGps)
      .finally(() => setLocating(false));
  }, []);

  if (!shipment) return null;
  const address = leg === "delivery" ? shipment.delivery : shipment.pickup;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Confirm Arrival" showBack={false} />
      <View className="flex-1 px-4 pt-4 items-center">
        <View className="h-20 w-20 rounded-full bg-attention-muted items-center justify-center mb-4">
          <Ionicons name="location" size={36} color={color.attention} />
        </View>
        <Text className="text-text-primary text-[20px] font-bold text-center">{address.label}</Text>
        <Text className="text-text-secondary text-[14px] text-center mt-1 mb-6">
          {address.line1}, {address.city}, {address.state}
        </Text>

        <Card className="w-full flex-row items-center">
          {locating ? (
            <ActivityIndicator color={color.textSecondary} />
          ) : (
            <Ionicons name={gps ? "checkmark-circle" : "warning-outline"} size={18} color={gps ? color.go : color.attention} />
          )}
          <Text className="text-text-secondary text-[13px] ml-2 flex-1">
            {locating ? "Confirming your location…" : gps ? "Location confirmed" : "Location unavailable — you can still confirm manually"}
          </Text>
        </Card>
      </View>

      <PrimaryActionBar label="Confirm Arrival" onPress={() => advance()} />
    </View>
  );
}
